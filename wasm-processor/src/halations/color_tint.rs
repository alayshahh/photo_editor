use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn color_blurred_mask(blur_mask: &mut [u8], r: u8, g: u8, b: u8) {
    let mut pixel = 0;
    while pixel < blur_mask.len() {
        // greyscale mask so r=b=g as of now
        let alpha = blur_mask[pixel];

        blur_mask[pixel] = r; // red channel
        blur_mask[pixel + 1] = g; // green channel
        blur_mask[pixel + 2] = b; // blue channel
        blur_mask[pixel + 3] = alpha; //alpha (opacity for which we use the greyscale value for)

        pixel += 4;
    }
}

