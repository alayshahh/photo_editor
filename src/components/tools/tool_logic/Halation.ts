import { createBrightnessMask, colorizeMask, createCompositeImage } from "../../../utils/WasmProcessor";
import { webGLProcessor } from "../../../utils/WebGLProcessor";
import { CanvasContextProps } from "../../image_preview/canvas_context";

export function updateBrightnessMask(context: CanvasContextProps):void {
    if (context.imageLoaded && context.originalImageData !== null && context.isWasmLoaded) {
        const mask = createBrightnessMask(context.originalImageData, context.filterSettings.halation.brightnessThreshold)
        context.setBrightnessMaskData(mask)
        webGLProcessor.updateInputMask(mask);
    } else {
        context.setBrightnessMaskData(null)
    }
}



export function updateBlurRadius(context: CanvasContextProps):void {
    const blur_radius = context.filterSettings.halation.blurRadius
    if (!context.brightnessMaskData || (!context.isWebGLLoaded && blur_radius > 0)) {
        context.setBlurredHalationLayerData(null) // Clear the layer to halt the chain
        return
    }
    if (!context.brightnessMaskData) return
    if (blur_radius == 0) { // no blur needed with 0 blur radius
        context.setBlurredHalationLayerData(context.brightnessMaskData)
        return
    }
    console.log(context.brightnessMaskData)
    context.setBlurredHalationLayerData(
        webGLProcessor.applyBlur(context.filterSettings.halation.blurRadius)
    )
}


export function updateHalationTint(context: CanvasContextProps): void {
    if (context.imageLoaded && context.originalImageData !== null && context.isWasmLoaded && context.blurredHalationLayerData) {
        context.setHalationLayerData(colorizeMask(context.blurredHalationLayerData, context.filterSettings.halation.color));
    } else {
        context.setHalationLayerData(null)
    }
}

 