use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn create_brightness_mask(
    img_data:&mut [u8],
    threshold: u8
) {
    let mut pixel = 0;
    while pixel < img_data.len() {
        // luminance for sRGB => .2126 * R+.7152 * G+.0722 * B
        let luminance =  0.2126 * img_data[pixel] as f64 + 0.7152 * img_data[pixel+1] as f64 + 0.0722 * img_data[pixel+2] as f64;
        if luminance > threshold as f64 {
            // white brightness mask
            img_data[pixel] = 255;
            img_data[pixel+1] = 255;
            img_data[pixel+3] = 255

        } else {
            // other wise black basically its a binary mask
            img_data[pixel] = 0;
            img_data[pixel+1] = 0;
            img_data[pixel+2] = 0;
        }
        // ignore alpha channel 
        pixel += 4; 
    }
}