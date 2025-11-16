import React from 'react';
import { useCanvas } from '../image_preview/canvas_context';

export const HalationTool: React.FC = () => {
  // Destructure the new setter and the halation settings
  const { updateFilterSettings, filterSettings, isWasmLoaded } = useCanvas();
  const halation = filterSettings.halation;

  // Helper to update a single halation property
  const updateHalation = (key: keyof typeof halation, value: string | number) => {
    updateFilterSettings('halation', { [key]: value });
  };


  return (

    <div>
      <h3>Halation Settings</h3>
      <label>
        Blur Radius:
        <input
          type="range"
          min={0}
          max={250}
          defaultValue={0}
          onChange={(e) => updateHalation("blurRadius", e.target.valueAsNumber)}
          disabled={!isWasmLoaded}
        />
      </label>
      <label>
        Brightness Threshold:
        <input type="range"
          min={0}
          max={255}
          defaultValue={0}
          onChange={(e) => updateHalation("brightnessThreshold", e.target.valueAsNumber)}
          disabled={!isWasmLoaded}
        />
      </label>
      <label>
        Tint (RGB):
        <input type="color"
          defaultValue={"#FFFFFF"}
          onChange={(e) => updateHalation("color", e.target.value)}
          disabled={!isWasmLoaded}
        />
      </label>
    </div>
  );
};