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
    blurredMaskData: Uint8Array,
    tintColor: string
): Uint8Array {
    const [r, g, b] = hexToRgb(tintColor);

    return Wasm.color_blurred_mask(
        blurredMaskData, // in place mutation
        r,
        g,
        b
    );
}

export function createBrightnessMask(originalData: ImageData, threshold: number): Uint8Array {
    return Wasm.create_brightness_mask(originalData.data as unknown as Uint8Array, threshold);
}

export function blurBrightnessMask(brightness_mask: Uint8Array, width: number, height: number, radius: number) {
    return Wasm.gauss_blur(brightness_mask.slice(), width, height, radius);
}

export function createCompositeImage(imageData: ImageData, halationMaskImageData: Uint8Array | null, grainMask: Float32Array | null): ImageData {
    const inputMatrix = imageData.data.slice();
    if (grainMask) {
        Wasm.overlay_grain_mask(inputMatrix as unknown as Uint8Array, grainMask);
    }
    if (halationMaskImageData) {
        Wasm.overlay_halation(inputMatrix as unknown as Uint8Array, halationMaskImageData);
    }

    return new ImageData(
        inputMatrix,
        imageData.width,
        imageData.height
    );
}

export function createGrainMask(width: number, height: number, largeGrainIntensity: number, mediumGrainIntensity: number, fineGrainIntensity: number): Float32Array {
    return Wasm.get_noise_mask(width, height, fineGrainIntensity, mediumGrainIntensity, largeGrainIntensity);
}


export async function initWasmProcessor(ctx: CanvasContextProps): Promise<void> {
    if (ctx.isWasmLoaded) {
        return;
    }
    ctx.setIsWasmLoaded(true);
    try {
        
        
        let wasm = await Wasm.default();

        console.log(wasm.memory.buffer.byteLength);
        console.log(wasm.memory.buffer instanceof SharedArrayBuffer);  // returns false for some reason


        const numberOfThreads = navigator.hardwareConcurrency;
        console.log(`Initializing thread pool with ${numberOfThreads} threads.`);

        await Wasm.initThreadPool(numberOfThreads);
        ctx.setIsWasmLoaded(true)

        console.log("WASM module successfully loaded and instantiated.");
    } catch (err) {
        // ctx.setIsWasmLoaded(false)
        throw err;
    }
}

