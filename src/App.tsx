import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { ToolType } from './utils/toolTypes';
import { ImagePreview, Sidebar } from './components';
import { CanvasProvider } from './components/image_preview/canvas_context';
import { ToolPanel } from './components/tool_panel/ToolPanel';
function App() {
  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.GRAINER);
  return (
    
      <div className="app">
        <CanvasProvider>
        <header>
          <h1>Photo Editor</h1>
        </header>
        <div className='editor'>
          <div className="sidebar-container">
            <Sidebar activeTool={activeTool} setActiveTool={setActiveTool} />
            <ToolPanel toolType={activeTool}/>
          </div>
          <div className="main-canvas-container">
            <ImagePreview />
          </div>
        </div>
        </CanvasProvider>
      </div>
  );
}

export default App;
