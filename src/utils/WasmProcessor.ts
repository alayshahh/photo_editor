import * as Wasm from "../pkg"
import { CanvasContextProps } from "../components/image_preview/canvas_context";

export function createBrightnessMask(originalData: ImageData, threshold: number){
    const inputMatrix = originalData.data.slice();
    Wasm.create_brightness_mask(inputMatrix as unknown as Uint8Array, threshold);
    return new ImageData(
        inputMatrix.slice(), 
        originalData.width,
        originalData.height
    );
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