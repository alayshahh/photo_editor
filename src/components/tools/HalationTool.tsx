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
          max={100}
          defaultValue={10}
          onChange={(e) => updateHalation("blurRadius", e.target.valueAsNumber)}
          disabled={!isWasmLoaded}
        />
      </label>
      <label>
        Brightness Threshold:
        <input type="range"
          min={0}
          max={100}
          defaultValue={50}
          onChange={(e) => updateHalation("brightnessThreshold", e.target.valueAsNumber)}
          disabled={!isWasmLoaded}
        />
      </label>
      <label>
        Tint (RGB):
        <input type="color"
          onChange={(e) => updateHalation("color", e.target.value)}
          disabled={!isWasmLoaded}
        />
      </label>
    </div>
  );
};

function updateHalationRadius(r: number) {
  console.log("new Radius" + r)

}
function updateHalationColor(color: string) {
  console.log("new Color" + color)
}

function updateHalationThreshold(t: number) {
  console.log("new threshold" + t)

}