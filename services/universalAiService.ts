import { AiSettings, Asset, AssetType, Tag, TagSource, AestheticData, DEFAULT_AI_SETTINGS } from "../types";
import { analyzeAssetWithLocal } from "./localAiService";
import { analyzeAssetWithGemini } from "./geminiService";

// Helper to save/load settings
const SETTINGS_KEY = 'nexus_ai_settings';

export const getAiSettings = (): AiSettings => {
  const stored = localStorage.getItem(SETTINGS_KEY);
  return stored ? { ...DEFAULT_AI_SETTINGS, ...JSON.parse(stored) } : DEFAULT_AI_SETTINGS;
};

export const saveAiSettings = (settings: AiSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

// Generic Result Interface
interface UniversalAnalysisResult {
    tags: Tag[];
    caption: string;
    metadataGuess?: any;
    aesthetic?: AestheticData;
}

// --- PROMPT ENGINEERING (DATASET TRAINING FOCUSED) ---

// MEGA-PROMPT: VISION ANALYSIS
// Designed to extract granular aesthetic, technical, and semantic details.
const PROMPT_DESCRIBE_AESTHETIC = `
**ROLE**: You are a World-Class Computer Vision Expert & Art Critic specializing in Generative AI Training Data.
**TASK**: Conduct a pixel-perfect, deep-dive analysis of the provided image. Do not summarize; dissect it.

**ANALYSIS FRAMEWORK:**

1.  **MEDIUM & STYLE (Crucial)**:
    -   Is it Photography (Analog/Digital), 3D Render, Illustration, Painting, or Mixed Media?
    -   Identify specific art movements (e.g., Baroque, Cyberpunk, Ukiyo-e, Synthwave, Brutalism).
    -   Identify rendering styles (e.g., Octane Render, Unreal Engine 5, Studio Ghibli, Oil Impasto, Vector Flat).

2.  **TECHNICAL PHOTOGRAPHY / RENDER SPECS**:
    -   **Camera**: Estimate focal length (e.g., 24mm wide, 85mm portrait, 200mm telephoto) and sensor type.
    -   **Settings**: Aperture (f/1.4 bokeh vs f/8 sharp), Shutter Speed (motion blur?), ISO (grain?).
    -   **Visual Artifacts**: Chromatic aberration, diffraction spikes, film grain, halation, lens flare, vignetting.

3.  **LIGHTING & ATMOSPHERE**:
    -   **Sources**: Key light, rim light (backlight), fill light, practical lights, volumetric fog/godrays.
    -   **Quality**: Hard shadows, soft diffusion, subsurface scattering, ambient occlusion.
    -   **Mood**: Ethereal, melancholic, sterile, chaotic, euphoric, cinematic.

4.  **COLOR THEORY**:
    -   **Palette**: Complementary, split-complementary, monochromatic, analogous?
    -   **Grading**: Teal & Orange, bleach bypass, pastel, neon-noir, sepia, desaturated.

5.  **COMPOSITION**:
    -   Rule of thirds, golden spiral, central symmetry, leading lines, negative space, dutch angle, low/high angle.

6.  **SUBJECT & NARRATIVE**:
    -   Detailed description of the subject (clothing textures, facial expression, pose) and the environment.

**OUTPUT FORMAT**:
Provide a dense, structured textual analysis covering all points above.
`;

// Florence-2 Specific Task Tokens
const FLORENCE_TASK_DETAILED = "<MORE_DETAILED_CAPTION>";

// MEGA-PROMPT: COGNITION / EXTRACTION
// Designed to convert the visual analysis into high-utility training metadata.
const PROMPT_EXTRACT_METADATA_TRAINING = (description: string) => `
**ROLE**: You are a Lead Data Engineer for a Stable Diffusion/Flux training pipeline.
**INPUT**: A detailed visual analysis of an image.
**TASK**: Transform the input analysis into production-grade JSON metadata for model training.

**INPUT ANALYSIS**:
"${description}"

**INSTRUCTIONS**:

1.  **TAGS (40-60 Tags)**:
    -   **Format**: Lowercase, underscore_separated (e.g., \`depth_of_field\`, \`blue_sky\`).
    -   **Content**:
        -   **Subject**: \`1girl\`, \`cat\`, \`car\`, \`standing\`, \`looking_at_viewer\`.
        -   **Style/Medium**: \`oil_painting\`, \`unreal_engine_5\`, \`anime\`, \`photorealistic\`, \`concept_art\`.
        -   **Technical**: \`8k\`, \`best_quality\`, \`masterpiece\`, \`volumetric_lighting\`, \`ray_tracing\`, \`bokeh\`, \`chromatic_aberration\`.
        -   **Lighting/Color**: \`cinematic_lighting\`, \`rim_light\`, \`neon_palette\`, \`dark_atmosphere\`.

2.  **CAPTION (Training Prompt)**:
    -   Write a rich, natural language prompt.
    -   **Structure**: [Medium/Style] of [Subject] in [Environment], [Action/Pose], [Lighting], [Color/Mood], [Technical Quality].
    -   *Example*: "A hyper-realistic portrait of a cyberpunk hacker in a rainy neon city, shot on 85mm f/1.2, volumetric fog, rim lighting, octane render, 8k."

3.  **AESTHETIC METADATA**:
    -   **Score**: 1.0 (trash) to 10.0 (museum grade). Be critical.
    -   **Gallery Standard**: True if score > 7.5.
    -   **Color Palette**: Extract 5 dominant hex codes.
    -   **Critique**: A sharp, professional critique of the image's execution.

**REQUIRED JSON OUTPUT**:
{
  "tags": ["tag1", "tag2"],
  "caption": "string",
  "aesthetic_score": number,
  "is_gallery_standard": boolean,
  "critique": "string",
  "color_palette": ["#hex"],
  "camera_guess": "string"
}
`;

const SYSTEM_PROMPT_SINGLE_PASS = `
You are an expert AI Dataset Curator.
Analyze the image and output JSON for image generation model training.
Focus strictly on visual description, artistic style, lighting, and technical attributes.
Output must be valid JSON with keys: tags (array of strings), caption (string), aesthetic_score (number), is_gallery_standard (bool), critique (string), color_palette (hex array), camera_guess (string).
`;

// --- ORCHESTRATION HANDLERS ---

const callOpenAICompatible = async (
    baseUrl: string,
    apiKey: string,
    model: string,
    messages: any[],
    jsonMode: boolean = false
): Promise<any> => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    };
    
    if (baseUrl.includes('openrouter')) {
        headers['HTTP-Referer'] = 'https://cosmicdatasets.local';
        headers['X-Title'] = 'Cosmic Data Sets';
    }

    const body: any = {
        model: model,
        messages: messages,
        stream: false
    };

    if (jsonMode) {
        body.response_format = { type: "json_object" };
    }

    try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const txt = await response.text();
            throw new Error(`API Error (${baseUrl}): ${txt}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (e) {
        console.error(`LLM Call Failed to ${baseUrl}`, e);
        throw e;
    }
};

// --- AGENTIC WORKFLOW (The "Orchestrator") ---

const runAgenticWorkflow = async (
    settings: AiSettings,
    base64Data: string,
    sourceType: TagSource
): Promise<UniversalAnalysisResult> => {

    let description = "";

    // STEP 1: VISION (The Eye)
    
    if (settings.activeProvider === 'local') {
        
        // 1A. Use Ollama for Vision (e.g. InternVL, LLaVA via Ollama)
        if (settings.visionModelType === 'ollama_vision') {
            try {
                // Using Ollama's OpenAI Compatible Endpoint
                description = await callOpenAICompatible(
                    `${settings.ollamaUrl}/v1`,
                    'ollama',
                    settings.visionModelPath || 'llava', // Default to llava if path empty
                    [
                         {
                             role: 'user',
                             content: [
                                 { type: "text", text: PROMPT_DESCRIBE_AESTHETIC },
                                 { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Data}` } }
                             ]
                         }
                    ]
                );
            } catch (e) {
                console.warn("Ollama Vision Failed, falling back to basic analysis", e);
                description = "Vision analysis unavailable.";
            }
        } 
        // 1B. Use Python Backend (Florence-2, Qwen2-VL, InternVL via transformers)
        else {
            let visionPrompt = PROMPT_DESCRIBE_AESTHETIC;
            if (settings.visionModelType === 'florence2') {
                 // Florence is strictly a captioner, so we use its specific token, 
                 // but we rely on the "Thinking" model to halluncinate/infer aesthetics from the detailed caption.
                 visionPrompt = FLORENCE_TASK_DETAILED;
            }

            // The local service wraps the complexity of loading specific .safetensors/transformers models
            const visionResult = await analyzeAssetWithLocal(
                { id: 'temp', type: 'image' } as any, 
                base64Data,
                settings.localUrl // Pass user-configured URL
            );
            description = visionResult.caption; 
        }

        if (description.length < 10) description = "Image analysis failed to produce detailed output.";

    } else {
        // Cloud Vision Step
        const userMsg = [
            { type: "text", text: PROMPT_DESCRIBE_AESTHETIC },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Data}` } }
        ];

        try {
            if (settings.activeProvider === 'openai') {
                description = await callOpenAICompatible('https://api.openai.com/v1', settings.openaiKey, settings.openaiModel, [{role: 'user', content: userMsg}]);
            } else if (settings.activeProvider === 'openrouter') {
                 description = await callOpenAICompatible('https://openrouter.ai/api/v1', settings.openrouterKey, settings.openrouterModel, [{role: 'user', content: userMsg}]);
            } else if (settings.activeProvider === 'anthropic') {
                 throw new Error("Agentic Anthropic not fully implemented yet");
            }
        } catch (e) {
            console.warn("Cloud Vision Failed", e);
            description = "Cloud vision service unavailable.";
        }
    }

    // STEP 2: COGNITION (The Brain) - Extract Aesthetic Training Data
    
    let metadataJson: any = {};
    const extractionPrompt = PROMPT_EXTRACT_METADATA_TRAINING(description);

    try {
        let rawJsonStr = "";
        
        if (settings.activeProvider === 'local' || settings.activeProvider === 'ollama') {
             // Use User's preferred Ollama model (e.g. qwen2.5-coder)
             rawJsonStr = await callOpenAICompatible(
                 `${settings.ollamaUrl}/v1`, 
                 'ollama', 
                 settings.agenticThinkingModel, 
                 [{ role: "user", content: extractionPrompt }],
                 true // Force JSON mode
             );
        } else {
            const providerUrl = settings.activeProvider === 'openai' ? 'https://api.openai.com/v1' : 'https://openrouter.ai/api/v1';
            const apiKey = settings.activeProvider === 'openai' ? settings.openaiKey : settings.openrouterKey;
            const model = settings.activeProvider === 'openai' ? settings.openaiModel : settings.openrouterModel;

            rawJsonStr = await callOpenAICompatible(
                providerUrl,
                apiKey,
                model,
                [{ role: "user", content: extractionPrompt }],
                true
            );
        }

        metadataJson = JSON.parse(rawJsonStr);

    } catch (e) {
        console.warn("Agentic Step 2 (Cognition) Failed - Backend/API Offline?", e);
        // Robust Fallback so the app doesn't seem broken
        metadataJson = {
            tags: ["ai_offline", "simulation_mode", "check_backend"],
            caption: description || "Analysis failed due to network/backend issues.",
            aesthetic_score: 5,
            critique: "AI backend was unreachable."
        };
    }

    return parseGenericResponse(metadataJson, sourceType);
};


// --- SINGLE PASS HANDLERS (Legacy/Fast) ---

const analyzeWithOpenAISinglePass = async (
    baseUrl: string,
    apiKey: string,
    model: string,
    base64Data: string,
    sourceType: TagSource
): Promise<UniversalAnalysisResult> => {
    
    try {
        const content = await callOpenAICompatible(
            baseUrl, apiKey, model,
            [
                { role: "system", content: SYSTEM_PROMPT_SINGLE_PASS },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Analyze this image for aesthetic training tags." },
                        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Data}` } }
                    ]
                }
            ],
            true
        );
        return parseGenericResponse(JSON.parse(content), sourceType);
    } catch (e) {
        console.error("Single Pass Analysis Failed", e);
        return {
            tags: [{id:'err', name:'error_contacting_api', source: sourceType}],
            caption: "Error contacting API.",
            aesthetic: undefined
        };
    }
};

