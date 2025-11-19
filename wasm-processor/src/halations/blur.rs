use rayon::{
    iter::{IndexedParallelIterator, IntoParallelIterator, ParallelIterator},
    slice::ParallelSliceMut,
};
use wasm_bindgen::prelude::*;

// Source Logic: https://blog.ivank.net/fastest-gaussian-blur.html

const BOX_PASSES: u8 = 3;

#[inline]
fn weighted_box(box_val: usize, weight: f32) -> u8 {
    (box_val as f32 * weight).round() as u8
}

#[inline]
fn col_idx_to_idx(
    column_idx: usize, /* Which Col */
    idx: usize,        /* Item in col */
    width: usize,
) -> usize {
    return width * idx + column_idx;
}

/*
 Takes in a standard_dev and the num_boxes
 Standard_dev is the radius used for the gauss blur.
 Reutrns the list of box widths to use for our box blurs for n blurs.
*/
fn box_radaii_for_gauss(standard_dev: f32, num_boxes: u8) -> Vec<usize> {
    let variance = standard_dev * standard_dev;
    /*
        variance = Weighted Average or the Sum of squared differences from the mean
        In this case the weighted average for all terms is the same because in the box blur is the same

        variance = 1/w * Sum of squared differences from the mean

        width is 1 + 2r -> r is the radius plus 1 for the starting point

        mean is 0 since it is uniformly symmetric on 0

        so then our variance is (1/w) * Sum i = -r to r of i^2

        We can simplify that to (1/w) * 2 * Sum i = 0 -> r of i^2

        The formula for the summation first n squares is n(2n+1)(n+1)/6

        2 * r(2r+1)(r+1)/6 => r(2r+1)(r+1)/3

        variance = (1/w) * r(2r+1)(r+1)/3
        variance = (1/2r+1) * r(2r+1)(r+1)/3

        variance = r(r+1)/3 = r^2+r/3

        Solving for variance in terms of width

        // why width and not just radius?
            its essentially the same thing solving for radius means we need to use the quadratic eq and will have 2 radii  any way.

        r = w - 1/ 2
        variance  = (w-1/2)^2 + (w-1/2)/ 3

        w ^ 2 - 2w + 1 / 4 / 3 + w -1/2 / 3
        (w ^2 -2w + 1)/ 12 + w-1/6
        w^2 - 2w + 1 + 2w - 2 /12
        variance = w^2 -1 / 12

        <------------ EXAMPLE ------------>

        width = 3
        [-1 0 1 ] eg r = 1
            ^------------------------ starting point is 0

        Mean = -1 + 1 + 0 -> 0

        variance = 3^2 - 1 /12 -> 8/12 => 0.6667
    */

    let ideal_box_width: f32 = ((12.0 * variance / num_boxes as f32) + 1.0).sqrt();

    let mut width_lower: usize = ideal_box_width.floor() as usize;
    if width_lower % 2 == 0 {
        width_lower -= 1;
    }

    let radius_lower = (width_lower - 1) / 2;
    let radius_higher = radius_lower + 1; // same  as width_higher - 1 / 2

    /*

        So now we have 2 odd widths which is what we want
        since we relied on width to be symmetric around 0
        We have the upper width and lower width

        Now we need to figure out how many boxes out of num_boxes to use for the upper and lower widths
        Let m be the number of lower width boxes we want

        variance = m * (wl^2 -1) + (n-m)(wu^2-1)/12
        wu = wl+2
        variance = m * (wl^2 -1) + (n-m)((wl+2)^2-1)/12
                                    (n-m)((wl+2)^2-1) = (n-m) (wl^2 + 4wl+ 3)
                    m * wl^2 - m + n*wl^2 + n * 4wl + 3n - m*wl^2 - m*4wl - 3m
        variance = (n*wl^2 + n * 4wl + 3n - m * 4wl - 4m)/12

        Solving for m

        12*variance = n*wl^2 + n * 4wl + 3n - m * 4wl - 4m
        12 * variance - n*wl^2  - n * 4wl - 3n = - m * 4wl - 4m

        m (-4wl - 4) = 12 * variance - n*wl^2  - n * 4wl - 3n
        m = (12 * variance - n*wl^2  - n * 4wl - 3n)/(-4wl - 4)
    */
    let n = num_boxes as f32;
    let wl = width_lower as f32;

    let num_lower_boxes = ((12.0 * variance - n * wl * wl - 4.0 * wl * n - 3.0 * n)
        / (-4.0 * wl - 4.0))
        .round() as u8;

    let mut box_radaii: Vec<usize> = Vec::new();
    for i in 0..num_boxes {
        if i < num_lower_boxes {
            box_radaii.push(radius_lower);
        } else {
            box_radaii.push(radius_higher);
        }
    }

    box_radaii
}

fn box_blur(input: &mut [u8], target: &mut [u8], width: usize, height: usize, radius: usize) {
    // prob dont need to parallelize bc I think here overhead > gain
    target.copy_from_slice(input);
    box_blur_horizontal_pass(target, input, width, height, radius);
    box_blur_vertical_pass(input, target, width, height, radius);
}

