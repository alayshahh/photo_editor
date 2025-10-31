import React from 'react';

export const GrainTool: React.FC = () => {
  return (
    <div>
      <h3>Grain Settings</h3>
      <label>
        Size:
        <input type="range" min={0} max={100} defaultValue={50} />
      </label>
      <label>
        Density:
        <input type="range" min={0} max={100} defaultValue={50} />
      </label>
    </div>
  );
};

