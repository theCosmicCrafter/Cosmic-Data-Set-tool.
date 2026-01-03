import React, { useState, useMemo } from 'react';
import { Asset, AssetType } from '../types';
import { Button } from '../components/Button';
import { 
  Plus, Filter, SlidersHorizontal, CheckSquare, Square, X, 
  Wand2, Trash2, CheckCircle2, Trophy, Music, Image as ImageIcon,
  Edit3, Search, LayoutGrid, LayoutList, ArrowUpDown, Sparkles, MonitorPlay, Layers, Film, HardDrive
} from 'lucide-react';

interface LibraryViewProps {
  assets: Asset[];
  onSelect: (id: string) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onBatchAiAnalysis: () => void;
  onDeleteSelected: () => void;
  isBatchProcessing: boolean;
  processingProgress: { current: number, total: number } | null;
  onEdit?: (id: string) => void;
  onLoadDemoData?: () => void;
}

type SortOption = 'date_new' | 'date_old' | 'score_high' | 'score_low' | 'rating';

export const LibraryView: React.FC<LibraryViewProps> = ({ 
  assets, onSelect, onUpload,
  selectedIds, onToggleSelection, onClearSelection, onSelectAll,
  onBatchAiAnalysis, onDeleteSelected, isBatchProcessing, processingProgress,
  onEdit, onLoadDemoData
}) => {
  
  const [filterType, setFilterType] = useState<'all' | AssetType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewDensity, setViewDensity] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('date_new');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const isSelectionMode = selectedIds.size > 0;

  // Filtering & Sorting Logic
  const processedAssets = useMemo(() => {
    let result = assets.filter(a => {
      const matchesType = filterType === 'all' || a.type === filterType;
      const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            a.tags.some(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesType && matchesSearch;
    });

    return result.sort((a, b) => {
      switch (sortBy) {
        case 'date_new': return -1; // Mock date sort
        case 'date_old': return 1;
        case 'rating': return b.rating - a.rating;
        case 'score_high': 
          return (b.aesthetic?.score || 0) - (a.aesthetic?.score || 0);
        case 'score_low':
          return (a.aesthetic?.score || 0) - (b.aesthetic?.score || 0);
        default: return 0;
      }
    });
  }, [assets, filterType, searchQuery, sortBy]);

  return (
    <div className="flex flex-col h-full bg-slate-950 relative">
      {/* --- HUD TOOLBAR --- */}
      <div className="flex flex-col gap-4 p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 shadow-2xl">
        
        {/* Top Row: Title & Search */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <Layers className="w-5 h-5 text-emerald-400" />
             </div>
             <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                Dataset Library
             </h2>
             <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                {processedAssets.length} ASSETS
             </span>
          </div>

          <div className="flex-1 max-w-md relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Search tags, names..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              />
          </div>

          <div className="flex items-center gap-2">
             <div className="relative">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept="image/*,audio/*,video/*"
                  className="hidden"
                  onChange={onUpload}
                />
                <Button variant="cosmic" size="sm" onClick={() => document.getElementById('file-upload')?.click()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ingest Data
                </Button>
             </div>
          </div>
        </div>

        {/* Bottom Row: Filters & Controls */}
        <div className="flex items-center justify-between">
           
           {/* Type Toggles */}
           <div className="flex items-center bg-slate-950 rounded-lg p-1 border border-slate-800 shadow-inner">
               {(['all', 'image', 'audio', 'video'] as const).map(type => (
                 <button 
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    filterType === type 
                    ? 'bg-slate-800 text-emerald-300 shadow-sm border border-slate-700' 
                    : 'text-slate-500 hover:text-slate-300'
                  }`}
                 >
                   {type.toUpperCase()}
                 </button>
               ))}
           </div>

           {/* View Controls */}
           <div className="flex items-center gap-2">
              
              {/* Sort Dropdown Trigger */}
              <div className="relative">
                <Button variant="glass" size="xs" onClick={() => setShowSortMenu(!showSortMenu)}>
                  <ArrowUpDown className="w-3 h-3 mr-2 text-slate-400" />
                  Sort
                </Button>
                {/* Sort Menu */}
                {showSortMenu && (
                  <div className="absolute top-full right-0 mt-2 w-40 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 p-1 flex flex-col gap-0.5" onMouseLeave={() => setShowSortMenu(false)}>
                      <button onClick={() => setSortBy('date_new')} className="text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded">Newest First</button>
                      <button onClick={() => setSortBy('score_high')} className="text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded">High Aesthetic</button>
                      <button onClick={() => setSortBy('score_low')} className="text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded">Low Aesthetic</button>
                      <button onClick={() => setSortBy('rating')} className="text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded">Rating</button>
                  </div>
                )}
              </div>

              <div className="h-4 w-px bg-slate-700 mx-1"></div>

              <Button 
                variant={viewDensity === 'grid' ? 'secondary' : 'ghost'} 
                size="icon" 
                onClick={() => setViewDensity('grid')}
                className="w-8 h-8"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button 
                variant={viewDensity === 'list' ? 'secondary' : 'ghost'} 
                size="icon" 
                onClick={() => setViewDensity('list')}
                className="w-8 h-8"
              >
                <LayoutList className="w-4 h-4" />
              </Button>

              {isSelectionMode && (
                <>
                  <div className="h-4 w-px bg-slate-700 mx-1"></div>
                  <Button variant="ghost" size="xs" onClick={onSelectAll} className="text-emerald-400">
                    Select All
                  </Button>
                </>
              )}
           </div>
        </div>
      </div>

      {/* --- CONTENT GRID --- */}
      <div className="flex-1 overflow-y-auto p-6 pb-32">
        {processedAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
            <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mb-4 shadow-lg shadow-black/50">
              <Sparkles className="w-8 h-8 text-emerald-500 opacity-50" />
            </div>
            <p className="text-lg font-medium text-slate-300 mb-1">Dataset Empty</p>
            <p className="text-sm mb-4">Ingest data to begin curation.</p>
            {onLoadDemoData && (
                <Button variant="secondary" size="sm" onClick={onLoadDemoData}>
                    <HardDrive className="w-4 h-4 mr-2" />
                    Load Sample Data
                </Button>
            )}
          </div>
        ) : (
          <div className={viewDensity === 'grid' 
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4" 
            : "flex flex-col gap-2"
          }>
            {processedAssets.map((asset) => {
              const isSelected = selectedIds.has(asset.id);
              
              if (viewDensity === 'list') {
                 // LIST VIEW CARD
                 return (
                    <div 
                      key={asset.id} 
                      className={`flex items-center gap-4 p-3 rounded-lg border transition-all hover:bg-slate-900 ${
                        isSelected ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-800 bg-slate-900/40'
                      }`}
                      onClick={() => isSelectionMode ? onToggleSelection(asset.id) : onSelect(asset.id)}
                    >
                       <div className="w-12 h-12 shrink-0 rounded overflow-hidden bg-black relative flex items-center justify-center">
                          {asset.type === 'image' ? (
                            <img src={asset.thumbnailUrl} className="w-full h-full object-cover" />
                          ) : asset.type === 'video' ? (
                            <Film className="w-6 h-6 text-slate-400" />
                          ) : (
                            <Music className="w-6 h-6 text-slate-500" />
                          )}
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate">{asset.name}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                             {asset.processed && <span className="text-emerald-400 flex items-center"><CheckCircle2 className="w-3 h-3 mr-1"/>Tagged</span>}
                             <span>•</span>
                             <span>{asset.type === 'image' || asset.type === 'video' ? (asset.metadata as any).resolution : (asset.metadata as any).duration}</span>
                          </div>
                       </div>
                       {asset.aesthetic && (
                         <div className={`px-2 py-1 rounded text-xs font-bold ${asset.aesthetic.score >= 7 ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-400 bg-slate-800'}`}>
                            {asset.aesthetic.score}
                         </div>
                       )}
                       <div onClick={e => { e.stopPropagation(); onToggleSelection(asset.id); }}>
                          {isSelected ? <CheckSquare className="w-5 h-5 text-emerald-500" /> : <Square className="w-5 h-5 text-slate-700" />}
                       </div>
                    </div>
                 )
              }

              // GRID VIEW CARD (Cyberpunk Style)
              return (
                <div 
                  key={asset.id} 
                  className={`group relative aspect-square bg-slate-900 rounded-xl overflow-hidden border transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] ${
                    isSelected 
                    ? 'border-emerald-500 ring-2 ring-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] z-10' 
                    : 'border-slate-800 hover:border-slate-600 hover:-translate-y-1'
                  }`}
                >
                    {/* Main Click Handler */}
                    <div className="absolute inset-0 z-0 cursor-pointer" onClick={() => isSelectionMode ? onToggleSelection(asset.id) : onSelect(asset.id)}></div>
                    
                    {/* Image / Content */}
                    {asset.type === 'image' ? (
                        <div className="w-full h-full relative">
                           <img 
                               src={asset.thumbnailUrl} 
                               alt={asset.name} 
                               loading="lazy"
                               className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 pointer-events-none opacity-80 group-hover:opacity-100"
                           />
                           {/* Scanline Effect on Hover */}
                           <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-1000 pointer-events-none z-10"></div>
                        </div>
                    ) : asset.type === 'video' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/80 text-slate-700 relative overflow-hidden">
                             <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-fuchsia-900 via-slate-900 to-black"></div>
                             <Film className="w-16 h-16 mb-2 opacity-50 relative z-10 group-hover:text-fuchsia-400 transition-colors" />
                             <span className="text-xs text-slate-500 relative z-10 border border-slate-700 px-2 rounded">VIDEO</span>
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/80 text-slate-700 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900 via-slate-900 to-black"></div>
                            <Music className="w-16 h-16 mb-2 opacity-50 relative z-10 group-hover:text-emerald-400 transition-colors" />
                            <div className="w-full px-8 h-8 flex items-end gap-1 justify-center opacity-30 relative z-10">
                                {[...Array(6)].map((_,i) => (
                                    <div key={i} className="w-1 bg-emerald-500 rounded-t-sm group-hover:animate-pulse" style={{height: `${20 + Math.random() * 80}%`, animationDelay: `${i*0.1}s`}}></div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Selection Checkbox (Top Left - Always visible on hover or select) */}
                    <div 
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleSelection(asset.id);
                        }}
                        className={`absolute top-2 left-2 z-20 transition-all duration-200 transform ${
                           isSelected 
                           ? 'opacity-100 scale-100' 
                           : 'opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100'
                        }`}
                    >
                        <div className={`p-1.5 rounded-lg backdrop-blur-md shadow-lg border ${isSelected ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-black/60 text-slate-400 border-white/10 hover:text-white'}`}>
                           {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </div>
                    </div>

                    {/* Quick Edit (Center) - NOW AVAILABLE FOR VIDEOS TOO */}
                    {(asset.type === 'image' || asset.type === 'video') && !isSelectionMode && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100">
                             <Button 
                                variant="glass" 
                                size="sm" 
                                className="rounded-full shadow-[0_0_15px_black]"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit && onEdit(asset.id);
                                }}
                             >
                                <Edit3 className="w-4 h-4" />
                             </Button>
                        </div>
                    )}

                    {/* Bottom Info HUD */}
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent translate-y-2 group-hover:translate-y-0 transition-transform duration-300 pointer-events-none">
                        <div className="flex justify-between items-end">
                            <div className="flex-1 min-w-0 pr-2">
                                <p className="text-xs text-white font-semibold truncate tracking-tight">{asset.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-slate-400 bg-slate-800/80 px-1 rounded">
                                        {asset.type.toUpperCase()}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                        {asset.type === 'image' || asset.type === 'video' ? (asset.metadata as any).resolution : (asset.metadata as any).duration}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Score Badge */}
                            {asset.aesthetic && (
                                <div className={`flex flex-col items-center justify-center w-8 h-8 rounded-lg border backdrop-blur-sm shadow-lg ${
                                    asset.aesthetic.score >= 8 
                                    ? 'bg-emerald-900/60 border-emerald-500/50 text-emerald-400' 
                                    : 'bg-slate-800/80 border-slate-600 text-slate-300'
                                }`}>
                                    <span className="text-xs font-bold leading-none">{asset.aesthetic.score}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Top Right Status Indicators */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1 items-end pointer-events-none">
                        {asset.processed && (
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_cyan]" title="Processed"></div>
                        )}
                        {asset.aesthetic?.isGalleryStandard && (
                             <Trophy className="w-3 h-3 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" />
                        )}
                    </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- SELECTION ACTION BAR (Floating) --- */}
      {isSelectionMode && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-auto min-w-[320px] bg-slate-900/80 backdrop-blur-xl border border-emerald-500/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] p-2 z-50 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-6 ring-1 ring-white/10">
             
             <div className="flex items-center gap-3 pl-2">
                <div className="bg-emerald-500 rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_10px_#10b981]">
                    {selectedIds.size}
                </div>
                <span className="text-xs font-medium text-slate-300">Selected</span>
             </div>

             <div className="h-6 w-px bg-white/10 mx-1"></div>

             <Button 
                variant="cosmic" 
                size="sm" 
                onClick={onBatchAiAnalysis}
                disabled={isBatchProcessing}
             >
                 {isBatchProcessing ? (
                     <>
                        <Wand2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                        {processingProgress ? `${processingProgress.current}/${processingProgress.total}` : 'Working...'}
                     </>
                 ) : (
                     <>
                        <Wand2 className="w-3.5 h-3.5 mr-2" />
                        Auto-Tag
                     </>
                 )}
             </Button>

             <Button variant="danger" size="icon" onClick={onDeleteSelected} disabled={isBatchProcessing} className="rounded-xl">
                 <Trash2 className="w-4 h-4" />
             </Button>
             
             <div className="h-6 w-px bg-white/10 mx-1"></div>
             
             <Button variant="ghost" size="sm" onClick={onClearSelection} className="text-slate-400 hover:text-white">
                 <X className="w-4 h-4" />
             </Button>
          </div>
      )}
    </div>
  );
};
