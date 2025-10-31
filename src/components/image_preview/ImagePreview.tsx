import React, { useEffect } from 'react';
import { CanvasContextProps, useCanvas } from './canvas_context';
import { updateBrightnessMask, updateBlurRadius, updateHalationTint } from "../tools/tool_logic"
import { initWasmProcessor } from '../../utils/WasmProcessor';

export const ImagePreview: React.FC =  () => {
  const ctx: CanvasContextProps = useCanvas();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      ctx.loadImage(file);
    }
  };

  useEffect(() => {
      initWasmProcessor(ctx).then(() => console.log('loaded WASM'))
    }, [ctx.setIsWasmLoaded])

  useEffect(() => updateBrightnessMask(ctx), [ctx.imageLoaded, ctx.originalImageData, ctx.filterSettings.halation.brightnessThreshold])
  useEffect(() => updateBlurRadius(ctx), [ctx.brightnessMaskData, ctx.filterSettings.halation.blurRadius])
  useEffect(() => updateHalationTint(ctx), [ctx.originalImageData, ctx.blurredHalationLayerData, ctx.filterSettings.halation.color])

  return (
    <div className="image-preview">
      <input type="file" accept="image/*" onChange={handleChange} />
      <canvas ref={ctx.canvasRef} />
    </div>
  );
};

