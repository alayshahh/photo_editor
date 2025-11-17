import { createGrainMask } from "../../../utils/WasmProcessor";
import { CanvasContextProps } from "../../image_preview/canvas_context";

export function updateGrainMask(context: CanvasContextProps): void {
    console.log(`Calling update mask with context: ${context}`)
    // if theres no image don't create the noise mask
    if (!context.originalImageData || !context.isWasmLoaded) return

    // no need to make a grain mask if the grain settings are all 0
    const grainSettings = context.filterSettings.grain;
    if (!grainSettings.fineGrainIntensity && !grainSettings.largeGrainIntensity && !grainSettings.mediumGrainIntensity) {
        context.setGrainNoiseMask(null);
        return;
    } 
    // other wise gen the grain ma
    context.setGrainNoiseMask(
        createGrainMask(
            context.originalImageData.width,
            context.originalImageData.height,
            grainSettings.largeGrainIntensity,
            grainSettings.mediumGrainIntensity,
            grainSettings.fineGrainIntensity
        )
    );
}