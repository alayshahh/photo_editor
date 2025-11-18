use wasm_bindgen::prelude::*;
use rayon::prelude::*;

#[wasm_bindgen]
pub fn create_brightness_mask(
    img_data:&mut [u8],
    threshold: u8
) {

    img_data
    .par_chunks_mut(4) // parallel processing !! chunk by 4 RGBA but not modifying alpha.
    .for_each(| pixel| {
        // luminance for sRGB => .2126 * R+.7152 * G+.0722 * B
        let luminance = 0.2126 * pixel[0] as f32 + 0.7152 * pixel[1] as f32 + 0.0722 * pixel[2] as f32;
        if luminance > threshold as f32 {
            pixel[0] = 255;
            pixel[1] = 255;
            pixel[2] = 255;
        } else {
            pixel[0] = 0;
            pixel[1] = 0;
            pixel[2] = 0;
        }
    });
}