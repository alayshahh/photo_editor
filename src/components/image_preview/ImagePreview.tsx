import React, { useEffect } from 'react';
import { CanvasContextProps, useCanvas } from './canvas_context';
import { updateBrightnessMask, updateBlurRadius, updateHalationTint, createCompositeImageData } from "../tools/tool_logic"
import { initWasmProcessor } from '../../utils/WasmProcessor';
import { initWebGLProcessor } from '../../utils/WebGLProcessor';
import { updateGrainMask } from '../tools/tool_logic/Grain';

export const ImagePreview: React.FC = () => {
  const ctx: CanvasContextProps = useCanvas();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      ctx.loadImage(file);
    }
  };

  const saveImage = () => {
    const imageUrl = ctx.canvasRef.current?.toDataURL();
    if (imageUrl) {
      const downloadLink = document.createElement('a');
      downloadLink.href = imageUrl;
      downloadLink.download = 'my-canvas-image.png';

      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  }

  // load wasm engine
  useEffect(() => {
    if (!ctx.isWasmLoaded){
      console.log("Loading WASM!")
    initWasmProcessor(ctx)
      .then(() => console.log('loaded WASM'))
      .catch(err => console.log(`WASM Load Failure ${err}`))
    } else {
      console.log("WASM alr loaded")
    }
  }, [ctx.setIsWasmLoaded])

  useEffect(() => {
    initWebGLProcessor(ctx)
  }, [ctx.originalImageData])


  useEffect(() => updateBrightnessMask(ctx), [ctx.imageLoaded, ctx.originalImageData, ctx.filterSettings.halation.brightnessThreshold])
  useEffect(() => updateBlurRadius(ctx), [ctx.brightnessMaskData, ctx.filterSettings.halation.blurRadius, ctx.isWebGLLoaded])
  useEffect(() => updateHalationTint(ctx), [ctx.originalImageData, ctx.blurredHalationLayerData, ctx.filterSettings.halation.color])
  useEffect(() => updateGrainMask(ctx), [ctx.originalImageData, ctx.filterSettings.grain]);
  useEffect(() => createCompositeImageData(ctx), [ctx.imageLoaded, ctx.originalImageData, ctx.halationLayerData, ctx.grainNoiseMask])

  return (
    <div className="image-preview">
      <input type="file" accept="image/*" onChange={handleChange} />
      <canvas ref={ctx.canvasRef} />
      <button onClick={saveImage}> Save Image </button>
    </div>
  );
};

