use wasm_bindgen::{prelude::*};

#[wasm_bindgen]
pub fn color_blurred_mask(
    blur_mask: &mut [u8],
    r: u8,
    g: u8,
    b: u8
) {
    let mut pixel = 0;
    while pixel < blur_mask.len(){
        // greyscale mask so r=b=g as of now
        let alpha = blur_mask[pixel];

        blur_mask[pixel] = r; // red channel
        blur_mask[pixel+1] = g; // green channel
        blur_mask[pixel+2] = b; // blue channel
        blur_mask[pixel+3] = alpha; //alpha (opacity for which we use the greyscale value for)
         
         pixel += 4;
    }

}


#[inline]
fn u8_to_f32(c: u8) -> f32 {
    c as f32 / 255.0
}

#[inline]
fn f32_to_u8(c: f32) -> u8 {
    (c * 255.0).round().min(255.0).max(0.0) as u8
}

#[wasm_bindgen]
pub fn lighten_overlay_image(
    base: &mut [u8],
    overlay: &[u8]
){
    let mut pixel = 0;
    while pixel < base.len() {
        let base_a = u8_to_f32(base[pixel+3]);
        let overlay_a = u8_to_f32(overlay[pixel+3]);
        
        if base_a > 0.0 && overlay_a > 0.0 { 
            // if both pixels are not transparent
            

            let final_a = base_a + overlay_a * (1.0 - base_a);

            for i in 0..=2 {
                let base_c = u8_to_f32(base[pixel+i]);
                let overlay_c = u8_to_f32(overlay[pixel+i]);
                let base_c_a = base_c / base_a;
                let overlay_c_a = overlay_c / overlay_a;
                let max_c_a = base_c_a.max(overlay_c_a);
                let result_c_a = (1. - overlay_a) * base_c + (1. - base_a) * overlay_c + base_a * overlay_a * max_c_a;
                let final_c = result_c_a / final_a;
                base[pixel+i] = f32_to_u8(final_c)

            }
            base[pixel+3] = f32_to_u8(final_a);
            

        } else if overlay_a > 0.0 && base_a == 0.0 { 
            // if only the halation mask pixel is non zero 
            // and the image pixel alpha is 0 (edge case but might as well handle)
            // just set it as the halation pixel
            base[pixel] = overlay[pixel];
            base[pixel+1] = overlay[pixel+1];
            base[pixel+2] = overlay[pixel+2];
            base[pixel+3] = overlay[pixel+3];
        }
        // other wise the only halation pixel is transparent in which case we dont do anyting
        pixel += 4;
    }

}