// --- PARSER ---

const parseGenericResponse = (json: any, source: TagSource): UniversalAnalysisResult => {
    const tags = (json.tags || []).map((t: string, i: number) => ({
        id: `${source}-${Date.now()}-${i}`,
        name: t,
        source: source,
        confidence: 0.9
    }));

    const aesthetic: AestheticData = {
        score: json.aesthetic_score || 5,
        colorPalette: json.color_palette || [],
        isGalleryStandard: json.is_gallery_standard || false,
        critique: json.critique || "No critique available."
    };

    return {
        tags,
        caption: json.caption || "",
        metadataGuess: json.camera_guess ? { cameraModel: json.camera_guess } : {},
        aesthetic
    };
};


// --- MAIN ENTRY POINT ---

export const analyzeAssetUniversal = async (
    asset: Asset,
    base64Data: string
): Promise<UniversalAnalysisResult> => {
    
    const settings = getAiSettings();

    // 1. Agentic Workflow
    if (settings.enableAgenticWorkflow && settings.activeProvider !== 'gemini' && settings.activeProvider !== 'anthropic') {
        const source = settings.activeProvider === 'local' ? TagSource.AI_COMFY : TagSource.AI_OPENAI;
        return runAgenticWorkflow(settings, base64Data, source);
    }

    // 2. Single Pass Workflow
    switch (settings.activeProvider) {
        case 'local':
            return analyzeAssetWithLocal(asset, base64Data, settings.localUrl);
        
        case 'gemini':
            // Pass the user-configured key to the service
            const gResult = await analyzeAssetWithGemini(base64Data, asset.type, settings.geminiKey);
            return {
                tags: gResult.tags,
                caption: gResult.caption,
                metadataGuess: gResult.metadataGuess,
                aesthetic: gResult.aesthetic
            };

        case 'openai':
            return analyzeWithOpenAISinglePass(
                'https://api.openai.com/v1', 
                settings.openaiKey, 
                settings.openaiModel, 
                base64Data, 
                TagSource.AI_OPENAI
            );

        case 'openrouter':
            return analyzeWithOpenAISinglePass(
                'https://openrouter.ai/api/v1', 
                settings.openrouterKey, 
                settings.openrouterModel, 
                base64Data, 
                TagSource.AI_OPENROUTER
            );
            
        case 'anthropic':
             throw new Error("Anthropic Single Pass requires manual XML parsing impl.");

        default:
            throw new Error("Unknown AI Provider");
    }
};