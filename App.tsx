import React, { useState, useEffect, useRef } from 'react';
import { ViewMode, Asset, TagSource, Tag } from './types';
import { MOCK_ASSETS, generateId } from './services/mockData';
import { LibraryView } from './views/LibraryView';
import { CuratorView } from './views/CuratorView';
import { InsightsView } from './views/InsightsView';
import { ToolsView } from './views/ToolsView';
import { SettingsView } from './views/SettingsView';
import { EditorView } from './views/EditorView';
import { analyzeAssetWithGemini, blobToBase64 } from './services/geminiService';
import { analyzeAssetUniversal } from './services/universalAiService';
import { 
  Layers, Activity, Sliders, Cpu, 
  Github, Sparkles, Database, ScanFace, ChevronDown, Settings, LogOut, ChevronRight
} from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('library');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  
  // Initialize from LocalStorage or Empty (Production Ready: No Mock Data by default)
  const [assets, setAssets] = useState<Asset[]>(() => {
    try {
        const saved = localStorage.getItem('cosmic_assets');
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Batch Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<{current: number, total: number} | null>(null);

  // Persistence Effect
  useEffect(() => {
    localStorage.setItem('cosmic_assets', JSON.stringify(assets));
  }, [assets]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navigation Handler
  const handleNav = (mode: ViewMode) => {
    setView(mode);
    setIsMenuOpen(false);
    if (mode !== 'curator' && mode !== 'editor') setSelectedAssetId(null);
  };

  const handleAssetSelect = (id: string) => {
    setSelectedAssetId(id);
    setView('curator');
  };

  const handleAssetEdit = (id: string) => {
    setSelectedAssetId(id);
    setView('editor');
  }

  const handleAssetUpdate = (id: string, updates: Partial<Asset>) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const handleCreateAsset = (newAsset: Asset) => {
      setAssets(prev => [newAsset, ...prev]);
  };

  const handleAssetReplace = (newAssets: Asset[]) => {
    setAssets(newAssets);
  };
  
  const handleAssetSaveNewVersion = (originalId: string, newUrl: string) => {
      setAssets(prev => prev.map(a => a.id === originalId ? { ...a, url: newUrl } : a));
  };

  const handleLoadDemoData = () => {
      if (window.confirm("Load sample data? This will merge 7 mock assets into your library.")) {
          setAssets(prev => [...prev, ...MOCK_ASSETS]);
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newAssets: Asset[] = Array.from(e.target.files).map((file: File) => {
          const isAudio = file.type.startsWith('audio');
          const isVideo = file.type.startsWith('video');
          const type = isAudio ? 'audio' : (isVideo ? 'video' : 'image');
          
          return {
            id: generateId(),
            type,
            url: URL.createObjectURL(file),
            thumbnailUrl: isAudio || isVideo ? '' : URL.createObjectURL(file),
            name: file.name,
            metadata: {
                fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                // Default placeholders
                ...(isAudio || isVideo ? { duration: '0:00' } : { resolution: 'Unknown' }),
                ...(isAudio ? { bpm: 0 } : {}),
                ...(isVideo ? { fps: 0, resolution: 'Unknown' } : {})
            } as any,
            tags: [],
            rating: 0,
            flagged: false,
            processed: false
          };
      });
      setAssets(prev => [...newAssets, ...prev]);
    }
  };

  // Selection Handlers
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const selectAll = () => {
    setSelectedIds(new Set(assets.map(a => a.id)));
  };

  const deleteSelected = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} assets?`)) {
      setAssets(prev => prev.filter(a => !selectedIds.has(a.id)));
      clearSelection();
    }
  };

  // Batch AI Processing
  const handleBatchAiAnalysis = async () => {
    if (selectedIds.size === 0) return;
    
    setIsBatchProcessing(true);
    let completed = 0;
    const total = selectedIds.size;
    setProcessingProgress({ current: 0, total });

    const idsToProcess = Array.from(selectedIds);

    for (const id of idsToProcess) {
      const asset = assets.find(a => a.id === id);
      if (!asset) continue;

      try {
        let base64: string = "";
        const urlString = String(asset.url);
        
        if (urlString.startsWith('http') || urlString.startsWith('blob')) {
            const response = await fetch(urlString);
            const blob = await response.blob();
            // Cast to Blob explicitly to handle potential type mismatches
            base64 = await blobToBase64(blob as any);
        } else {
            base64 = "mock_base64";
        }

        const result = await analyzeAssetUniversal(asset, base64);
        
        // Map 1-10 Score to 1-5 Rating
        // 9-10 = 5, 7-8 = 4, 5-6 = 3, 3-4 = 2, 1-2 = 1
        const newRating = result.aesthetic ? Math.round(result.aesthetic.score / 2) : asset.rating;

        handleAssetUpdate(id, {
            tags: [...asset.tags, ...result.tags],
            caption: result.caption,
            processed: true,
            metadata: { ...asset.metadata, ...result.metadataGuess },
            aesthetic: result.aesthetic,
            rating: newRating
        });

      } catch (error) {
        console.error(`Failed to process asset ${id}`, error);
      } finally {
        completed++;
        setProcessingProgress({ current: completed, total });
      }
    }

    setIsBatchProcessing(false);
    setProcessingProgress(null);
  };

  const renderContent = () => {
    switch (view) {
      case 'library':
        return (
          <LibraryView 
            assets={assets} 
            onSelect={handleAssetSelect} 
            onUpload={handleFileUpload}
            selectedIds={selectedIds}
            onToggleSelection={toggleSelection}
            onClearSelection={clearSelection}
            onSelectAll={selectAll}
            onBatchAiAnalysis={handleBatchAiAnalysis}
            onDeleteSelected={deleteSelected}
            isBatchProcessing={isBatchProcessing}
            processingProgress={processingProgress}
            onEdit={handleAssetEdit}
            onLoadDemoData={handleLoadDemoData}
          />
        );
      case 'curator':
        const asset = assets.find(a => a.id === selectedAssetId);
        if (!asset) return <div className="text-white p-10">Asset not found</div>;
        return (
          <CuratorView 
            asset={asset} 
            onBack={() => handleNav('library')} 
            onUpdate={handleAssetUpdate}
          />
        );
      case 'editor':
        const editAsset = assets.find(a => a.id === selectedAssetId);
        if (!editAsset) return <div className="text-white p-10">Asset not found</div>;
        return (
            <EditorView 
                asset={editAsset}
                onBack={() => handleNav('library')}
                onSave={handleAssetSaveNewVersion}
                onCreateAsset={handleCreateAsset}
            />
        );
      case 'insights':
        return <InsightsView assets={assets} />;
      case 'tools':
        return <ToolsView assets={assets} onUpdateAssets={handleAssetReplace} />;
      case 'settings':
        return <SettingsView />;
      default:
        return <div />;
    }
  };

  const navItemClass = (mode: ViewMode) => {
    const isActive = view === mode || (mode === 'library' && (view === 'curator' || view === 'editor'));
    return `w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 relative overflow-hidden group ${
      isActive 
      ? `bg-slate-800/80 text-white border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)]` 
      : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`;
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-200 selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 flex flex-col pt-[30px] md:pt-0 z-50">
        
        {/* Header / Logo / Hidden Menu */}
        <div 
          ref={menuRef}
          className="relative h-24 flex items-center px-6 border-b border-slate-800/50 group titlebar-drag-region select-none"
        >
          <div 
            className="flex items-center cursor-pointer no-drag w-full"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <div className="relative mr-4 transition-transform duration-500 group-hover:scale-105">
                {/* Logo Glow */}
                <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <img src="logo.png" alt="Cosmic Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(99,102,241,0.5)] relative z-10" />
            </div>
            <div className="flex-1">
              <h1 className="leading-none text-xl font-black tracking-wide font-[Inter] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-400 drop-shadow-[0_0_2px_rgba(255,255,255,0.1)]">
                  COSMIC
              </h1>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-slate-200">
                  DATA SETS
              </span>
            </div>
            <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isMenuOpen ? 'rotate-90 text-indigo-400' : ''}`} />
          </div>

          {/* Hidden Settings Tab Dropdown */}
          {isMenuOpen && (
            <div className="absolute top-20 left-4 right-4 bg-slate-900 border border-slate-700 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-[100] animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="p-2 space-y-1">
                   <button 
                      onClick={() => handleNav('settings')}
                      className="w-full flex items-center px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                   >
                       <Settings className="w-4 h-4 mr-3 text-amber-400" />
                       Configuration
                   </button>
                   <div className="h-px bg-slate-800 my-1 mx-2"></div>
                   <button className="w-full flex items-center px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors">
                       <LogOut className="w-4 h-4 mr-3" />
                       Close Library
                   </button>
                </div>
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-4 space-y-2">
          
          <button onClick={() => handleNav('library')} className={navItemClass('library')}>
            {/* Active Indicator */}
            {(view === 'library' || view === 'curator' || view === 'editor') && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r-full shadow-[0_0_10px_#10b981]"></div>}
            <Layers className={`w-5 h-5 mr-3 transition-colors ${view === 'library' || view === 'curator' ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'text-slate-500 group-hover:text-emerald-300'}`} />
            <span className="tracking-wide">Library</span>
          </button>
          
          <button onClick={() => handleNav('insights')} className={navItemClass('insights')}>
            {view === 'insights' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-fuchsia-500 rounded-r-full shadow-[0_0_10px_#d946ef]"></div>}
            <Activity className={`w-5 h-5 mr-3 transition-colors ${view === 'insights' ? 'text-fuchsia-400 drop-shadow-[0_0_5px_rgba(217,70,239,0.5)]' : 'text-slate-500 group-hover:text-fuchsia-300'}`} />
            <span className="tracking-wide">Insights</span>
          </button>
          
          <button onClick={() => handleNav('tools')} className={navItemClass('tools')}>
            {view === 'tools' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 rounded-r-full shadow-[0_0_10px_#06b6d4]"></div>}
            <Cpu className={`w-5 h-5 mr-3 transition-colors ${view === 'tools' ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]' : 'text-slate-500 group-hover:text-cyan-300'}`} />
            <span className="tracking-wide">Utilities</span>
          </button>
        </nav>

        {/* Footer Status */}
        <div className="p-4 border-t border-slate-800/50 bg-black/20">
          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800 relative overflow-hidden group">
             {/* Animated Progress Bar Glow */}
             <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
             
             <div className="flex items-center justify-between mb-2 relative z-10">
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Storage</span>
               <span className="text-[10px] text-indigo-300 font-mono">2.4 GB</span>
             </div>
             <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden relative z-10">
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 h-full w-[45%] shadow-[0_0_10px_indigo]"></div>
             </div>
          </div>
          
          <div className="mt-3 flex items-center justify-between px-1">
            <div className="flex items-center text-[10px] text-slate-600 gap-1.5">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#10b981]"></div>
               <span>Online</span>
            </div>
            <span className="text-[10px] text-slate-700 font-mono">v1.1.0</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0b0e14] pt-[30px] md:pt-0 relative">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e14] to-transparent pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col h-full">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;