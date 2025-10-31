import { createBrightnessMask } from "../../../utils/WasmProcessor";
import { CanvasContextProps } from "../../image_preview/canvas_context";

export function updateBrightnessMask(context: CanvasContextProps){
    if (context.imageLoaded && context.originalImageData !== null && context.isWasmLoaded) {
        const mask = createBrightnessMask(context.originalImageData, context.filterSettings.halation.brightnessThreshold)
        context.setBrightnessMaskData(mask)
    } else {
        context.setBrightnessMaskData(null)
    }
}


// TODO
export function updateBlurRadius(context: CanvasContextProps){
    console.log("update blur radius")
}

// TODO
export function updateHalationTint(context: CanvasContextProps){
    console.log("update halation tint")
}

