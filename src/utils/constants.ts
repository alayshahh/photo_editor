import { FilterSettings } from "../components/tools/tool_logic/FilterSettings";

export const DEFAULT_FILTER_SETTINGS: FilterSettings = {
    halation: {
       color: "#FFFFFF", 
       blurRadius: 0,
       brightnessThreshold: 255
    },
    grain: {
        fineGrainIntensity: 0,
        mediumGrainIntensity: 0,
        largeGrainIntensity: 0
    },
    colorCorrection: {
        contrast:0
    }
}