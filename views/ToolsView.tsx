import React, { useState } from 'react';
import { Asset, TagSource } from '../types';
import { Button } from '../components/Button';
import { 
  Download, FileJson, FileSpreadsheet, Layers, 
  Search, Trash2, AlertTriangle, CheckCircle, RefreshCcw, Archive, Package, Database, HardDrive, Import, Link 
} from 'lucide-react';
import JSZip from 'jszip';
import { generateId } from '../services/mockData';

interface ToolsViewProps {
  assets: Asset[];
  onUpdateAssets: (assets: Asset[]) => void;
}

export const ToolsView: React.FC<ToolsViewProps> = ({ assets, onUpdateAssets }) => {
  const [duplicateResult, setDuplicateResult] = useState<{original: string, duplicate: string}[] | null>(null);
  const [qualityAuditResult, setQualityAuditResult] = useState<string[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportProgress, setExportProgress] = useState<string>('');
  
  // Default to empty to avoid leaking dev paths
  const [eaglePath, setEaglePath] = useState<string>('');
  const [importStats, setImportStats] = useState<{found: number, imported: number} | null>(null);

  // Tool: Duplicate Finder
  const runDuplicateFinder = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const urlMap = new Map<string, string>();
      const duplicates: {original: string, duplicate: string}[] = [];

      assets.forEach(asset => {
        if (urlMap.has(asset.url)) {
          duplicates.push({
            original: urlMap.get(asset.url)!,
            duplicate: asset.id
          });
        } else {
          urlMap.set(asset.url, asset.id);
        }
      });

      setDuplicateResult(duplicates);
      setIsProcessing(false);
    }, 800);
  };

  const deleteDuplicates = () => {
    if (!duplicateResult) return;
    const idsToDelete = new Set(duplicateResult.map(d => d.duplicate));
    const newAssets = assets.filter(a => !idsToDelete.has(a.id));
    onUpdateAssets(newAssets);
    setDuplicateResult([]);
  };

  // Tool: Quality Audit
  const runQualityAudit = () => {
     setIsProcessing(true);
     setTimeout(() => {
       const lowQualityIds = assets
         .filter(a => (a.aesthetic && a.aesthetic.score < 5) || a.tags.length === 0)
         .map(a => a.id);
       
       setQualityAuditResult(lowQualityIds);
       
       // Auto-flag these issues
       if (lowQualityIds.length > 0) {
         const newAssets = assets.map(a => 
           lowQualityIds.includes(a.id) ? { ...a, flagged: true } : a
         );
         onUpdateAssets(newAssets);
       }
       
       setIsProcessing(false);
     }, 800);
  };

  // Tool: Eagle Import
  const handleSelectEagleFolder = async () => {
      if ((window as any).ipcRenderer) {
          try {
              const path = await (window as any).ipcRenderer.selectFolder();
              if (path) {
                  setEaglePath(path);
              }
          } catch (e) {
              console.error("Folder selection failed", e);
              alert("Failed to open folder selector.");
          }
      } else {
          alert("Directory selection is only available in the desktop application mode.");
      }
  };

  const handleScanEagle = async () => {
      if (!eaglePath) return;
      
      if (!(window as any).ipcRenderer) {
          alert("Scanning local libraries requires the desktop application mode.");
          return;
      }

      setIsProcessing(true);
      setExportProgress('Reading metadata.json and tags.json...');

      try {
          const rawAssets = await (window as any).ipcRenderer.scanEagleLibrary(eaglePath);
          
          if (rawAssets && rawAssets.length > 0) {
              const newAssets: Asset[] = rawAssets.map((r: any) => {
                  let type: 'image' | 'video' | 'audio' = 'image';
                  const ext = r.ext ? r.ext.toLowerCase() : 'unknown';
                  if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) type = 'video';
                  if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) type = 'audio';

                  return {
                      id: `eagle-${r.eagleId}`,
                      type: type,
                      url: `file://${r.fullPath}`, // Local file access
                      thumbnailUrl: `file://${r.fullPath}`, // For prototype we use original, normally would parse thumbnail folder
                      name: `${r.name}.${r.ext}`,
                      metadata: {
                          fileSize: 'External',
                          resolution: r.width ? `${r.width}x${r.height}` : 'Unknown',
                          duration: r.duration ? `${Math.floor(r.duration)}s` : undefined
                      } as any,
                      tags: (r.tags || []).map((t: string) => ({
                          id: `eagle-tag-${t}`,
                          name: t,
                          source: TagSource.MANUAL,
                          confidence: 1.0
                      })),
                      rating: r.rating || 0,
                      flagged: false,
                      processed: r.tags && r.tags.length > 0,
                      caption: r.description
                  };
              });

              // Merge with existing
              const existingIds = new Set(assets.map(a => a.id));
              const uniqueNew = newAssets.filter(a => !existingIds.has(a.id));
              
              onUpdateAssets([...assets, ...uniqueNew]);
              setImportStats({ found: rawAssets.length, imported: uniqueNew.length });
          } else {
              setImportStats({ found: 0, imported: 0 });
          }

      } catch (e) {
          console.error(e);
          alert("Failed to scan Eagle library. Ensure the path points to the .library folder containing 'images' and 'metadata.json'.");
      } finally {
          setIsProcessing(false);
          setExportProgress('');
      }
  };

  // Tool: Export
  const handleExport = async (format: 'json' | 'csv' | 'eagle') => {
    setIsProcessing(true);
    setExportProgress('Preparing assets...');

    try {
        const zip = new JSZip();
        
        // Eagle.cool Structure:
        // pack.json
        // images/
        //   {asset_name}.info/ (metadata.json inside)
        //   {asset_name}_original.ext

        if (format === 'eagle') {
             zip.file("pack.json", JSON.stringify({
                 "name": "Cosmic Export",
                 "type": "eaglepack",
                 "version": 1
             }));
        } else {
             const assetsFolder = zip.folder("assets");
        }
        
        const metadataList: any[] = [];
        let count = 0;

        // Iterate and fetch files
        for (const asset of assets) {
            count++;
            setExportProgress(`Packing ${count}/${assets.length}...`);
            
            try {
                // Fetch blob
                const response = await fetch(asset.url);
                if (!response.ok) throw new Error(`Failed to fetch ${asset.url}`);
                const blob = await response.blob();
                
                // Determine extension
                let ext = 'bin';
                if (asset.type === 'image') ext = 'jpg';
                if (asset.type === 'audio') ext = 'mp3';
                if (asset.name.includes('.')) ext = asset.name.split('.').pop()!;

                if (format === 'eagle') {
                    // EaglePack Structure
                    const folderName = `${asset.name}.info`;
                    const folder = zip.folder(folderName);
                    
                    // The File
                    folder?.file(`${asset.name}`, blob);
                    
                    // The Metadata
                    const eagleMeta = {
                        "id": asset.id,
                        "name": asset.name,
                        "size": blob.size,
                        "btime": Date.now(),
                        "mtime": Date.now(),
                        "ext": ext,
                        "tags": asset.tags.map(t => t.name),
                        "folders": [],
                        "isDeleted": false,
                        "url": "",
                        "annotation": asset.caption || "",
                        "modificationTime": Date.now(),
                        "height": 0, // Mock, usually requires reading image header
                        "width": 0,
                        "palettes": asset.aesthetic?.colorPalette.map(c => ({color: c.replace('#',''), ratio: 0})) || []
                    };
                    folder?.file("metadata.json", JSON.stringify(eagleMeta, null, 2));

                } else {
                    // Standard ZIP
                    const filename = `${asset.id}_${asset.name}`;
                    zip.folder("assets")?.file(filename, blob);
                    metadataList.push({
                        ...asset,
                        localPath: `assets/${filename}`
                    });
                }

            } catch (err) {
                console.warn(`Skipping asset ${asset.id} due to download error`, err);
            }
        }

        setExportProgress('Generating metadata...');

        if (format === 'json') {
            zip.file("metadata.json", JSON.stringify(metadataList, null, 2));
        } else if (format === 'csv') {
            const csvContent = "ID,Type,File Path,Tags,Rating,Score/BPM\n" + 
                metadataList.map(a => {
                    const metric = a.type === 'image' ? a.aesthetic?.score : (a.metadata as any).bpm;
                    const tags = a.tags.map((t:any) => t.name).join('|');
                    return `${a.id},${a.type},"${a.localPath}","${tags}",${a.rating},${metric || ''}`
                }).join('\n');
            zip.file("dataset.csv", csvContent);
        }

        setExportProgress('Compressing...');
        
        const zipContent = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipContent);
        
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", url);
        downloadAnchorNode.setAttribute("download", format === 'eagle' ? "cosmic.eaglepack" : "cosmic_dataset_bundle.zip");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error("Export failed", error);
        alert("Export failed. Check console for details.");
    } finally {
        setIsProcessing(false);
        setExportProgress('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 p-8 overflow-y-auto text-slate-200">
       <h2 className="text-2xl font-bold text-slate-100 mb-2">Dataset Tools</h2>
       <p className="text-slate-400 mb-8">Utilities for dataset maintenance, quality control, and export.</p>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         
         {/* Database Federation Card */}
         <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 col-span-1 md:col-span-2 lg:col-span-3 bg-gradient-to-br from-slate-900 to-indigo-950/20">
             <div className="flex items-center mb-4">
                 <Database className="w-5 h-5 text-indigo-400 mr-2" />
                 <h3 className="font-semibold text-lg text-white">Database Federation (Eagle.cool)</h3>
             </div>
             <p className="text-sm text-slate-400 mb-6">
                 Connect directly to your local Eagle library. 
                 Cosmic will scan `metadata.json` and `tags.json` from the specified path.
             </p>
             
             <div className="flex flex-col gap-4">
                 <div className="flex gap-2">
                     <div className="relative flex-1">
                         <HardDrive className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                         <input 
                            type="text" 
                            value={eaglePath} 
                            onChange={(e) => setEaglePath(e.target.value)}
                            placeholder="C:\path\to\Your.library"
                            className="w-full bg-slate-950 border border-slate-800 rounded pl-10 pr-4 py-2 text-sm text-slate-300 font-mono focus:border-indigo-500 outline-none"
                         />
                     </div>
                     <Button variant="secondary" onClick={handleSelectEagleFolder}>Browse...</Button>
                 </div>
                 
                 <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <Link className="w-3 h-3" />
                    <span>Target: \images, \metadata.json, \tags.json</span>
                 </div>

                 {importStats && (
                     <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded flex items-center text-sm text-emerald-400 animate-in slide-in-from-top-2">
                         <CheckCircle className="w-4 h-4 mr-2" />
                         <span>Federation Active: Found {importStats.found} items, synced {importStats.imported} new items to Cosmic.</span>
                     </div>
                 )}

                 <Button 
                    variant="cosmic" 
                    onClick={handleScanEagle} 
                    disabled={!eaglePath || isProcessing}
                    className="w-full"
                 >
                     {isProcessing ? (
                         <>
                             <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                             Reading Library Structure...
                         </>
                     ) : (
                         <>
                             <Import className="w-4 h-4 mr-2" />
                             Sync External Database
                         </>
                     )}
                 </Button>
             </div>
         </div>

         {/* Duplicate Detection Card */}
         <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
               <Layers className="w-5 h-5 text-blue-500 mr-2" />
               <h3 className="font-semibold text-lg">Duplicate Detector</h3>
            </div>
            <p className="text-sm text-slate-400 mb-6 min-h-[40px]">
              Identify duplicate assets using filename/url matching.
            </p>
            
            {duplicateResult === null ? (
               <Button onClick={runDuplicateFinder} disabled={isProcessing} className="w-full">
                 {isProcessing ? 'Scanning...' : 'Scan for Duplicates'}
               </Button>
            ) : (
               <div className="bg-slate-950/50 p-4 rounded-md border border-slate-800 animate-in fade-in">
                 <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Found: {duplicateResult.length}</span>
                    <button onClick={() => setDuplicateResult(null)} className="text-xs text-slate-500 hover:text-white"><RefreshCcw className="w-3 h-3"/></button>
                 </div>
                 {duplicateResult.length > 0 ? (
                    <Button variant="danger" size="sm" onClick={deleteDuplicates} className="w-full">
                       <Trash2 className="w-4 h-4 mr-2" />
                       Remove Duplicates
                    </Button>
                 ) : (
                    <div className="flex items-center text-emerald-500 text-sm">
                       <CheckCircle className="w-4 h-4 mr-2" />
                       No duplicates found
                    </div>
                 )}
               </div>
            )}
         </div>

         {/* Quality Audit Card */}
         <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
               <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
               <h3 className="font-semibold text-lg">Quality Audit</h3>
            </div>
            <p className="text-sm text-slate-400 mb-6 min-h-[40px]">
              Flag images with low aesthetic scores or any asset with missing tags.
            </p>
            
            {qualityAuditResult === null ? (
               <Button onClick={runQualityAudit} disabled={isProcessing} variant="secondary" className="w-full">
                 {isProcessing ? 'Auditing...' : 'Run Audit'}
               </Button>
            ) : (
               <div className="bg-slate-950/50 p-4 rounded-md border border-slate-800 animate-in fade-in">
                 <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Flagged: {qualityAuditResult.length}</span>
                    <button onClick={() => setQualityAuditResult(null)} className="text-xs text-slate-500 hover:text-white"><RefreshCcw className="w-3 h-3"/></button>
                 </div>
                 {qualityAuditResult.length > 0 ? (
                    <p className="text-xs text-slate-400">
                      Items have been marked with the 'Flagged' status in your library.
                    </p>
                 ) : (
                    <div className="flex items-center text-emerald-500 text-sm">
                       <CheckCircle className="w-4 h-4 mr-2" />
                       All checks passed
                    </div>
                 )}
               </div>
            )}
         </div>

         {/* Export Card */}
         <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
               <Archive className="w-5 h-5 text-emerald-500 mr-2" />
               <h3 className="font-semibold text-lg">Export Dataset</h3>
            </div>
            <p className="text-sm text-slate-400 mb-6 min-h-[40px]">
               Generate portable dataset bundles.
            </p>
            
            {isProcessing && exportProgress ? (
                <div className="w-full bg-slate-950 rounded p-4 border border-emerald-900/30 flex flex-col items-center justify-center gap-3">
                    <RefreshCcw className="w-6 h-6 text-emerald-400 animate-spin" />
                    <span className="text-xs text-emerald-400 animate-pulse">{exportProgress}</span>
                </div>
            ) : (
                <div className="space-y-4">
                     {/* Eaglepack Option */}
                     <div className="p-3 bg-slate-950 rounded border border-slate-800 hover:border-blue-500/50 transition-colors group cursor-pointer" onClick={() => handleExport('eagle')}>
                        <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center">
                                 <Package className="w-5 h-5 text-blue-500 mr-2" />
                                 <span className="text-sm font-semibold text-slate-200">Eaglepack Bundle</span>
                             </div>
                             <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">Recommended</span>
                        </div>
                        <p className="text-xs text-slate-500 group-hover:text-slate-400">
                            Full archive compatible with Eagle.cool. Includes smart tags, folders, and metadata.
                        </p>
                     </div>

                     {/* Standard ZIP Option */}
                     <div className="p-3 bg-slate-950 rounded border border-slate-800 hover:border-emerald-500/50 transition-colors group cursor-pointer" onClick={() => handleExport('json')}>
                        <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center">
                                 <FileJson className="w-5 h-5 text-emerald-500 mr-2" />
                                 <span className="text-sm font-semibold text-slate-200">Universal ZIP</span>
                             </div>
                        </div>
                        <p className="text-xs text-slate-500 group-hover:text-slate-400">
                            Standard .zip archive containing raw assets and a strict `metadata.json` manifest.
                        </p>
                     </div>
                     
                     {/* CSV Option */}
                     <div className="p-3 bg-slate-950 rounded border border-slate-800 hover:border-slate-600 transition-colors group cursor-pointer" onClick={() => handleExport('csv')}>
                        <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center">
                                 <FileSpreadsheet className="w-5 h-5 text-slate-400 mr-2" />
                                 <span className="text-sm font-semibold text-slate-200">CSV Dataset</span>
                             </div>
                        </div>
                        <p className="text-xs text-slate-500 group-hover:text-slate-400">
                            Assets bundled with a flat `dataset.csv` for ML training pipelines.
                        </p>
                     </div>
                </div>
            )}
         </div>

       </div>
    </div>
  );
};
