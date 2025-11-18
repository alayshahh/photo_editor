use wasm_bindgen::prelude::*;
use rayon::prelude::*;

#[wasm_bindgen]
pub fn color_blurred_mask(blur_mask: &mut [u8], r: u8, g: u8, b: u8) {
    blur_mask.par_chunks_mut(4).for_each(|pixel| {
        pixel[3] = pixel[0]; // alpha  = r=g=b
        pixel[0] = r;
        pixel[1] = g;
        pixel[2] = b;
    });
}

