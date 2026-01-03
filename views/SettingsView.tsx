import React, { useState, useEffect } from 'react';
import { AiSettings, AiProvider, DEFAULT_AI_SETTINGS } from '../types';
import { getAiSettings, saveAiSettings } from '../services/universalAiService';
import { Button } from '../components/Button';
import { ModelManager } from '../components/ModelManager';
import { Save, RotateCcw, Server, Key, CircuitBoard, CheckCircle2, BrainCircuit, ToggleLeft, ToggleRight, Cpu, Zap, Activity, FolderOpen, Info, Sliders, Box, Layers, ArrowRight } from 'lucide-react';
import { checkLocalBackendStatus } from '../services/localAiService';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<AiSettings>(DEFAULT_AI_SETTINGS);
  const [localStatus, setLocalStatus] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem('nexus_ai_settings');
    if (s) setSettings({ ...DEFAULT_AI_SETTINGS, ...JSON.parse(s) });
    
    // Check status using the saved URL, not just default
    checkLocalBackendStatus(s ? JSON.parse(s).localUrl : undefined).then(setLocalStatus);
  }, []);

  const handleSave = () => {
    saveAiSettings(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
    // Re-check local status with new URL
    checkLocalBackendStatus(settings.localUrl).then(setLocalStatus);
  };

  const handleReset = () => {
    setSettings(DEFAULT_AI_SETTINGS);
  };

  const providers: {id: AiProvider, label: string}[] = [
      { id: 'local', label: 'Local (Offline)' },
      { id: 'gemini', label: 'Google Gemini' },
      { id: 'openai', label: 'OpenAI' },
      { id: 'anthropic', label: 'Anthropic Claude' },
      { id: 'openrouter', label: 'OpenRouter' },
  ];

  return (
    <div className="p-8 bg-slate-950 h-full text-slate-300 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                 <Sliders className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                 <h2 className="text-3xl font-bold text-white">Settings</h2>
                 <p className="text-slate-500 text-sm mt-1">Configure your latent space engines.</p>
              </div>
            </div>
            <div className="flex gap-2">
                <Button variant="secondary" onClick={handleReset}><RotateCcw className="w-4 h-4 mr-2"/> Defaults</Button>
                <Button variant="primary" onClick={handleSave}>
                    {isSaved ? <CheckCircle2 className="w-4 h-4 mr-2"/> : <Save className="w-4 h-4 mr-2"/>} 
                    {isSaved ? 'Saved' : 'Save Changes'}
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            
            {/* COLUMN 1: Active Provider & Configuration */}
            <div className="space-y-8">
                {/* Active Provider Selector */}
                <div className="bg-slate-900 p-6 rounded-lg border border-slate-800">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <CircuitBoard className="w-5 h-5 mr-2 text-indigo-500" />
                        Active Intelligence Provider
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                        {providers.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setSettings({...settings, activeProvider: p.id})}
                                className={`p-3 rounded-md border text-left transition-all flex items-center justify-between ${
                                    settings.activeProvider === p.id 
                                    ? 'bg-indigo-600/20 border-indigo-500 text-white' 
                                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                                }`}
                            >
                                <span className="font-medium text-sm">{p.label}</span>
                                {p.id === 'local' && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${localStatus ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {localStatus ? 'ONLINE' : 'OFFLINE'}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Local Architecture (Shown only if Local is active) */}
                {settings.activeProvider === 'local' && (
                    <div className="bg-slate-900 p-6 rounded-lg border border-slate-800 relative overflow-hidden">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <Server className="w-5 h-5 mr-2 text-emerald-500" />
                            Local Stack Architecture
                        </h3>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <button 
                                onClick={() => setSettings({...settings, localBackendType: 'hybrid', visionModelType: 'florence2'})}
                                className={`p-4 rounded-lg border text-left transition-all relative ${
                                    settings.localBackendType === 'hybrid' 
                                    ? 'bg-emerald-500/10 border-emerald-500' 
                                    : 'bg-slate-950 border-slate-800 opacity-60 hover:opacity-100'
                                }`}
                            >
                                <div className="text-xs font-bold uppercase tracking-wider mb-1 text-emerald-400">Pro Stack (Recommended)</div>
                                <div className="font-bold text-white mb-2">Hybrid</div>
                                <div className="text-[10px] text-slate-400 space-y-1">
                                    <div className="flex items-center"><Box className="w-3 h-3 mr-1"/> LocalCura (Python)</div>
                                    <div className="pl-4 text-emerald-500/70">↳ Florence-2 (Vision)</div>
                                    <div className="pl-4 text-emerald-500/70">↳ SigLIP (Aesthetics)</div>
                                    <div className="flex items-center mt-1"><Layers className="w-3 h-3 mr-1"/> Ollama</div>
                                    <div className="pl-4 text-emerald-500/70">↳ Qwen (Logic)</div>
                                </div>
                                {settings.localBackendType === 'hybrid' && <div className="absolute top-2 right-2 text-emerald-500"><CheckCircle2 className="w-4 h-4"/></div>}
                            </button>

                            <button 
                                onClick={() => setSettings({...settings, localBackendType: 'ollama_only', visionModelType: 'ollama_vision'})}
                                className={`p-4 rounded-lg border text-left transition-all relative ${
                                    settings.localBackendType === 'ollama_only' 
                                    ? 'bg-blue-500/10 border-blue-500' 
                                    : 'bg-slate-950 border-slate-800 opacity-60 hover:opacity-100'
                                }`}
                            >
                                <div className="text-xs font-bold uppercase tracking-wider mb-1 text-blue-400">Lite Stack</div>
                                <div className="font-bold text-white mb-2">Ollama Only</div>
                                <div className="text-[10px] text-slate-400 space-y-1">
                                    <div className="flex items-center"><Layers className="w-3 h-3 mr-1"/> Ollama</div>
                                    <div className="pl-4 text-blue-500/70">↳ LLaVA (Vision)</div>
                                    <div className="pl-4 text-blue-500/70">↳ Qwen (Logic)</div>
                                    <div className="mt-2 text-slate-600 italic">No Python backend required.</div>
                                </div>
                                {settings.localBackendType === 'ollama_only' && <div className="absolute top-2 right-2 text-blue-500"><CheckCircle2 className="w-4 h-4"/></div>}
                            </button>
                        </div>
                        
                        {/* URL Configs */}
                        <div className="space-y-3 pt-4 border-t border-slate-800">
                             {settings.localBackendType === 'hybrid' && (
                                 <div>
                                     <label className="block text-xs font-medium text-emerald-400 mb-1 flex items-center">
                                         <Box className="w-3 h-3 mr-1" />
                                         LocalCura URL (Python Backend)
                                     </label>
                                     <input type="text" value={settings.localUrl} onChange={e => setSettings({...settings, localUrl: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs focus:border-emerald-500 outline-none font-mono" />
                                 </div>
                             )}
                             <div>
                                 <label className="block text-xs font-medium text-blue-400 mb-1 flex items-center">
                                     <Layers className="w-3 h-3 mr-1" />
                                     Ollama URL
                                 </label>
                                 <input type="text" value={settings.ollamaUrl} onChange={e => setSettings({...settings, ollamaUrl: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs focus:border-blue-500 outline-none font-mono" />
                             </div>
                        </div>
                    </div>
                )}

                {/* Cloud Keys (Only if Cloud Active) */}
                {settings.activeProvider !== 'local' && (
                    <div className="bg-slate-900 p-6 rounded-lg border border-slate-800">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <Key className="w-5 h-5 mr-2 text-yellow-500" />
                            Cloud API Keys
                        </h3>
                        
                        <div className="space-y-4">
                            {/* Gemini Config */}
                            <div className="p-3 bg-slate-950 rounded border border-slate-800">
                                <div className="flex justify-between mb-1">
                                    <label className="text-xs font-medium text-slate-300">Google Gemini</label>
                                </div>
                                <input 
                                    type="password" 
                                    placeholder="AIza..." 
                                    value={settings.geminiKey} 
                                    onChange={e => setSettings({...settings, geminiKey: e.target.value})} 
                                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs focus:border-indigo-500 outline-none" 
                                />
                            </div>

                            {/* OpenAI Config */}
                            <div className="p-3 bg-slate-950 rounded border border-slate-800">
                                <div className="flex justify-between mb-1">
                                    <label className="text-xs font-medium text-slate-300">OpenAI</label>
                                    <input type="text" placeholder="Model ID (e.g. gpt-4o)" value={settings.openaiModel} onChange={e => setSettings({...settings, openaiModel: e.target.value})} className="bg-transparent text-right text-[10px] text-slate-500 focus:text-white outline-none" />
                                </div>
                                <input type="password" placeholder="sk-..." value={settings.openaiKey} onChange={e => setSettings({...settings, openaiKey: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs focus:border-indigo-500 outline-none" />
                            </div>

                            {/* Anthropic Config */}
                            <div className="p-3 bg-slate-950 rounded border border-slate-800">
                                <div className="flex justify-between mb-1">
                                    <label className="text-xs font-medium text-slate-300">Anthropic Claude</label>
                                    <input type="text" placeholder="Model (e.g. claude-3-5-sonnet...)" value={settings.anthropicModel} onChange={e => setSettings({...settings, anthropicModel: e.target.value})} className="bg-transparent text-right text-[10px] text-slate-500 focus:text-white outline-none" />
                                </div>
                                <input 
                                    type="password" 
                                    placeholder="sk-ant-..." 
                                    value={settings.anthropicKey} 
                                    onChange={e => setSettings({...settings, anthropicKey: e.target.value})} 
                                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs focus:border-indigo-500 outline-none" 
                                />
                            </div>

                            {/* OpenRouter Config */}
                            <div className="p-3 bg-slate-950 rounded border border-slate-800">
                                <div className="flex justify-between mb-1">
                                    <label className="text-xs font-medium text-slate-300">OpenRouter</label>
                                    <input type="text" placeholder="Model ID (e.g. google/gemini...)" value={settings.openrouterModel} onChange={e => setSettings({...settings, openrouterModel: e.target.value})} className="bg-transparent text-right text-[10px] text-slate-500 focus:text-white outline-none" />
                                </div>
                                <input 
                                    type="password" 
                                    placeholder="sk-or-..." 
                                    value={settings.openrouterKey} 
                                    onChange={e => setSettings({...settings, openrouterKey: e.target.value})} 
                                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs focus:border-indigo-500 outline-none" 
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* COLUMN 2: Model Manager */}
            <div className="space-y-8">
                {/* Orchestration Toggle */}
                <div className="bg-slate-900 p-6 rounded-lg border border-slate-800">
                     <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
                        <BrainCircuit className="w-5 h-5 mr-2 text-purple-500" />
                        Agentic Workflow
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                        Enable multi-step reasoning (Vision → Thinking → Output).
                    </p>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setSettings({...settings, enableAgenticWorkflow: !settings.enableAgenticWorkflow})}
                            className="flex items-center gap-2"
                        >
                            {settings.enableAgenticWorkflow 
                                ? <ToggleRight className="w-8 h-8 text-purple-500" /> 
                                : <ToggleLeft className="w-8 h-8 text-slate-600" />
                            }
                            <span className={`text-sm font-medium ${settings.enableAgenticWorkflow ? 'text-white' : 'text-slate-500'}`}>
                                {settings.enableAgenticWorkflow ? 'Active (Chain-of-Thought)' : 'Disabled (Single Pass)'}
                            </span>
                        </button>
                    </div>
                </div>

                <div className="bg-slate-900 p-6 rounded-lg border border-slate-800">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <Cpu className="w-5 h-5 mr-2 text-emerald-500" />
                        Installation Manager
                    </h3>
                    
                    <ModelManager settings={settings} onUpdateSettings={setSettings} />
                </div>

            </div>
        </div>

      </div>
    </div>
  );
};