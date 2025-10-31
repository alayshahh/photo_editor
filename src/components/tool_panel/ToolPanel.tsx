import React from "react";
import { ToolType } from "../../utils/toolTypes";
import { ColorCorrectionTool, GrainTool, HalationTool } from "../tools";

interface ToolPanelProps {
    toolType: ToolType
}
export const ToolPanel: React.FC<ToolPanelProps> = ({ toolType }) => {
    switch (toolType){
        case ToolType.GRAINER: 
            return <GrainTool/>
        case ToolType.COLOR_CORRECTION:
            return <ColorCorrectionTool/>
        case ToolType.HALATION:
            return <HalationTool/>
        default:
            return null
    }
        
}