fn box_blur_horizontal_pass(
    input: &[u8],
    target: &mut [u8],
    width: usize,
    _height: usize,
    radius: usize,
) {
    let weight: f32 = 1.0 / (2.0 * radius as f32 + 1.0); // each pixel gets the same weight in a box blur 1/width
    target
        .par_chunks_mut(width)
        .enumerate()
        .for_each(|(row_index, row)| {
            let total_index: usize = row_index * width; // figure out where we are in the full array to index into input matrix
            let mut left_ptr: usize = 0;
            let mut right_ptr: usize = radius;
            let first_val = input[total_index]; // first item in row
            let last_val = input[total_index + width - 1]; // last item in row                                            0    1  ...  r  r + 1  r + 2    2r
            let mut bx = first_val as usize * (radius + 1); // initialize our box with first value until the middle [i[0], i[0] ... i[0], i[0] , i[1] ...i[r-1]]
            for i in 0..radius { bx += input[total_index + i] as usize } // initialize the rest of our box    -------------------------------^ ----^ -------^
            for i in 0..=radius {
                // first r terms are special as we need to remove the first term r times form our sliding window
                bx += input[total_index + right_ptr] as usize; // add new term
                bx -= first_val as usize; // remove first term
                right_ptr += 1; // increment ptr
                row[i] = weighted_box(bx, weight);
            }
            // now
            // our bx looks like [i[0], i[1], i[2]... i[2r]]
            // our new row is filled with r terms
            // our right pointer = 2r + 1
            // left pointer is at 0

            // sliding window normal
            for i in radius + 1..width - radius {
                
                bx += input[total_index + right_ptr] as usize;
                bx -= input[total_index + left_ptr] as usize;
                right_ptr += 1;
                left_ptr += 1;
                row[i] = weighted_box(bx, weight);
            }

            // now we are at the end of the window
            // [ i[w-2-1] ... i[w-1]]
            // right ptr = w-1-r
            // now we keep adding the last value to the end.
            for i in width - radius..width {
                bx += last_val as usize;
                bx -= input[total_index + left_ptr] as usize;
                left_ptr += 1;
                row[i] = weighted_box(bx, weight);
            }
        });
}

fn box_blur_vertical_pass(
    input: &[u8],
    target: &mut [u8],
    width: usize,
    height: usize,
    radius: usize,
) {
    let weight: f32 = 1.0 / (2.0 * radius as f32 + 1.0); // each pixel gets the same weight in a box blur 1/width

    // little bit of trickery since the rust compiler wont let us access the array in parallel threads, even though we know we will write to each pixel only once
    let target_ptr = target.as_mut_ptr() as usize;

    (0..width).into_par_iter().for_each(|col_idx| {
        let target_ptr = target_ptr as *mut u8;

        let mut left_pointer = 0;
        let mut right_pointer = radius;
        let first_val = input[col_idx_to_idx(col_idx, 0, width)] as usize;
        let last_val = input[col_idx_to_idx(col_idx, height - 1, width)] as usize;
        let mut bx = first_val * (radius + 1); // box of [col[0], col[0]...]

        for i in 0..radius { bx += input[col_idx_to_idx(col_idx, i, width)] as usize; } // set up box with r terms to the right of col[0]
        // box now looks like [col[0] * r+2, ..., col[1], col[r-1]] -> bx len  = 2r+1
        for i in 0..=radius {
            bx += input[col_idx_to_idx(col_idx, right_pointer, width)] as usize; // add new term
            bx -= first_val as usize; // remove first term
            right_pointer += 1; // increment ptr
            // first r terms are special as we need to remove the first term r times from our sliding window
            unsafe {
                *target_ptr.add(col_idx_to_idx(col_idx, i, width)) = weighted_box(bx, weight);
            };
        }
        // now our box looks like [col[0], col[1],... col[2r]]
        // so we can implement the sliding window until we get to width - r, where we will need to start using the last value as the filler

        for i in radius + 1..height-radius {
            // slide window over
            bx += input[col_idx_to_idx(col_idx, right_pointer, width)] as usize; // shift right post
            bx -= input[col_idx_to_idx(col_idx, left_pointer, width)] as usize; //shift left post

            right_pointer +=1;
            left_pointer += 1;

            unsafe {
                *target_ptr.add(col_idx_to_idx(col_idx, i, width)) = weighted_box(bx, weight);
            }

        }

        // now we have reached the end of our array and our radius is longer than the number of values to the right
        // here we fill with last value
        for i in height-radius..height {
            bx += last_val;
            bx -= input[col_idx_to_idx(col_idx, left_pointer, width)] as usize;
            left_pointer += 1;

            unsafe {
                *target_ptr.add(col_idx_to_idx(col_idx, i, width)) = weighted_box(bx, weight);
            }
        }

    });
}

/*
 brightness_mask is a "binary" array of 0 and 255 that indicates if a pixel is opaque or not
 our gauss blur will then blur this binary array based on the radius passed in!
 See notes/convolutions.md on why I am using an approximation
*/
#[wasm_bindgen]
pub fn gauss_blur(input: &mut [u8], width: usize, height: usize, radius: f32) -> Vec<u8> {
    let mut target: Vec<u8> = Vec::from(&mut *input);

    // we are doing 3 passes of the gauss blur with a variance = to our radius^2
    let box_radaii = box_radaii_for_gauss(radius, BOX_PASSES);
    box_blur(input, &mut target, width, height, box_radaii[0]);
    box_blur(&mut target, input, width, height, box_radaii[1]);
    box_blur(input, &mut target, width, height, box_radaii[2]);

    target
}
