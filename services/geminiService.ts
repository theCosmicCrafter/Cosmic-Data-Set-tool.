import { GoogleGenAI, Type } from "@google/genai";
import { Tag, TagSource, AestheticData, Asset, AssetType } from "../types";

// Helper to convert blob to base64
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

interface GeminiAnalysisResult {
  tags: string[];
  caption: string;
  camera_guess?: string;
  aesthetic_score?: number;
  color_palette?: string[];
  is_gallery_standard?: boolean;
  critique?: string;
  // Audio specific
  bpm?: number;
  musical_key?: string;
}

export const analyzeAssetWithGemini = async (
  base64Data: string,
  type: AssetType,
  apiKey?: string
): Promise<{ 
    tags: Tag[], 
    caption: string, 
    metadataGuess?: any, 
    aesthetic?: AestheticData 
}> => {
  
  // Use the key passed from settings, or fall back to env var
  const key = apiKey || process.env.API_KEY;
  if (!key) throw new Error("Gemini API Key missing. Please configure it in Settings.");

  const ai = new GoogleGenAI({ apiKey: key });

  let prompt = "";
  let mimeType = "image/jpeg";

  if (type === 'image') {
      prompt = `
      **ROLE**: You are a Lead Dataset Curator for a high-end AI Image Generator.
      **TASK**: Analyze this image to generate production-grade training metadata.
      
      **ANALYSIS FRAMEWORK (Pixel-Perfect Detail)**:
      1. **Subject**: Detailed breakdown of character/object, clothing, pose, and facial expression.
      2. **Environment**: Setting, background details, time of day, weather conditions.
      3. **Lighting**: Analyze sources (volumetric, rim, studio, practical), quality (hard/soft), and shadows.
      4. **Style/Medium**: Precise classification (e.g., 35mm Photography, Octane Render, Oil on Canvas, Ukiyo-e, Vector Art).
      5. **Technical**: Estimate Focal length (e.g., 85mm), Depth of field (bokeh), Color grading (e.g., teal & orange), and Texture quality.
      
      **OUTPUT REQUIREMENTS**:
      - **Tags**: Generate 40-60 high-utility tags. 
         - Mix **Descriptive** ('blue_eyes', 'hoodie'), **Technical** ('f/1.8', '8k_resolution', 'ray_tracing'), and **Stylistic** ('cyberpunk', 'synthwave') tags.
         - Format tags as lowercase, underscore_separated.
      - **Caption**: A rich, natural language prompt describing the image for a text-to-image model. Start with the subject, then environment, then style/technical.
      - **Aesthetic Score**: A strict rating (1-10) of visual quality. Be critical.
      - **Critique**: A professional critique of the composition, lighting, and execution.
      - **Color Palette**: Extract 5 dominant hex colors.
      `;
      mimeType = "image/jpeg";
  } else if (type === 'audio') {
      prompt = "Analyze this audio file. Provide tags (genre, mood, instruments), a technical description of the sound design/mix, BPM, and musical key.";
      mimeType = "audio/mp3"; // Default assumption for blob
  } else if (type === 'video') {
      prompt = "Analyze this video clip. Provide tags describing the visual content, camera movement (pan, tilt, dolly), action, and style. Also provide a summary caption.";
      mimeType = "video/mp4";
  }

  // Schema for structured output
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      tags: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "A list of 40-60 precise aesthetic, technical, and semantic tags."
      },
      caption: {
        type: Type.STRING,
        description: "A detailed, prompt-ready description."
      },
      // Image props
      camera_guess: { type: Type.STRING, nullable: true },
      aesthetic_score: { type: Type.NUMBER, nullable: true },
      color_palette: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
      is_gallery_standard: { type: Type.BOOLEAN, nullable: true },
      critique: { type: Type.STRING, nullable: true },
      // Audio props
      bpm: { type: Type.NUMBER, nullable: true },
      musical_key: { type: Type.STRING, nullable: true }
    },
    required: ["tags", "caption"]
  };

  try {
    // gemini-3-flash-preview supports multimodal (video, audio, image)
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.4, 
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from Gemini");

    const result: GeminiAnalysisResult = JSON.parse(jsonText);

    const newTags: Tag[] = result.tags.map((t, idx) => ({
      id: `gemini-${Date.now()}-${idx}`,
      name: t,
      source: TagSource.AI_GEMINI,
      confidence: 0.95 
    }));

    let aesthetic: AestheticData | undefined;
    let metadataGuess: any = {};

    if (type === 'image') {
       aesthetic = {
          score: result.aesthetic_score || 5,
          colorPalette: result.color_palette || [],
          isGalleryStandard: result.is_gallery_standard || false,
          critique: result.critique || "No critique available."
       };
       if (result.camera_guess) metadataGuess.cameraModel = result.camera_guess;
    } else {
       // Audio/Video specific metadata mapping
       if (result.bpm) metadataGuess.bpm = result.bpm;
       if (result.musical_key) metadataGuess.key = result.musical_key;
    }

    return {
      tags: newTags,
      caption: result.caption,
      metadataGuess,
      aesthetic
    };

  } catch (error) {
    console.error("Gemini Analysis Failed", error);
    throw error;
  }
};