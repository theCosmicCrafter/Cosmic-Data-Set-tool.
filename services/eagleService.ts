import { Asset, TagSource } from "../types";

const EAGLE_API_URL = "http://localhost:41595/api";

export const checkEagleStatus = async (): Promise<boolean> => {
    try {
        // Eagle usually runs on 41595. We check application info.
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000);
        
        const res = await fetch(`${EAGLE_API_URL}/application/info`, { 
            method: 'GET',
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return res.ok;
    } catch (e) {
        return false;
    }
};

export const updateEagleItem = async (eagleId: string, asset: Asset): Promise<boolean> => {
    try {
        const body = {
            "id": eagleId,
            "tags": asset.tags.map(t => t.name),
            "annotation": asset.caption || "",
            "star": Math.round(asset.rating || 0)
        };

        const res = await fetch(`${EAGLE_API_URL}/item/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        return res.ok;
    } catch (error) {
        console.error("Eagle Update Failed", error);
        return false;
    }
}

export const importAssetToEagle = async (asset: Asset, base64Data: string): Promise<boolean> => {
    try {
        // Determine extension
        let ext = 'png';
        if (asset.type === 'audio') ext = 'mp3';
        if (asset.type === 'video') ext = 'mp4';
        if (asset.name.includes('.')) ext = asset.name.split('.').pop()!;

        const body = {
            "items": [
                {
                    "name": asset.name,
                    "annotation": asset.caption || "",
                    "tags": asset.tags.map(t => t.name),
                    "ext": ext,
                    // Eagle supports base64 import via the "base64" field inside data
                    "base64": base64Data, 
                    // Eagle strictly supports integers 0-5. Half-stars are not supported.
                    "star": Math.round(asset.rating || 0)
                }
            ],
            "folderId": "" // Imports to "Uncategorized" / All by default
        };

        const res = await fetch(`${EAGLE_API_URL}/item/addFromPaths`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        return res.ok;

    } catch (error) {
        console.error("Eagle Import Failed", error);
        return false;
    }
};