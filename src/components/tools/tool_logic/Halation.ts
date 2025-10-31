import { createBrightnessMask, colorizeMask } from "../../../utils/WasmProcessor";
import { webGLProcessor } from "../../../utils/WebGLProcessor";
import { CanvasContextProps } from "../../image_preview/canvas_context";

export function updateBrightnessMask(context: CanvasContextProps) {
    if (context.imageLoaded && context.originalImageData !== null && context.isWasmLoaded) {
        const mask = createBrightnessMask(context.originalImageData, context.filterSettings.halation.brightnessThreshold)
        context.setBrightnessMaskData(mask)
    } else {
        context.setBrightnessMaskData(null)
    }
}



export function updateBlurRadius(context: CanvasContextProps) {
    const blur_radius = context.filterSettings.halation.blurRadius
    if (!context.brightnessMaskData) return
    if (blur_radius == 0) { // no blur needed with 0 blur radius
        context.setBlurredHalationLayerData(context.brightnessMaskData)
    }
    context.setBlurredHalationLayerData(
        webGLProcessor.applyBlur(context.brightnessMaskData, context.filterSettings.halation.blurRadius)
    )
}


export function updateHalationTint(context: CanvasContextProps) {
    if (context.imageLoaded && context.originalImageData !== null && context.isWasmLoaded && context.blurredHalationLayerData) {
        colorizeMask(context.blurredHalationLayerData, context.filterSettings.halation.color)
    }
}

export function displayCompositeHalation(context: CanvasContextProps) {
    const canvas = context.canvasRef.current
    const canvas_context = canvas?.getContext('2d')
    const edited_image = canvas?.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height);
    if (!context.imageLoaded || !context.originalImageData || !canvas || !canvas_context || !edited_image) return;

    canvas_context.clearRect(0, 0, canvas.width, canvas.height);
    canvas_context.putImageData(edited_image, 0, 0);
    if (context.halationLayerData) {
        canvas_context.globalCompositeOperation = 'overlay'; // Ideal for glowing effects
        canvas_context.putImageData(context.halationLayerData, 0, 0);
        canvas_context.globalCompositeOperation = 'source-over'; // Reset to default
    }

}

