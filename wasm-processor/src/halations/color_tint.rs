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
    image: &mut [u8],
    halation_mask: &[u8]
){
    let mut pixel = 0;
    while pixel < image.len() {
 
        
        if halation_mask[pixel+3] > 0 && image[pixel+3] > 0 { 
            // if both pixels are not transparent

            let image_alpha_normalized = u8_to_f32(image[pixel+3]);
            let mask_alpha_normalized = u8_to_f32(halation_mask[pixel+3]);

            let resulting_alpha_normalized = image_alpha_normalized + mask_alpha_normalized * (1.0 -image_alpha_normalized);

            for i in 0..=2 {
                let image_color_alpha_normalized = (u8_to_f32(image[pixel+i]))/image_alpha_normalized;
                let mask_color_alpha_normalized = (u8_to_f32(halation_mask[pixel+i]))/mask_alpha_normalized;
                let max_color_alpha_normal = image_color_alpha_normalized.max(mask_color_alpha_normalized);

                image[pixel+i] = f32_to_u8((((1.0-mask_alpha_normalized)*image_color_alpha_normalized) + ((1.0-image_alpha_normalized)*mask_color_alpha_normalized) + (image_alpha_normalized * mask_alpha_normalized * max_color_alpha_normal))/resulting_alpha_normalized);

            }
            image[pixel+3] = f32_to_u8(resulting_alpha_normalized);
            

        } else if halation_mask[pixel+3] > 0 { 
            // if only the halation mask pixel is non zero 
            // and the image pixel alpha is 0 (edge case but might as well handle)
            // just set it as the halation pixel
            image[pixel] = halation_mask[pixel];
            image[pixel+1] = halation_mask[pixel+1];
            image[pixel+2] = halation_mask[pixel+2];
            image[pixel+3] = halation_mask[pixel+3];
        }
        // other wise the only halation pixel is transparent in which case we dont do anyting
        pixel += 4;
    }

}