extern crate image;
use image::{imageops::resize, ImageBuffer, Rgb, Rgba};

use rand::distributions::Distribution;
use statrs::distribution::{Normal};

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
    let fine_grain_noise = gen_noise_mask(width, height, fine_grain_intensity);
    let mut medium_grain_noise = gen_noise_mask(width / 2, height / 2, medium_grain_intensity);
    medium_grain_noise = resize(
        &medium_grain_noise,
        width,
        height,
        image::imageops::FilterType::Gaussian,
    );
    let mut large_grain_noise = gen_noise_mask(width / 4, height / 4, large_grain_intensity);
    large_grain_noise = resize(
        &large_grain_noise,
        width,
        height,
        image::imageops::FilterType::Gaussian,
    );

    let mut noise_mask = ImageBuffer::<Rgba<f32>, Vec<f32>>::new(width, height);
    for (x, y, final_mutable_pixel) in noise_mask.enumerate_pixels_mut() {
        let final_pixel_ref = &mut final_mutable_pixel.0;
        let fine_pixel = fine_grain_noise.get_pixel(x, y).0;
        let medium_pixel = medium_grain_noise.get_pixel(x, y).0;
        let large_pixel = large_grain_noise.get_pixel(x, y).0;

        // red
        final_pixel_ref[0] = fine_pixel[0] + medium_pixel[0] + large_pixel[0];
        // green
        final_pixel_ref[1] = fine_pixel[1] + medium_pixel[1] + large_pixel[1];
        // blue
        final_pixel_ref[2] = fine_pixel[2] + medium_pixel[2] + large_pixel[2];
        // alpha
        final_pixel_ref[3] = 255.0;
    }
    noise_mask.into_raw()
}


/**
 * Helper function to create an ImageBuffer given the dimensions and the variance
 */
fn gen_noise_mask(width: u32, height: u32, variance: f32) -> ImageBuffer<Rgb<f32>, Vec<f32>> {
    let mut noise_mask: ImageBuffer<Rgb<f32>, Vec<f32>> =
        ImageBuffer::<Rgb<f32>, Vec<f32>>::new(width, height);

    let distribution = Normal::new(
        0.0,             /* We want the mean to be near 0 */
        variance.sqrt() as f64, /* Custom variance(grain intensity) for the layer */
    )
    .unwrap();

    let mut rand = rand::rngs::OsRng;

    for pixel in noise_mask.pixels_mut() {
        pixel[0] = distribution.sample(&mut rand) as f32;
        pixel[1] = distribution.sample(&mut rand) as f32;
        pixel[3] = distribution.sample(&mut rand) as f32;
    }

    noise_mask
}
