import React, { useState, useEffect } from 'react';
import { Asset, Tag, TagSource } from '../types';
import { Button } from '../components/Button';
import { 
  ArrowLeft, Star, Flag, BrainCircuit, Tag as TagIcon, 
  Trash2, Wand2, X, MoreHorizontal, Info, Palette, Trophy, Eye,
  Music, Play, Pause, Activity, Server, AlertTriangle, Settings, Sparkles, ScanLine, Film, Send, RefreshCcw
} from 'lucide-react';
import { blobToBase64 } from '../services/geminiService';
import { analyzeAssetWithLocal, checkLocalBackendStatus } from '../services/localAiService';
import { analyzeAssetUniversal, getAiSettings } from '../services/universalAiService';
import { checkEagleStatus, importAssetToEagle, updateEagleItem } from '../services/eagleService';

interface CuratorViewProps {
  asset: Asset;
  onBack: () => void;
  onUpdate: (id: string, updates: Partial<Asset>) => void;
}

export const CuratorView: React.FC<CuratorViewProps> = ({ asset, onBack, onUpdate }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [localStatus, setLocalStatus] = useState<boolean>(false);
  const [eagleStatus, setEagleStatus] = useState<boolean>(false);
  const [isExportingToEagle, setIsExportingToEagle] = useState(false);
  
  const [currentProvider, setCurrentProvider] = useState(getAiSettings().activeProvider);
  
  // Check if this is an Eagle Asset
  const isEagleAsset = asset.id.startsWith('eagle-');

  useEffect(() => {
    checkLocalBackendStatus().then(setLocalStatus);
    checkEagleStatus().then(setEagleStatus);
    
    const interval = setInterval(() => {
        checkLocalBackendStatus().then(setLocalStatus);
        checkEagleStatus().then(setEagleStatus);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRate = (rating: number) => {
    onUpdate(asset.id, { rating: asset.rating === rating ? 0 : rating });
  };

  const handleFlag = () => {
    onUpdate(asset.id, { flagged: !asset.flagged });
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      const newTag: Tag = {
        id: `manual-${Date.now()}`,
        name: newTagInput.trim(),
        source: TagSource.MANUAL,
        confidence: 1
      };
      onUpdate(asset.id, { tags: [...asset.tags, newTag] });
      setNewTagInput('');
    }
  };

  const removeTag = (tagId: string) => {
    onUpdate(asset.id, { tags: asset.tags.filter(t => t.id !== tagId) });
  };

  const handleEagleSync = async () => {
      if (!eagleStatus) return;
      setIsExportingToEagle(true);
      try {
          if (isEagleAsset) {
              // UPDATE Mode
              const eagleId = asset.id.replace('eagle-', '');
              const success = await updateEagleItem(eagleId, asset);
              if (success) {
                   // Small visual feedback could go here
              } else {
                  alert("Failed to update Eagle metadata.");
              }
          } else {
              // CREATE/PUSH Mode
              let base64 = "";
              if (asset.url.startsWith('http') || asset.url.startsWith('blob')) {
                const response = await fetch(asset.url);
                const blob = await response.blob();
                base64 = await blobToBase64(blob);
              } else {
                 base64 = ""; 
              }
              
              if (base64) {
                 const success = await importAssetToEagle(asset, base64);
                 if (success) {
                     alert("Successfully pushed to Eagle Library!");
                 } else {
                     alert("Failed to push to Eagle. Check Eagle console.");
                 }
              }
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsExportingToEagle(false);
      }
  };

  const handleAIGenerate = async () => {
    setIsProcessing(true);
    
    try {
      let base64 = "";
      if (asset.url.startsWith('http') || asset.url.startsWith('blob')) {
        const response = await fetch(asset.url);
        const blob = await response.blob();
        base64 = await blobToBase64(blob);
      } else {
         base64 = "mock_base64";
      }

      const result = await analyzeAssetUniversal(asset, base64);
      
      const existingNames = new Set(asset.tags.map(t => t.name.toLowerCase()));
      const uniqueNewTags = result.tags.filter(t => !existingNames.has(t.name.toLowerCase()));
      
      // Auto-Map Score to Rating
      // 9-10 -> 5 stars
      // 7-8 -> 4 stars
      // 5-6 -> 3 stars
      // 3-4 -> 2 stars
      // 1-2 -> 1 star
      const newRating = result.aesthetic ? Math.round(result.aesthetic.score / 2) : asset.rating;

      onUpdate(asset.id, {
        tags: [...asset.tags, ...uniqueNewTags],
        caption: result.caption,
        processed: true,
        metadata: { ...asset.metadata, ...result.metadataGuess },
        aesthetic: result.aesthetic,
        rating: newRating
      });

    } catch (err) {
      console.error(err);
      alert(`Analysis failed: ${err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getScoreColor = (score: number) => {
      if (score >= 8) return 'text-emerald-400 stroke-emerald-500';
      if (score >= 5) return 'text-amber-400 stroke-amber-500';
      return 'text-red-400 stroke-red-500';
  };

  const providerLabels: Record<string, string> = {
      local: 'LocalCura (Qwen/Florence)',
      gemini: 'Google Gemini 1.5',
      openai: 'OpenAI GPT-4o',
      anthropic: 'Claude Sonnet',
      openrouter: 'OpenRouter Omni'
  };

  return (
    <div className="flex h-full bg-[#0b0e14] text-slate-200">
      
      {/* LEFT: Main Content Canvas (The "Viewport") */}
      <div className="flex-1 flex flex-col relative border-r border-slate-800/50 overflow-y-auto">
        
        {/* Floating Nav */}
        <div className="absolute top-4 left-4 z-20 flex gap-2">
          <Button variant="glass" size="sm" onClick={onBack} className="rounded-full pl-3 pr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Library
          </Button>
        </div>

        {/* Eagle Export/Sync Button (Top Right Floating) */}
        {eagleStatus && (
            <div className="absolute top-4 right-4 z-20">
                <Button 
                    variant="glass" 
                    size="sm" 
                    onClick={handleEagleSync} 
                    disabled={isExportingToEagle}
                    className={`rounded-full pl-4 pr-4 shadow-[0_0_15px_rgba(59,130,246,0.2)] ${
                        isEagleAsset 
                        ? 'border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-500 hover:text-emerald-100' 
                        : 'border-blue-500/30 text-blue-300 hover:bg-blue-500/10 hover:border-blue-500 hover:text-blue-100'
                    }`}
                >
                    {isExportingToEagle ? (
                        <span className="animate-pulse">Syncing...</span>
                    ) : (
                        <>
                            {isEagleAsset ? <RefreshCcw className="w-3.5 h-3.5 mr-2" /> : <Send className="w-3.5 h-3.5 mr-2" />}
                            {isEagleAsset ? 'Sync to Eagle' : 'Push to Eagle'}
                        </>
                    )}
                </Button>
            </div>
        )}

        {/* Image Stage with Grid Background */}
        <div className="min-h-[60vh] flex items-center justify-center bg-slate-950 p-8 border-b border-slate-800 relative group overflow-hidden">
            {/* HUD Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
            
            {asset.type === 'image' ? (
              <div className="relative shadow-2xl rounded-sm ring-1 ring-white/10 z-10 transition-transform duration-500 group-hover:scale-[1.01]">
                <img 
                  src={asset.url} 
                  alt={asset.name} 
                  className="max-w-full max-h-[65vh] object-contain" 
                />
                {/* Holographic Corners */}
                <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-indigo-500 opacity-50"></div>
                <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-indigo-500 opacity-50"></div>
                <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-indigo-500 opacity-50"></div>
                <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-indigo-500 opacity-50"></div>
              </div>
            ) : asset.type === 'video' ? (
              <div className="relative shadow-2xl rounded-sm ring-1 ring-white/10 z-10 w-full max-w-4xl">
                 <video 
                   src={asset.url} 
                   controls 
                   className="w-full max-h-[65vh] bg-black rounded"
                 />
                 <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-xs font-mono text-white">{(asset.metadata as any).resolution}</div>
              </div>
            ) : (
              <div className="relative z-10 p-12 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/5 shadow-2xl flex flex-col items-center max-w-lg w-full">
                  <div className="w-32 h-32 rounded-full bg-slate-950 flex items-center justify-center mb-6 shadow-inner ring-1 ring-white/10 relative">
                     <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse"></div>
                     <Music className="w-12 h-12 text-indigo-400 relative z-10" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">{asset.name}</h2>
                  <div className="flex gap-4 mb-8">
                     <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">{(asset.metadata as any).duration}</span>
                     <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">{(asset.metadata as any).bpm} BPM</span>
                  </div>
                  <div className="w-full flex justify-center gap-4">
                      <Button variant="cosmic" size="icon" className="w-16 h-16 rounded-full" onClick={() => setIsPlaying(!isPlaying)}>
                          {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                      </Button>
                  </div>
              </div>
            )}
        </div>

        {/* Caption & Metadata Inputs */}
        <div className="p-8 max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-2 mb-4">
                <ScanLine className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Neural Caption</h3>
            </div>
            
            <div className="relative group">
                <div className="absolute inset-0 bg-indigo-500/5 blur-lg -z-10 group-focus-within:bg-indigo-500/10 transition-colors"></div>
                <textarea 
                    className="w-full min-h-[120px] bg-slate-900/50 border border-slate-700 rounded-lg p-4 text-base text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-y transition-all placeholder:text-slate-600"
                    value={asset.caption || ''}
                    placeholder="Waiting for neural analysis..."
                    onChange={(e) => onUpdate(asset.id, { caption: e.target.value })}
                />
            </div>
            
            {/* Rating Bar */}
            <div className="mt-8 flex items-center justify-between p-4 bg-slate-900/40 rounded-lg border border-slate-800/50 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 mr-2 uppercase">Quality Rating</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                        key={star}
                        onClick={() => handleRate(star)}
                        className={`p-1 transition-all hover:scale-125 ${asset.rating >= star ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'text-slate-700 hover:text-slate-500'}`}
                    >
                        <Star className={`w-6 h-6 ${asset.rating >= star ? 'fill-current' : ''}`} />
                    </button>
                    ))}
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="h-4 w-px bg-slate-800"></div>
                    <button 
                    onClick={handleFlag}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${asset.flagged ? 'bg-red-500/10 text-red-500 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'text-slate-500 hover:text-white'}`}
                    >
                        <Flag className={`w-4 h-4 ${asset.flagged ? 'fill-current' : ''}`} />
                        <span className="text-xs font-bold uppercase">{asset.flagged ? 'Flagged' : 'Flag Asset'}</span>
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* RIGHT: Intelligence Sidebar */}
      <div className="w-80 bg-slate-900/80 border-l border-slate-800 flex flex-col h-full overflow-hidden shadow-2xl z-30 backdrop-blur-xl">
        
        {/* Aesthetic Score Card */}
        {asset.type === 'image' && asset.aesthetic && (
            <div className="p-6 border-b border-slate-800 bg-gradient-to-b from-slate-900 to-black/40">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center">
                        <Eye className="w-3 h-3 mr-2" />
                        Visual Aesthetics
                    </h3>
                    {asset.aesthetic.isGalleryStandard && (
                        <div className="flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(251,191,36,0.2)]">
                            <Trophy className="w-3 h-3 mr-1" />
                            GOLD TIER
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between mb-4">
                    {/* Radial Score */}
                    <div className="relative w-20 h-20 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-800" />
                            <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" 
                                strokeDasharray={226}
                                strokeDashoffset={226 - (226 * asset.aesthetic.score) / 10}
                                strokeLinecap="round"
                                className={`${getScoreColor(asset.aesthetic.score)} transition-all duration-1000 ease-out`} 
                            />
                        </svg>
                        <span className="absolute text-2xl font-bold text-white">{asset.aesthetic.score}</span>
                    </div>

                    <div className="flex-1 pl-4">
                        <p className="text-xs text-slate-400 italic leading-relaxed">
                            "{asset.aesthetic.critique}"
                        </p>
                    </div>
                </div>
                
                {/* Palette Bar */}
                <div className="h-2 w-full rounded-full overflow-hidden flex shadow-inner ring-1 ring-white/5">
                    {asset.aesthetic.colorPalette.map((c, i) => (
                        <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
                    ))}
                </div>
            </div>
        )}

        {/* AI Action Area */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/50">
            <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Active Model</span>
                <span className="text-[10px] text-slate-400 font-mono">{providerLabels[currentProvider] || currentProvider}</span>
            </div>

            <Button 
                variant="cosmic" 
                onClick={handleAIGenerate} 
                disabled={isProcessing}
                className="w-full h-12 text-sm uppercase tracking-wide font-bold"
                glow
            >
                {isProcessing ? (
                <>
                    <BrainCircuit className="w-5 h-5 mr-2 animate-pulse text-indigo-300" />
                    Neural Processing...
                </>
                ) : (
                <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze Latent Data
                </>
                )}
            </Button>
            
            {currentProvider === 'local' && !localStatus && (
                <div className="mt-2 flex items-center justify-center text-[10px] text-red-400 bg-red-950/30 border border-red-500/20 p-2 rounded">
                    <AlertTriangle className="w-3 h-3 mr-1.5" />
                    Local Backend Offline
                </div>
            )}
        </div>

        {/* Tags Matrix */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Semantic Tags</h3>
            <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-mono">{asset.tags.length}</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {asset.tags.map(tag => (
              <div 
                key={tag.id} 
                className={`group flex items-center pl-2.5 pr-1 py-1 rounded-md border text-xs transition-all cursor-default ${
                    tag.source === TagSource.MANUAL 
                    ? 'bg-slate-800 border-slate-700 text-slate-300' 
                    : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20'
                }`}
              >
                  <span className="mr-1">{tag.name}</span>
                  <button 
                    onClick={() => removeTag(tag.id)} 
                    className="p-0.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                  >
                      <X className="w-3 h-3" />
                  </button>
              </div>
            ))}
            
            {/* Add Tag Input Inline */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-md px-2 py-1 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 w-full mt-2">
                <TagIcon className="w-3 h-3 text-slate-500 mr-2" />
                <input 
                    type="text" 
                    className="bg-transparent border-none text-xs text-white focus:outline-none w-full placeholder:text-slate-600"
                    placeholder="Add manual tag..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};