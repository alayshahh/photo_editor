import React, { useEffect } from 'react';
import { CanvasContextProps, useCanvas } from './canvas_context';
import { updateBrightnessMask, updateBlurRadius, updateHalationTint, displayCompositeHalation } from "../tools/tool_logic"
import { initWasmProcessor } from '../../utils/WasmProcessor';
import { initWebGLProcessor } from '../../utils/WebGLProcessor';

export const ImagePreview: React.FC = () => {
  const ctx: CanvasContextProps = useCanvas();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      ctx.loadImage(file);
    }
  };

  // load wasm engine
  useEffect(() => {
    initWasmProcessor(ctx)
      .then(() => console.log('loaded WASM'))
      .catch(err => console.log(`WASM Load Failure ${err}`))
  }, [ctx.setIsWasmLoaded])

  useEffect(() => {
    initWebGLProcessor(ctx)
  }, [ctx.originalImageData])


  useEffect(() => updateBrightnessMask(ctx), [ctx.imageLoaded, ctx.originalImageData, ctx.filterSettings.halation.brightnessThreshold])
  useEffect(() => updateBlurRadius(ctx), [ctx.brightnessMaskData, ctx.filterSettings.halation.blurRadius, ctx.isWebGLLoaded])
  useEffect(() => updateHalationTint(ctx), [ctx.originalImageData, ctx.blurredHalationLayerData, ctx.filterSettings.halation.color])

  useEffect(() => displayCompositeHalation(ctx), [ctx.imageLoaded, ctx.originalImageData, ctx.halationLayerData])

  return (
    <div className="image-preview">
      <input type="file" accept="image/*" onChange={handleChange} />
      <canvas ref={ctx.canvasRef} />
    </div>
  );
};

