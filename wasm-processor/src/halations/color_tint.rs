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

// Safety threshold for near-zero alpha (e.g., 1/255) to prevent division errors.
const EPSILON: f32 = 0.003921568;

#[wasm_bindgen]
pub fn lighten_overlay_image(base: &mut [u8], overlay: &[u8]) {
    let mut pixel = 0;
    while pixel < base.len() {
        let base_a = u8_to_f32(base[pixel + 3]);
        let overlay_a = u8_to_f32(overlay[pixel + 3]);

        // if both pixels are not transparent

        let final_a = base_a + overlay_a * (1.0 - base_a);

        for i in 0..=2 {
            let base_c = u8_to_f32(base[pixel + i]);
            let overlay_c = u8_to_f32(overlay[pixel + i]);
            let base_c_a = if base_a > EPSILON { base_c * base_a } else { 0.0 };
            let overlay_c_a = if overlay_a > EPSILON {
                overlay_c * overlay_a
            } else {
                0.0
            };
            let max_c_a = base_c_a.max(overlay_c_a);
            base[pixel + i] = f32_to_u8(max_c_a)
        }
        base[pixel + 3] = f32_to_u8(final_a);

        // other wise the only halation pixel is transparent in which case we dont do anyting
        pixel += 4;
    }
}
