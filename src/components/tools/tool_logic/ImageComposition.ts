import { createCompositeImage } from "../../../utils/WasmProcessor";
import { CanvasContextProps } from "../../image_preview/canvas_context";

export function createCompositeImageData(context: CanvasContextProps): void {

    console.log("creating composite image data")
    const canvas = context.canvasRef.current
    const canvas_context = canvas?.getContext('2d')

    if (!context.imageLoaded || !context.originalImageData || !canvas || !canvas_context) return;
    canvas_context.clearRect(0, 0, canvas.width, canvas.height);
    canvas_context.putImageData(createCompositeImage(context.originalImageData, context.halationLayerData, context.grainNoiseMask), 0, 0);
    console.log("done")
}