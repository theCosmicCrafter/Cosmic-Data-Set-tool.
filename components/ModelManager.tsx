import React, { useState, useEffect, useRef } from 'react';
import { AiSettings } from '../types';
import { Button } from './Button';
import { 
    FolderSearch, Download, CheckCircle2, AlertCircle, 
    FileTerminal, ExternalLink, HardDrive, Cpu, RefreshCw, Terminal, XCircle, Play, Box, Layers, Server
} from 'lucide-react';

interface ModelManagerProps {
    settings: AiSettings;
    onUpdateSettings: (s: AiSettings) => void;
}

interface ModelRequirement {
    id: 'vision' | 'aesthetic' | 'thinking';
    name: string;
    description: string;
    recommended: string;
    hfUrl: string;
    currentPath?: string;
    backend: 'python' | 'ollama';
    matcher: (path: string) => boolean;
}

export const ModelManager: React.FC<ModelManagerProps> = ({ settings, onUpdateSettings }) => {
    const [basePath, setBasePath] = useState('C:\\CosmicModels');
    const [scanResult, setScanResult] = useState<string>('');
    const [installingId, setInstallingId] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);

    const REQUIREMENTS: ModelRequirement[] = [
        {
            id: 'vision',
            name: 'Vision Engine (Florence-2)',
            description: 'Analyzes image pixels.',
            recommended: 'Florence-2-large-PromptGen-v2.0',
            hfUrl: 'https://huggingface.co/microsoft/Florence-2-large-PromptGen-v2.0',
            currentPath: settings.visionModelPath,
            backend: 'python',
            matcher: (p) => p.toLowerCase().includes('florence') || p.toLowerCase().includes('vision')
        },
        {
            id: 'thinking',
            name: 'Cognition Engine (Qwen)',
            description: 'Agentic reasoning & JSON formatting.',
            recommended: 'qwen2.5-coder:7b',
            hfUrl: 'https://ollama.com/library/qwen2.5-coder',
            currentPath: settings.agenticThinkingModel,
            backend: 'ollama',
            matcher: (p) => p.toLowerCase().includes('qwen') || p.toLowerCase().includes('llama')
        },
        {
            id: 'aesthetic',
            name: 'Aesthetic Scorer (SigLIP)',
            description: 'Rates quality 1-10.',
            recommended: 'google/siglip-so400m-patch14-384',
            hfUrl: 'https://huggingface.co/google/siglip-so400m-patch14-384',
            currentPath: settings.aestheticModelPath,
            backend: 'python',
            matcher: (p) => p.toLowerCase().includes('siglip') || p.toLowerCase().includes('vit-l')
        }
    ];

    useEffect(() => {
        if ((window as any).ipcRenderer) {
            (window as any).ipcRenderer.onInstallLog((_event: any, msg: string) => {
                setLogs(prev => [...prev, msg]);
            });
        }
        return () => {
            if ((window as any).ipcRenderer) {
                (window as any).ipcRenderer.removeInstallLogListener();
            }
        };
    }, []);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const handleBrowse = async () => {
        if ((window as any).ipcRenderer) {
            try {
                const path = await (window as any).ipcRenderer.selectFolder();
                if (path) {
                    setBasePath(path);
                }
            } catch (e) {
                console.error(e);
            }
        } else {
            alert("Desktop mode required for folder picker.");
        }
    };

    const handleInstall = async (modelId: string) => {
        if (!basePath && modelId !== 'backend_deps') {
            alert("Please set a Local Model Library Root first.");
            return;
        }

        if (!(window as any).ipcRenderer) {
            alert("Auto-install is only available in the Desktop application.");
            return;
        }

        setInstallingId(modelId);
        setLogs([`> Initiating install for ${modelId}...`]);
        
        try {
            const success = await (window as any).ipcRenderer.installModel(modelId, basePath);
            if (success) {
                setLogs(prev => [...prev, `> DONE! Operation complete.`]);
                // Auto-update path if successful
                if (modelId === 'vision') onUpdateSettings({...settings, visionModelPath: `${basePath}\\llm\\Florence-2-large-PromptGen-v2.0`});
                if (modelId === 'thinking') onUpdateSettings({...settings, agenticThinkingModel: 'qwen2.5-coder:7b'});
                if (modelId === 'aesthetic') onUpdateSettings({...settings, aestheticModelPath: `${basePath}\\textencoder\\siglip-so400m-patch14-384`});
            } else {
                setLogs(prev => [...prev, `> ERROR: Operation failed. See logs above.`]);
            }
        } catch (e) {
            setLogs(prev => [...prev, `> EXCEPTION: ${e}`]);
        } finally {
            setInstallingId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Backend Setup */}
            {settings.localBackendType === 'hybrid' && (
                <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-lg p-4">
                     <div className="flex items-start justify-between">
                        <div>
                            <h4 className="text-sm font-semibold text-emerald-400 flex items-center mb-1">
                                <Server className="w-4 h-4 mr-2" />
                                Python Backend Environment
                            </h4>
                            <p className="text-xs text-slate-400">
                                Required for Florence-2 and SigLIP. Installs <code>torch</code>, <code>transformers</code>, <code>fastapi</code>.
                            </p>
                        </div>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => handleInstall('backend_deps')}
                            disabled={!!installingId}
                        >
                             {installingId === 'backend_deps' ? <RefreshCw className="w-3 h-3 mr-2 animate-spin"/> : <Box className="w-3 h-3 mr-2"/>}
                             Install Requirements
                        </Button>
                     </div>
                </div>
            )}

            {/* Base Directory Selector */}
            <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                <label className="block text-xs font-medium text-zinc-500 mb-2">Local Model Library Root</label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <HardDrive className="absolute left-3 top-2.5 w-4 h-4 text-zinc-600" />
                        <input 
                            type="text" 
                            value={basePath}
                            onChange={(e) => setBasePath(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded pl-9 pr-3 py-2 text-sm focus:border-emerald-500 outline-none font-mono"
                        />
                    </div>
                    <Button variant="secondary" onClick={handleBrowse}>
                        <FolderSearch className="w-4 h-4 mr-2" />
                        Browse
                    </Button>
                </div>
            </div>

            {/* Model Checklist */}
            <div className="space-y-3">
                {REQUIREMENTS.map((req) => {
                    const isConfigured = req.currentPath && req.currentPath.length > 2;
                    const isInstalling = installingId === req.id;
                    
                    // Skip showing Python-backend models if user is in "Ollama Only" mode
                    if (settings.localBackendType === 'ollama_only' && req.backend === 'python') return null;

                    return (
                        <div key={req.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col gap-3 group hover:border-zinc-700 transition-all">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-sm font-semibold text-zinc-200">{req.name}</h4>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded flex items-center border ${req.backend === 'python' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                            {req.backend === 'python' ? <Box className="w-3 h-3 mr-1"/> : <Layers className="w-3 h-3 mr-1"/>}
                                            {req.backend === 'python' ? 'LocalCura' : 'Ollama'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-500 mb-3">{req.description}</p>
                                </div>

                                {!isConfigured && (
                                    <Button 
                                        variant="primary" 
                                        size="sm" 
                                        onClick={() => handleInstall(req.id)}
                                        disabled={!!installingId}
                                        className={isInstalling ? "animate-pulse" : ""}
                                    >
                                        {isInstalling ? <RefreshCw className="w-3 h-3 mr-2 animate-spin"/> : <Download className="w-3 h-3 mr-2"/>}
                                        {isInstalling ? "Installing..." : "Auto-Install"}
                                    </Button>
                                )}
                            </div>
                            
                            {/* Path Config */}
                            <div className="space-y-2">
                                <div className="relative">
                                    <Cpu className="absolute left-2.5 top-2 w-3 h-3 text-zinc-600" />
                                    <input 
                                        type="text" 
                                        value={req.currentPath}
                                        onChange={(e) => {
                                            if (req.id === 'vision') onUpdateSettings({...settings, visionModelPath: e.target.value});
                                            if (req.id === 'thinking') onUpdateSettings({...settings, agenticThinkingModel: e.target.value});
                                            if (req.id === 'aesthetic') onUpdateSettings({...settings, aestheticModelPath: e.target.value});
                                        }}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded pl-8 pr-20 py-1.5 text-xs text-zinc-300 focus:border-blue-500 outline-none font-mono"
                                        placeholder="Path or HuggingFace ID..."
                                    />
                                    <button 
                                        onClick={() => {
                                            if (req.id === 'vision') onUpdateSettings({...settings, visionModelPath: req.recommended});
                                            if (req.id === 'thinking') onUpdateSettings({...settings, agenticThinkingModel: req.recommended});
                                            if (req.id === 'aesthetic') onUpdateSettings({...settings, aestheticModelPath: req.recommended});
                                        }}
                                        className="absolute right-1 top-1 bottom-1 px-2 bg-zinc-800 hover:bg-zinc-700 text-[10px] rounded text-zinc-400"
                                        title="Use Recommended Default"
                                    >
                                        <RefreshCw className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {/* Terminal Output */}
            {logs.length > 0 && (
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                             <Terminal className="w-3 h-3" />
                             <span>Installation Terminal</span>
                         </div>
                         <button onClick={() => setLogs([])} className="text-[10px] text-zinc-600 hover:text-white">Clear</button>
                    </div>
                    <div className="bg-black rounded-lg border border-zinc-800 p-4 h-48 overflow-y-auto font-mono text-[10px] text-zinc-300 shadow-inner">
                        {logs.map((log, i) => (
                            <div key={i} className="whitespace-pre-wrap mb-1 border-l-2 border-transparent hover:border-emerald-500 pl-1">{log}</div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>
                </div>
            )}
        </div>
    );
};