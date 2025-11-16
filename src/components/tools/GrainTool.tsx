import React from 'react';
import { useCanvas } from '../image_preview/canvas_context';


export const GrainTool: React.FC = () => {
  const { updateFilterSettings, filterSettings } = useCanvas();
  const grain = filterSettings.grain;
  // Helper to update a single halation property
  const updateGrain = (key: keyof typeof grain, value: string | number) => {
    updateFilterSettings('grain', { [key]: value });
  };

  return (
    <div>
      <h3>Grain Settings</h3>
      <label>
        Large Grain Intensity:
        <input type="range"
          min={0.0}
          max={0.9999}
          defaultValue={0.0}
          step={0.005}
          onChange={(e) => updateGrain("largeGrainIntensity", e.target.valueAsNumber)}/>
      </label>
      <label>
        Medium Grain Intensity:
        <input type="range" 
        min={0} max={0.9999}  step={0.005} defaultValue={0.0}
        onChange={(e) => updateGrain("mediumGrainIntensity", e.target.valueAsNumber)} />
      </label>
      <label>
        Fine Grain Intensity:
        <input type="range" 
        min={0} max={0.9999} step={0.005} defaultValue={0.0} 
        onChange={(e) => updateGrain("fineGrainIntensity", e.target.valueAsNumber)}/>
      </label>
    </div>
  );
};

