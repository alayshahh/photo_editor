import React from "react";
import { ToolType } from "../../utils/toolTypes";

interface SidebarProps {
    activeTool: ToolType,
    setActiveTool: (tool:ToolType) => void
}

const tools: ToolType[]  = [ToolType.GRAINER, ToolType.HALATION, ToolType.COLOR_CORRECTION]

export const Sidebar: React.FC<SidebarProps> = ({activeTool, setActiveTool}) => {
    return (
        <nav className="sidebar">
            {
                tools.map((tool) => (
                    <button
                    key={tool}
                    onClick={()=>setActiveTool(tool)}
                    className={activeTool === tool ? "active" : ""}
                    >
                        {tool}
                    </button>
                ))
            }
        </nav>
    )

} 