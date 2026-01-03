
export enum TagSource {
  MANUAL = 'manual',
  AI_COMFY = 'ai_comfy',
  AI_GEMINI = 'ai_gemini',
  AI_OPENAI = 'ai_openai',
  AI_ANTHROPIC = 'ai_anthropic',
  AI_OPENROUTER = 'ai_openrouter',
  AI_OLLAMA = 'ai_ollama',
}

export type AssetType = 'image' | 'audio' | 'video';

export type AiProvider = 'local' | 'gemini' | 'openai' | 'anthropic' | 'openrouter' | 'ollama';

export interface AiSettings {
  activeProvider: AiProvider;
  
  // Local Architecture Choice
  localBackendType: 'hybrid' | 'ollama_only'; // 'hybrid' = Python (Vision/Aesthetic) + Ollama (Logic). 'ollama_only' = Everything in Ollama.

  // Orchestration / Agentic Settings
  enableAgenticWorkflow: boolean;
  agenticThinkingModel: string; // e.g. 'qwen2.5-coder:7b'
  
  // Performance & Hardware
  performanceMode: 'high_performance' | 'balanced' | 'low_vram'; 
  gpuOffloadLayers: number; 
  
  // Local Model Paths (User Inventory)
  visionModelType: 'florence2' | 'qwen2_vl' | 'llava' | 'internvl' | 'ollama_vision'; 
  visionModelPath: string; // Path (for local backend) or Model Tag (for Ollama)
  
  aestheticModelPath: string; // e.g. "google/siglip-so400m..."
  
  // Endpoint Configs
  localUrl: string;
  ollamaUrl: string;
  // API Keys
  geminiKey: string;
  openaiKey: string;
  anthropicKey: string;
  openrouterKey: string;
  // Cloud Models
  openaiModel: string;
  anthropicModel: string;
  openrouterModel: string;
}

export const DEFAULT_AI_SETTINGS: AiSettings = {
  activeProvider: 'local',
  localBackendType: 'hybrid',
  enableAgenticWorkflow: true,
  
  // OPTIMIZED CONFIGURATION (Default)
  // Vision: Florence-2 is fast and detailed.
  visionModelType: 'florence2',
  visionModelPath: '', // User must configure this
  
  // Brain: Qwen2.5-Coder is SOTA for JSON instruction following.
  agenticThinkingModel: 'qwen2.5-coder:7b',
  
  // Aesthetics: SigLIP is SOTA (Better than CLIP ViT-L-14).
  aestheticModelPath: 'google/siglip-so400m-patch14-384',
  
  performanceMode: 'balanced', 
  gpuOffloadLayers: -1,

  localUrl: 'http://127.0.0.1:8000',
  ollamaUrl: 'http://127.0.0.1:11434',
  geminiKey: '',
  openaiKey: '',
  anthropicKey: '',
  openrouterKey: '',
  openaiModel: 'gpt-4o',
  anthropicModel: 'claude-3-5-sonnet-20240620',
  openrouterModel: 'google/gemini-flash-1.5',
};

export interface Tag {
  id: string;
  name: string;
  source: TagSource;
  confidence?: number; // 0 to 1
}

export interface ImageMetadata {
  dateTaken?: string;
  cameraModel?: string;
  exposure?: string;
  iso?: string;
  resolution: string;
  fileSize: string;
}

export interface AudioMetadata {
  duration: string; // e.g. "3:45"
  bitrate?: string;
  sampleRate?: string;
  bpm?: number;
  key?: string;
  fileSize: string;
}

export interface VideoMetadata {
  duration: string;
  resolution: string;
  fps?: number;
  codec?: string;
  fileSize: string;
}

export interface AestheticData {
  score: number; // 1.0 to 10.0
  colorPalette: string[]; // Array of Hex codes
  isGalleryStandard: boolean;
  critique: string;
}

export interface Asset {
  id: string;
  type: AssetType;
  url: string;
  thumbnailUrl: string; // For audio/video, this might be a cover art or a placeholder
  name: string;
  metadata: ImageMetadata | AudioMetadata | VideoMetadata;
  tags: Tag[];
  rating: number; // 0 (unrated) to 5
  flagged: boolean; // For review/deletion
  processed: boolean; // Has run through AI
  caption?: string; // AI Generated caption or Audio summary
  aesthetic?: AestheticData; // For images
}

export type ViewMode = 'library' | 'curator' | 'insights' | 'tools' | 'settings' | 'editor';

export interface DatasetStats {
  totalAssets: number;
  processedAssets: number;
  audioCount: number;
  imageCount: number;
  videoCount: number;
}
