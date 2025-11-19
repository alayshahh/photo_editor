import { createBrightnessMask, colorizeMask, createCompositeImage, blurBrightnessMask } from "../../../utils/WasmProcessor";
import { CanvasContextProps } from "../../image_preview/canvas_context";

export function updateBrightnessMask(context: CanvasContextProps):void {
    if (context.imageLoaded && context.originalImageData !== null && context.isWasmLoaded) {
        let mask = 
        context.setBrightnessMaskData(createBrightnessMask(context.originalImageData, context.filterSettings.halation.brightnessThreshold))
        console.log(context.brightnessMaskData)
    } else {
        context.setBrightnessMaskData(null)
    }
}



export function updateBlurRadius(context: CanvasContextProps):void {
    const blur_radius = context.filterSettings.halation.blurRadius
    if (!context.brightnessMaskData || !context.originalImageData) {
        context.setBlurredHalationLayerData(null) // Clear the layer to halt the chain
        return
    }
    if (blur_radius == 0) { // no blur needed with 0 blur radius
        context.setBlurredHalationLayerData(context.brightnessMaskData)
        return
    }
    context.setBlurredHalationLayerData(blurBrightnessMask(context.brightnessMaskData.slice(), context.originalImageData.width, context.originalImageData.height, context.filterSettings.halation.blurRadius))
}


export function updateHalationTint(context: CanvasContextProps): void {
    if (context.imageLoaded && context.originalImageData !== null && context.isWasmLoaded && context.blurredHalationLayerData) {
        context.setHalationLayerData(colorizeMask(context.blurredHalationLayerData, context.filterSettings.halation.color));
    } else {
        context.setHalationLayerData(null)
    }
}

 