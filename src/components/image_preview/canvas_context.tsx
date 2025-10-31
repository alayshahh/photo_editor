import React, { createContext, useContext, useRef, useState } from "react";
import { DEFAULT_FILTER_SETTINGS } from "../../utils/constants";
import { FilterSettings } from "../tools/tool_logic";


export interface CanvasContextProps {
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    imageLoaded: boolean;
    loadImage: (file: File) => void;
    originalImageData: ImageData | null;
    setModifiedImageData: (data: ImageData) => void;
    filterSettings: FilterSettings
    updateFilterSettings: (tool: keyof FilterSettings, settings: Partial<FilterSettings[typeof tool]>) => void;
    brightnessMaskData: ImageData | null; 
    setBrightnessMaskData: (data: ImageData | null) => void;
    blurredHalationLayerData: ImageData | null; 
    setBlurredHalationLayerData: (data: ImageData | null) => void;
    isWasmLoaded: boolean,
    setIsWasmLoaded: (loaded: boolean) => void;
}

const CanvasContext = createContext<CanvasContextProps | null>(null);

export const CanvasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [filterSettings, setFilterSettings] = useState<FilterSettings>(DEFAULT_FILTER_SETTINGS);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);

    // 1. State for the Thresholded Brightness Mask
    const [brightnessMaskData, setBrightnessMaskData] = useState<ImageData | null>(null); 
    
    // 2. State for the Blurred Halation Layer
    const [blurredHalationLayerData, setBlurredHalationLayerData] = useState<ImageData | null>(null);
    const [isWasmLoaded, setIsWasmLoaded] = useState<boolean>(false);


    // Universal setter function
    const updateFilterSettings = (
        tool: keyof FilterSettings,
        settings: Partial<FilterSettings[typeof tool]>
    ) => {
        setFilterSettings(prev => ({
            ...prev,
            [tool]: {
                ...prev[tool],
                ...settings,
            }
        }));
    };



    const loadImage = (file: File) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) {
                return;
            }
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return;
            }
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const data = ctx.getImageData(0, 0, img.width, img.height);
            setOriginalImageData(data);
            setImageLoaded(true);
            URL.revokeObjectURL(url);
        };
        img.src = url;

    };

    const setModifiedImageData = (data: ImageData) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;
        ctx.putImageData(data, 0, 0);
    }


    return (
        <CanvasContext.Provider
            value={{
                canvasRef,
                imageLoaded,
                loadImage,
                originalImageData,
                setModifiedImageData,
                filterSettings,
                updateFilterSettings,
                brightnessMaskData, 
                setBrightnessMaskData, 
                blurredHalationLayerData, 
                setBlurredHalationLayerData,
                isWasmLoaded,
                setIsWasmLoaded
            }}
        >
            {children}
        </CanvasContext.Provider>
    );

}

export const useCanvas = () => {
    const ctx = useContext(CanvasContext);
    if (!ctx) throw new Error('useCanvas must be used inside CanvasProvider');
    return ctx;
};

