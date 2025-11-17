use image::{imageops::resize, ImageBuffer, Rgba};
use rand::{rngs::ThreadRng, Rng};
use rayon::prelude::*;
use wasm_bindgen::prelude::*;

const SAMPLES: i32 = 4;

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
    let mut sum_masks = false;
    let noise_mask = if fine_grain_intensity > 0.0 {
        gen_noise_mask(width, height, fine_grain_intensity)
    } else {
        image::ImageBuffer::<image::Rgba<f32>, Vec<f32>>::new(width, height)
    };

    let medium_mask = if medium_grain_intensity > 0.0 {
        sum_masks = true;
        let noise = gen_noise_mask(width / 2, height / 2, medium_grain_intensity);
        resize(&noise, width, height, image::imageops::FilterType::Gaussian)
    } else {
        image::ImageBuffer::<image::Rgba<f32>, Vec<f32>>::new(width, height)
    };

    let large_mask = if large_grain_intensity > 0.0 {
        sum_masks = true;
        let noise = gen_noise_mask(width / 4, height / 4, large_grain_intensity);
        resize(&noise, width, height, image::imageops::FilterType::Gaussian)
    } else {
        image::ImageBuffer::<image::Rgba<f32>, Vec<f32>>::new(width, height)
    };

    let mut noise_mask_raw = noise_mask.into_raw();

    if sum_masks {
        let medium_raw = medium_mask.into_raw();
        let large_raw = large_mask.into_raw();

        // parallel processing!!
        noise_mask_raw
            .par_chunks_mut(4)
            .enumerate()
            .for_each(|(index, pixel_chunk)| {
                let raw_index = index * 4;
                pixel_chunk[0] += medium_raw[raw_index] + large_raw[raw_index];
                pixel_chunk[1] += medium_raw[raw_index + 1] + large_raw[raw_index + 1];
                pixel_chunk[2] += medium_raw[raw_index + 2] + large_raw[raw_index + 2];
                pixel_chunk[3] = 1.0; 
            });
    }
    noise_mask_raw
}

/**
 * Helper function to create an ImageBuffer given the dimensions and the variance
 */
fn gen_noise_mask(width: u32, height: u32, variance: f32) -> ImageBuffer<Rgba<f32>, Vec<f32>> {
    let mut noise_mask: ImageBuffer<Rgba<f32>, Vec<f32>> =
        ImageBuffer::<Rgba<f32>, Vec<f32>>::new(width, height);
    if variance <= 0.0 {
        return noise_mask;
    }

    // parallel processing !! this doesn't need to be sequential each pixel (heck even each color channel) is independent 
    noise_mask
        .as_mut()
        .par_chunks_mut(4)
        .for_each(|pixel_chunk| {
            let mut rand = rand::thread_rng();
            pixel_chunk[0] = normal_approx_noise(&mut rand, variance); // red
            pixel_chunk[1] = normal_approx_noise(&mut rand, variance); // green
            pixel_chunk[2] = normal_approx_noise(&mut rand, variance); // blue
            pixel_chunk[3] = 1.0; // alpha
        });

    noise_mask
}

fn normal_approx_noise(rng: &mut ThreadRng, variance: f32) -> f32 {
    let mut noise_sum = 0.0;
    for _ in 0..SAMPLES {
        noise_sum += rng.gen_range(-1.0..1.0);
    }
    noise_sum * variance
}
