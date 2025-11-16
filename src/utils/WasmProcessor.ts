import * as Wasm from "../pkg"
import { CanvasContextProps } from "../components/image_preview/canvas_context";


// Helper function to convert hex color string to R, G, B components
function hexToRgb(hex: string): [number, number, number] {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b];
}

export function colorizeMask(
    blurredMaskData: ImageData,
    tintColor: string
): ImageData {

    const colorizedBuffer = blurredMaskData.data.slice();
    const [r, g, b] = hexToRgb(tintColor);

    Wasm.color_blurred_mask(
        colorizedBuffer as unknown as Uint8Array, // in place mutation
        r,
        g,
        b
    );
    return new ImageData(
        colorizedBuffer,
        blurredMaskData.width,
        blurredMaskData.height
    )
}

export function createBrightnessMask(originalData: ImageData, threshold: number) {
    const inputMatrix = originalData.data.slice();
    Wasm.create_brightness_mask(inputMatrix as unknown as Uint8Array, threshold);
    return new ImageData(
        inputMatrix,
        originalData.width,
        originalData.height
    );
}

export function createCompositeImage(imageData: ImageData, halationMaskImageData: ImageData | null, grainMask: Float32Array | null): ImageData {
    const inputMatrix = imageData.data.slice();
    if (grainMask) {
        Wasm.overlay_grain_mask(inputMatrix as unknown as Uint8Array, grainMask);
    }
    if (halationMaskImageData) {
        Wasm.overlay_halation(inputMatrix as unknown as Uint8Array, halationMaskImageData.data as unknown as Uint8Array);
    }

    return new ImageData(


        inputMatrix,
        imageData.width,
        imageData.height
    );
}

export function createGrainMask(width: number, height: number, largeGrainIntensity: number, mediumGrainIntensity: number, fineGrainIntensity: number): Float32Array {
    console.log(`Calling wasm get noise mask with width: ${width}, height: ${height}, largeGrainIntensity${largeGrainIntensity}, mediumGrainIntensity: ${mediumGrainIntensity}, fineGrainIntensity: ${fineGrainIntensity}`)
    return Wasm.get_noise_mask(width, height, fineGrainIntensity, mediumGrainIntensity, largeGrainIntensity);
}


export async function initWasmProcessor(ctx: CanvasContextProps): Promise<void> {
    if (ctx.isWasmLoaded) {
        return;
    }

    // The wasm-pack glue code often exports a default 'init' function 
    // that handles the fetching and instantiation of the .wasm binary.
    try {
        // We call the generated init function. It returns a Promise.
        await Wasm.default(); // <--- This is the core loading step
        ctx.setIsWasmLoaded(true)
        console.log("WASM module successfully loaded and instantiated.");
    } catch (err) {
        throw new Error(`WASM initialization failed: ${err}`);
    }
}

export const WasmProcessor = Wasm;