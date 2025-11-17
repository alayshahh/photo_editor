use rayon::prelude::*;
use wasm_bindgen::prelude::*;
// Helper function to convert a u8 (0-255) to an f32 (0.0-1.0).
#[inline]
fn u8_to_f32(c: u8) -> f32 {
    c as f32 / 255.0
}

// Helper function to convert an f32 (0.0-1.0) to a u8 (0-255), using floor() for truncation.
#[inline]
fn f32_to_u8(c: f32) -> u8 {
    let val = c * 255.0;
    let clamped = val.min(255.0).max(0.0);
    clamped.floor() as u8
}

#[wasm_bindgen]
pub fn overlay_halation(base: &mut [u8], halation_mask: &[u8]) {

    base.par_chunks_mut(4).enumerate().for_each(|(index, pixel)|{
        let rgb_index = index * 4;
        let pixel_alpha = u8_to_f32(pixel[3]);
        let halation_alpha = u8_to_f32(halation_mask[rgb_index+3]);
        let final_alpha = pixel_alpha + halation_alpha * (1.0 - pixel_alpha);

        pixel[0] = mix_halation_colors(pixel_alpha, halation_alpha, u8_to_f32(pixel[0]), u8_to_f32(halation_mask[rgb_index]));
        pixel[1] = mix_halation_colors(pixel_alpha, halation_alpha, u8_to_f32(pixel[1]), u8_to_f32(halation_mask[rgb_index + 1]));
        pixel[2] = mix_halation_colors(pixel_alpha, halation_alpha, u8_to_f32(pixel[2]), u8_to_f32(halation_mask[rgb_index + 2]));
        pixel[3] = f32_to_u8(final_alpha);

    });
}

fn mix_halation_colors(base_a: f32, mask_a: f32, base_c: f32, mask_c: f32) -> u8 {
    let base_c_a = base_a * base_c;
    let mask_c_a= mask_a * mask_c;
    f32_to_u8(base_c_a.max(mask_c_a))
}

#[wasm_bindgen]
pub fn overlay_grain_mask(image: &mut [u8], grain_mask: &[f32]) {
    image
        .par_chunks_mut(4)
        .enumerate()
        .for_each(|(index, pixel)| {
            let rgb_index = index * 4;
            pixel[0] = f32_to_u8(u8_to_f32(pixel[0]) + grain_mask[rgb_index]);
            pixel[1] = f32_to_u8(u8_to_f32(pixel[1]) + grain_mask[rgb_index + 1]);
            pixel[2] = f32_to_u8(u8_to_f32(pixel[2]) + grain_mask[rgb_index + 2]);
            // im skipping alpha here since idt i want to make this more or less opaque. simple pixel addition
        });
}
