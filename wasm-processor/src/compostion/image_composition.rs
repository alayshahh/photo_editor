use wasm_bindgen::prelude::*;
/// Helper function to convert a u8 (0-255) to an f32 (0.0-1.0).
#[inline]
fn u8_to_f32(c: u8) -> f32 {
    c as f32 / 255.0
}

/// Helper function to convert an f32 (0.0-1.0) to a u8 (0-255), using floor() for truncation.
/// This typically yields visual results closer to browser canvas implementations.
#[inline]
fn f32_to_u8(c: f32) -> u8 {
    // 1. Scale by 255
    let val = c * 255.0;
    // 2. Clamp: Ensure the value is within [0.0, 255.0]
    let clamped = val.min(255.0).max(0.0);
    // 3. Truncate (floor): Convert to integer by discarding the fractional part
    clamped.floor() as u8
}

#[wasm_bindgen]
pub fn overlay_halation(base: &mut [u8], halation_mask: &[u8]) {
    let mut pixel = 0;
    while pixel < base.len() {
        let base_a = u8_to_f32(base[pixel + 3]);
        let halation_mask_a = u8_to_f32(halation_mask[pixel + 3]);

        // if both pixels are not transparent

        let final_a = base_a + halation_mask_a * (1.0 - base_a);

        for i in 0..=2 {
            let base_c = u8_to_f32(base[pixel + i]);
            let halation_mask_c = u8_to_f32(halation_mask[pixel + i]);
            let base_c_a = if base_a > 0.0 { base_c * base_a } else { 0.0 };
            let halation_mask_c_a = if halation_mask_a > 0.0 {
                halation_mask_c * halation_mask_a
            } else {
                0.0
            };
            let max_c_a = base_c_a.max(halation_mask_c_a);
            base[pixel + i] = f32_to_u8(max_c_a)
        }
        base[pixel + 3] = f32_to_u8(final_a);

        // other wise the only halation pixel is transparent in which case we dont do anyting
        pixel += 4;
    }
}


#[wasm_bindgen]
pub fn overlay_grain_mask(image: &mut [u8], grain_mask: &[f32]) {
    let mut pixel = 0;
    while pixel < image.len() {
        // 1 liner per pixel lol
        image[pixel] = f32_to_u8(u8_to_f32(image[pixel]) + grain_mask[pixel]);
        image[pixel+1]= f32_to_u8(u8_to_f32(image[pixel+1]) + grain_mask[pixel+1]);
        image[pixel+2] = f32_to_u8(u8_to_f32(image[pixel+2]) + grain_mask[pixel+2]);
        // im skipping aplpha here since idt i want to make this more or less opaque. simple pixel addition
        pixel += 4;
    }
}

