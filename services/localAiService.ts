import { Asset, Tag, TagSource, AestheticData, AssetType } from "../types";

// Default fallback, but functions now accept an override
const DEFAULT_LOCAL_API_URL = "http://127.0.0.1:8000";

export const checkLocalBackendStatus = async (apiUrl?: string): Promise<boolean> => {
    try {
        const url = apiUrl || DEFAULT_LOCAL_API_URL;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000);
        const res = await fetch(`${url}/health`, { 
            method: 'GET',
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return res.ok;
    } catch (e) {
        return false;
    }
};

export const analyzeAssetWithLocal = async (
    asset: Asset,
    base64Data: string,
    apiUrl?: string
): Promise<{ 
    tags: Tag[], 
    caption: string, 
    metadataGuess?: any, 
    aesthetic?: AestheticData 
}> => {
    
    // Check if backend is running
    const isOnline = await checkLocalBackendStatus(apiUrl);
    
    if (!isOnline) {
        console.warn("Local backend offline. Falling back to simulation mode.");
        
        // --- SIMULATION FALLBACK ---
        // This ensures the app remains functional for demo/offline use without the Python backend.
        
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing delay

        const mockTags = [
            "offline_mode", "simulation", "demo_asset", 
            asset.type === 'image' ? "visual_art" : asset.type === 'video' ? "motion_graphics" : "audio_waveform"
        ];
        
        if (asset.type === 'video') {
            mockTags.push("cyberpunk", "neon", "cityscape", "loop");
        }

        const tags: Tag[] = mockTags.map((t, i) => ({
            id: `sim-${Date.now()}-${i}`,
            name: t,
            source: TagSource.MANUAL, // Mark as manual or system to indicate not true AI
            confidence: 1.0
        }));

        const aesthetic: AestheticData | undefined = asset.type === 'image' ? {
            score: 7.5,
            colorPalette: ["#334155", "#475569", "#94a3b8"],
            isGalleryStandard: true,
            critique: "Simulation mode active. Backend unavailable for deep aesthetic analysis."
        } : undefined;

        return {
            tags,
            caption: `(Offline Simulation) Analysis of ${asset.name}. Ensure 'python backend/main.py' is running for real local AI inference.`,
            metadataGuess: {
                simulation: true,
                backend: "offline"
            },
            aesthetic
        };
    }

    try {
        const url = apiUrl || DEFAULT_LOCAL_API_URL;
        const response = await fetch(`${url}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: asset.id,
                type: asset.type,
                data: base64Data, // Sending base64 to local server
                options: {
                    use_qwen: true, // Vision model
                    use_audio_analysis: asset.type === 'audio'
                }
            })
        });

        if (!response.ok) throw new Error("Local analysis failed");

        const result = await response.json();

        // Transform Python backend response to our Frontend Types
        const newTags: Tag[] = (result.tags || []).map((t: string, idx: number) => ({
            id: `local-${Date.now()}-${idx}`,
            name: t,
            source: TagSource.AI_COMFY, // Represents Local AI
            confidence: 1.0
        }));

        const aesthetic: AestheticData | undefined = asset.type === 'image' ? {
            score: result.aesthetic_score || 0,
            colorPalette: result.colors || [],
            isGalleryStandard: (result.aesthetic_score || 0) > 7.5,
            critique: result.critique || "Locally analyzed."
        } : undefined;

        return {
            tags: newTags,
            caption: result.caption || "",
            metadataGuess: result.metadata || {},
            aesthetic
        };

    } catch (error) {
        console.error("Local AI Error:", error);
        // Fallback to simulation on crash
        return {
            tags: [{ id: 'err', name: 'error_fallback', source: TagSource.MANUAL, confidence: 0}],
            caption: "Error contacting local backend.",
            aesthetic: undefined
        };
    }
};