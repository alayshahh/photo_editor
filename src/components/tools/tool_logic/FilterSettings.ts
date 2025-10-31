export interface FilterSettings {
    halation: {
        color: string;
        blurRadius: number;
        brightnessThreshold: number;
    };
    grain: {
        fineGrainIntensity: number,
        mediumGrainIntensity: number,
        largeGrainIntensity: number
    };
    colorCorrection: {
        contrast:number
    };
}