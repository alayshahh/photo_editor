use wasm_bindgen::prelude::*;
use rayon::prelude::*;

#[wasm_bindgen]
pub fn color_blurred_mask(blur_mask: &[u8], r: u8, g: u8, b: u8) -> Vec<u8> {
    let mut colorized_mask: Vec<u8> = vec![0; blur_mask.len() * 4]; // blur mask is just a list of alpha vals
    colorized_mask.par_chunks_mut(4).enumerate().for_each(|(index, pixel)| {
        pixel[3] = blur_mask[index]; // alpha  = r=g=b
        pixel[0] = r;
        pixel[1] = g;
        pixel[2] = b;
    });
    colorized_mask
}

