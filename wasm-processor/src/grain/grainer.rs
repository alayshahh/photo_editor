use image::{imageops::resize, ImageBuffer, Rgb};
use rand::distributions::Distribution;
use statrs::distribution::Normal;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
/**
 * Creates the final noise mask to use to apply grain to the photo.
 * 3 masks created that are summed and returned.
 * We will then use the returned Vec<f32> in the final composition.
 * Since we dont want to update the final image, we will store it as a mask, but it needs to scale to the image so it will need to be applied at the end.
 * (still deciding before or after halation)
 */
pub fn get_noise_mask(
    width: u32,
    height: u32,
    fine_grain_intensity: f32,
    medium_grain_intensity: f32,
    large_grain_intensity: f32,
) -> Vec<f32> {
    // 1. Generate Layers
    let fine_grain_noise = gen_noise_mask(width, height, fine_grain_intensity);

    // We can't zip Option<ImageBuffer>, so we create a mandatory zero-filled buffer if the intensity is 0.
    let medium_layer = if medium_grain_intensity > 0.0 {
        let noise = gen_noise_mask(width / 2, height / 2, medium_grain_intensity);
        // We use an intermediate raw Vec<f32> to avoid unnecessary allocations
        resize(&noise, width, height, image::imageops::FilterType::Gaussian)
    } else {
        // Create an empty Rgb<f32> image of the final size
        image::ImageBuffer::<image::Rgb<f32>, Vec<f32>>::new(width, height)
    };

    let large_layer = if large_grain_intensity > 0.0 {
        let noise = gen_noise_mask(width / 4, height / 4, large_grain_intensity);
        resize(&noise, width, height, image::imageops::FilterType::Gaussian)
    } else {
        image::ImageBuffer::<image::Rgb<f32>, Vec<f32>>::new(width, height)
    };

    let mut noise_mask = image::ImageBuffer::<image::Rgba<f32>, Vec<f32>>::new(width, height);

    // 2. Performant Combination using Zipping
    // Use the `ImageBuffer::pixels()` iterators for fast sequential access.
    // The ImageBuffer::pixels_mut() gives us (x, y, &mut pixel), but we just want the pixel value here.

    let fine_iter = fine_grain_noise.pixels();
    let medium_iter = medium_layer.pixels();
    let large_iter = large_layer.pixels();

    // 2. Combine the three iterators into a flat tuple of length 3
    let combined_pixels = fine_iter
        .zip(medium_iter)
        .zip(large_iter)
        // Use .map to flatten the nested tuple: ((A, B), C) -> (A, B, C)
        .map(|((fine, medium), large)| (fine, medium, large));

    // 3. Zip the final mask's mutable iterator with the new flat iterator
    for ((_x, _y, final_pixel), (fine_pixel, medium_pixel, large_pixel)) in
        noise_mask.enumerate_pixels_mut().zip(combined_pixels)
    {
        // Add the R, G, B channels
        final_pixel[0] = fine_pixel[0] + medium_pixel[0] + large_pixel[0]; // R
        final_pixel[1] = fine_pixel[1] + medium_pixel[1] + large_pixel[1]; // G
        final_pixel[2] = fine_pixel[2] + medium_pixel[2] + large_pixel[2]; // B

        // Alpha channel (1.0 for opaque f32 images)
        final_pixel[3] = 1.0;
    }

    noise_mask.into_raw()
}

/**
 * Helper function to create an ImageBuffer given the dimensions and the variance
 */
fn gen_noise_mask(width: u32, height: u32, variance: f32) -> ImageBuffer<Rgb<f32>, Vec<f32>> {
    let mut noise_mask: ImageBuffer<Rgb<f32>, Vec<f32>> =
        ImageBuffer::<Rgb<f32>, Vec<f32>>::new(width, height);
    if variance <= 0.0 {
        return noise_mask;
    }

    let distribution = Normal::new(
        0.0,                    /* We want the mean to be near 0 */
        variance.sqrt() as f64, /* Custom variance(grain intensity) for the layer */
    )
    .unwrap();

    let mut rand = rand::thread_rng();

    for pixel in noise_mask.pixels_mut() {
        pixel[0] = distribution.sample(&mut rand) as f32;
        pixel[1] = distribution.sample(&mut rand) as f32;
        pixel[2] = distribution.sample(&mut rand) as f32;
    }

    noise_mask
}
