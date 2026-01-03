import React, { useRef, useEffect, useState } from 'react';
import { Asset, TagSource } from '../types';
import { Button } from '../components/Button';
import { 
    ArrowLeft, Save, RotateCcw, Sliders, 
    Sun, Contrast, Droplet, Layers, Monitor, 
    Grid3X3, Zap, Film, Camera, Play, Pause, FastForward, Rewind, Scissors, Download, Clock, AlertCircle
} from 'lucide-react';
import { generateId } from '../services/mockData';

interface EditorViewProps {
    asset: Asset;
    onBack: () => void;
    onSave: (id: string, newUrl: string) => void;
    onCreateAsset: (asset: Asset) => void;
}

interface FilterState {
    brightness: number; // 0 to 200 (100 is neutral)
    contrast: number;   // 0 to 200 (100 is neutral)
    saturation: number; // 0 to 200 (100 is neutral)
    blur: number;       // 0 to 20
    noise: number;      // 0 to 100
    pixelate: number;   // 0 to 50
    sepia: number;      // 0 to 100
}

const DEFAULT_FILTERS: FilterState = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    noise: 0,
    pixelate: 0,
    sepia: 0
};

export const EditorView: React.FC<EditorViewProps> = ({ asset, onBack, onSave, onCreateAsset }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
    const [activeTab, setActiveTab] = useState<'adjust' | 'effects'>('adjust');
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isRendering, setIsRendering] = useState(false);
    const [videoError, setVideoError] = useState<string | null>(null);
    
    // Trim State
    const [videoDuration, setVideoDuration] = useState(0);
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(10); // Default placeholder
    
    const originalImageRef = useRef<HTMLImageElement | null>(null);

    const isVideo = asset.type === 'video';

    // Load Image (if image)
    useEffect(() => {
        if (!isVideo) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = asset.url;
            img.onload = () => {
                originalImageRef.current = img;
                setImageLoaded(true);
                renderCanvas();
            };
            img.onerror = () => {
                alert("Failed to load image source.");
            }
        }
    }, [asset.url, isVideo]);

    // Update Video Playback Rate
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = playbackRate;
        }
    }, [playbackRate]);

    // Re-render when filters change (Image Only)
    useEffect(() => {
        if (imageLoaded && !isVideo) {
            renderCanvas();
        }
    }, [filters, imageLoaded, isVideo]);

    const handleVideoMetadata = () => {
        if(videoRef.current) {
            const dur = videoRef.current.duration;
            setVideoDuration(dur);
            setTrimEnd(dur);
            setVideoError(null);
        }
    };

    const handleVideoError = (e: any) => {
        console.error("Video Error:", e);
        setVideoError("The video could not be loaded. Supported formats: MP4, WebM.");
    };

    // IMAGE RENDERER
    const renderCanvas = () => {
        const canvas = canvasRef.current;
        const img = originalImageRef.current;
        if (!canvas || !img) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set dimensions (fit within container but maintain resolution)
        const maxWidth = 1920;
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        // 1. Draw Original with basic CSS filters
        ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) sepia(${filters.sepia}%) blur(${filters.blur}px)`;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.filter = 'none';

        // 2. Apply Custom Pixel Effects (Noise, Pixelate)
        if (filters.pixelate > 0 || filters.noise > 0) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            if (filters.pixelate > 0) {
                const size = Math.max(1, filters.pixelate / 100 * 50); 
                const w = canvas.width;
                const h = canvas.height;
                const tempCanvas = document.createElement('canvas');
                const tCtx = tempCanvas.getContext('2d')!;
                tempCanvas.width = Math.max(1, w / (size * 5)); 
                tempCanvas.height = Math.max(1, h / (size * 5));
                
                tCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
                
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(tempCanvas, 0, 0, w, h);
                ctx.imageSmoothingEnabled = true;
            }

            if (filters.noise > 0) {
                const noiseData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const nd = noiseData.data;
                const amount = filters.noise * 2.55; 
                
                for (let i = 0; i < nd.length; i += 4) {
                    const random = (0.5 - Math.random()) * amount;
                    nd[i] += random;     // R
                    nd[i+1] += random;   // G
                    nd[i+2] += random;   // B
                }
                ctx.putImageData(noiseData, 0, 0);
            }
        }
    };

    const handleSaveImage = () => {
        if (!canvasRef.current) return;
        const newUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
        onSave(asset.id, newUrl);
        onBack();
    };

    // VIDEO FUNCTIONS
    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const captureFrame = () => {
        if (!videoRef.current) return;
        
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Apply current filters to context before drawing
        ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) sepia(${filters.sepia}%) blur(${filters.blur}px)`;
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Add Noise/Pixelate manually here if needed (omitted for speed in video capture)
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        
        // Create new Asset
        const newAsset: Asset = {
            id: generateId(),
            type: 'image',
            url: dataUrl,
            thumbnailUrl: dataUrl,
            name: `${asset.name}_frame_${Math.floor(video.currentTime)}.jpg`,
            metadata: {
                resolution: `${canvas.width}x${canvas.height}`,
                fileSize: 'Unknown',
                dateTaken: new Date().toISOString()
            },
            tags: [...asset.tags], // Inherit tags!
            rating: 0,
            flagged: false,
            processed: false,
            caption: `Frame extracted from ${asset.name} at ${video.currentTime.toFixed(2)}s`
        };
        
        onCreateAsset(newAsset);
        alert("Frame captured and added to library!");
    };

    const handleRenderVideo = async () => {
        if (!videoRef.current || isRendering) return;
        
        setIsRendering(true);
        const video = videoRef.current;
        const originalTime = video.currentTime;
        const originalVolume = video.volume;
        const originalPlaybackRate = video.playbackRate;
        const originalMuted = video.muted;
        
        try {
            // 1. Setup Canvas for processing
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("No Canvas Context");

            // 2. Setup Audio (Get track from video)
            // @ts-ignore - captureStream is standard but typescript definitions vary
            const videoStream = video.captureStream ? video.captureStream() : (video as any).mozCaptureStream();
            const audioTrack = videoStream.getAudioTracks()[0];

            // 3. Setup Stream
            const canvasStream = canvas.captureStream(30); // 30 FPS target
            const tracks = [...canvasStream.getVideoTracks()];
            if (audioTrack) tracks.push(audioTrack);
            
            const combinedStream = new MediaStream(tracks);

            // 4. Setup Recorder
            const recorder = new MediaRecorder(combinedStream, {
                // Try to use a standard mime type
                mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm' 
            });
            
            const chunks: Blob[] = [];
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const newUrl = URL.createObjectURL(blob);
                
                const newAsset: Asset = {
                    id: generateId(),
                    type: 'video',
                    url: newUrl,
                    thumbnailUrl: '', 
                    name: `${asset.name.split('.')[0]}_edit.webm`,
                    metadata: {
                        resolution: `${canvas.width}x${canvas.height}`,
                        duration: 'Unknown',
                        fileSize: 'Unknown'
                    },
                    tags: [...asset.tags, {id: generateId(), name: 'edited', source: TagSource.MANUAL, confidence: 1}],
                    rating: 0,
                    flagged: false,
                    processed: false,
                    caption: `Edited version of ${asset.name}. Applied filters: Brightness ${filters.brightness}%, Contrast ${filters.contrast}%.`
                };
                
                onCreateAsset(newAsset);
                
                // Cleanup
                video.currentTime = originalTime;
                video.muted = originalMuted;
                video.volume = originalVolume;
                video.playbackRate = originalPlaybackRate;
                setIsRendering(false);
                alert("Video Render Complete! Saved to Library.");
            };

            // 5. Start Recording Process
            recorder.start();
            
            // Set Start Time
            video.currentTime = trimStart;
            
            video.playbackRate = 1; // Must record at normal speed
            // We need to keep audio enabled on the element so captureStream gets it, 
            // but we might hear it. That is acceptable for "Rendering" feedback.
            
            await video.play();

            // 6. Draw Loop
            const processFrame = () => {
                // STOP Condition (Trim End)
                if (video.currentTime >= trimEnd || video.paused || video.ended) {
                    if (recorder.state === 'recording') {
                        recorder.stop();
                        video.pause();
                    }
                    return;
                }

                // Draw with filters
                ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) sepia(${filters.sepia}%) blur(${filters.blur}px)`;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                ctx.filter = 'none'; // reset

                requestAnimationFrame(processFrame);
            };
            
            processFrame();

            // Safety: Stop when video ends naturally
            video.onended = () => {
                 if (recorder.state === 'recording') recorder.stop();
                 video.onended = null; // cleanup listener
            };

        } catch (e) {
            console.error(e);
            setIsRendering(false);
            alert("Rendering failed. Ensure you are using a compatible browser environment (Chrome/Edge/Electron).");
        }
    };

    const videoFilterStyle = {
        filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) sepia(${filters.sepia}%) blur(${filters.blur}px)`
    };

    return (
        <div className="flex h-full bg-slate-950 relative">
            
            {/* Rendering Overlay */}
            {isRendering && (
                <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center backdrop-blur-sm">
                    <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                    <h2 className="text-2xl font-bold text-white animate-pulse">Rendering Video...</h2>
                    <p className="text-sm text-slate-400 mt-2 max-w-md text-center px-4">
                        Please wait while we bake your effects. The video is playing back in real-time to capture the frames.
                    </p>
                </div>
            )}

            {/* Editor Sidebar */}
            <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col z-20 shadow-xl">
                <div className="p-4 border-b border-slate-800">
                    <h2 className="text-lg font-bold text-white flex items-center">
                        <Sliders className="w-5 h-5 mr-2" />
                        {isVideo ? 'Video Lab' : 'Image Editor'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">{asset.name}</p>
                </div>

                <div className="flex border-b border-slate-800">
                    <button 
                        onClick={() => setActiveTab('adjust')}
                        className={`flex-1 py-3 text-xs font-medium transition-colors ${activeTab === 'adjust' ? 'text-indigo-400 bg-slate-800 border-b-2 border-indigo-400' : 'text-slate-500 hover:text-white'}`}
                    >
                        Adjustments
                    </button>
                    <button 
                        onClick={() => setActiveTab('effects')}
                        className={`flex-1 py-3 text-xs font-medium transition-colors ${activeTab === 'effects' ? 'text-indigo-400 bg-slate-800 border-b-2 border-indigo-400' : 'text-slate-500 hover:text-white'}`}
                    >
                        Effects
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {activeTab === 'adjust' && (
                        <>
                            <div className="space-y-4">
                                <label className="flex justify-between text-xs font-medium text-slate-300">
                                    <span className="flex items-center"><Sun className="w-3 h-3 mr-2"/> Brightness</span>
                                    <span>{filters.brightness}%</span>
                                </label>
                                <input 
                                    type="range" min="0" max="200" value={filters.brightness} 
                                    onChange={(e) => setFilters({...filters, brightness: Number(e.target.value)})}
                                    className="w-full accent-indigo-500 h-1 bg-slate-700 rounded appearance-none"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="flex justify-between text-xs font-medium text-slate-300">
                                    <span className="flex items-center"><Contrast className="w-3 h-3 mr-2"/> Contrast</span>
                                    <span>{filters.contrast}%</span>
                                </label>
                                <input 
                                    type="range" min="0" max="200" value={filters.contrast} 
                                    onChange={(e) => setFilters({...filters, contrast: Number(e.target.value)})}
                                    className="w-full accent-indigo-500 h-1 bg-slate-700 rounded appearance-none"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="flex justify-between text-xs font-medium text-slate-300">
                                    <span className="flex items-center"><Droplet className="w-3 h-3 mr-2"/> Saturation</span>
                                    <span>{filters.saturation}%</span>
                                </label>
                                <input 
                                    type="range" min="0" max="200" value={filters.saturation} 
                                    onChange={(e) => setFilters({...filters, saturation: Number(e.target.value)})}
                                    className="w-full accent-indigo-500 h-1 bg-slate-700 rounded appearance-none"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="flex justify-between text-xs font-medium text-slate-300">
                                    <span className="flex items-center"><Layers className="w-3 h-3 mr-2"/> Sepia</span>
                                    <span>{filters.sepia}%</span>
                                </label>
                                <input 
                                    type="range" min="0" max="100" value={filters.sepia} 
                                    onChange={(e) => setFilters({...filters, sepia: Number(e.target.value)})}
                                    className="w-full accent-indigo-500 h-1 bg-slate-700 rounded appearance-none"
                                />
                            </div>
                        </>
                    )}

                    {activeTab === 'effects' && (
                        <>
                             <div className="space-y-4">
                                <label className="flex justify-between text-xs font-medium text-slate-300">
                                    <span className="flex items-center"><Monitor className="w-3 h-3 mr-2"/> Blur</span>
                                    <span>{filters.blur}px</span>
                                </label>
                                <input 
                                    type="range" min="0" max="20" step="0.5" value={filters.blur} 
                                    onChange={(e) => setFilters({...filters, blur: Number(e.target.value)})}
                                    className="w-full accent-indigo-500 h-1 bg-slate-700 rounded appearance-none"
                                />
                            </div>
                            {!isVideo && (
                                <>
                                    <div className="space-y-4">
                                        <label className="flex justify-between text-xs font-medium text-slate-300">
                                            <span className="flex items-center"><Zap className="w-3 h-3 mr-2"/> Film Grain</span>
                                            <span>{filters.noise}</span>
                                        </label>
                                        <input 
                                            type="range" min="0" max="100" value={filters.noise} 
                                            onChange={(e) => setFilters({...filters, noise: Number(e.target.value)})}
                                            className="w-full accent-indigo-500 h-1 bg-slate-700 rounded appearance-none"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="flex justify-between text-xs font-medium text-slate-300">
                                            <span className="flex items-center"><Grid3X3 className="w-3 h-3 mr-2"/> Pixelate</span>
                                            <span>{filters.pixelate}</span>
                                        </label>
                                        <input 
                                            type="range" min="0" max="100" value={filters.pixelate} 
                                            onChange={(e) => setFilters({...filters, pixelate: Number(e.target.value)})}
                                            className="w-full accent-indigo-500 h-1 bg-slate-700 rounded appearance-none"
                                        />
                                    </div>
                                </>
                            )}
                            {isVideo && (
                                <p className="text-xs text-slate-500 italic p-2 bg-slate-800/50 rounded">
                                    Grain/Pixelate only available for still image assets to preserve performance.
                                </p>
                            )}
                        </>
                    )}

                    {isVideo && (
                         <div className="mt-8 pt-8 border-t border-slate-800">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                                <Scissors className="w-3 h-3 mr-2" /> Trim Video
                            </h3>
                            
                            <div className="space-y-3 mb-6 bg-slate-950 p-3 rounded-lg border border-slate-800">
                                <div>
                                    <label className="text-[10px] text-slate-400 uppercase mb-1 block">Start (Seconds)</label>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3 h-3 text-slate-500" />
                                        <input 
                                            type="number" 
                                            step="0.1"
                                            min="0"
                                            max={trimEnd}
                                            value={trimStart}
                                            onChange={(e) => setTrimStart(Number(e.target.value))}
                                            className="w-full bg-slate-800 border-none rounded text-xs px-2 py-1 text-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 uppercase mb-1 block">End (Seconds)</label>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3 h-3 text-slate-500" />
                                        <input 
                                            type="number" 
                                            step="0.1"
                                            min={trimStart}
                                            max={videoDuration}
                                            value={trimEnd}
                                            onChange={(e) => setTrimEnd(Number(e.target.value))}
                                            className="w-full bg-slate-800 border-none rounded text-xs px-2 py-1 text-white"
                                        />
                                    </div>
                                </div>
                                <div className="text-[10px] text-indigo-400 text-center">
                                    New Duration: {(trimEnd - trimStart).toFixed(1)}s
                                </div>
                            </div>

                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Actions</h3>
                            <Button variant="cosmic" onClick={handleRenderVideo} className="w-full mb-3" disabled={isRendering || !!videoError} glow>
                                <Download className="w-4 h-4 mr-2" />
                                Render & Save Video
                            </Button>
                            <Button variant="secondary" onClick={captureFrame} className="w-full mb-2" disabled={isRendering || !!videoError}>
                                <Camera className="w-4 h-4 mr-2" />
                                Capture Frame
                            </Button>
                            <p className="text-[10px] text-slate-500 text-center mt-2">
                                Rendering plays the video in real-time to capture effects.
                            </p>
                         </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-800 flex gap-3">
                    <Button variant="secondary" onClick={() => setFilters(DEFAULT_FILTERS)} className="flex-1" disabled={isRendering}>
                        <RotateCcw className="w-4 h-4" />
                    </Button>
                    {!isVideo && (
                        <Button variant="primary" onClick={handleSaveImage} className="flex-[3]">
                            <Save className="w-4 h-4 mr-2" />
                            Apply & Save
                        </Button>
                    )}
                </div>
            </div>

            {/* Main Stage */}
            <div className="flex-1 bg-black/50 flex flex-col">
                <div className="h-14 border-b border-slate-800 flex items-center px-6 justify-between">
                    <Button variant="ghost" onClick={onBack} size="sm" disabled={isRendering}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    {isVideo && (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800">
                                {[0.25, 0.5, 1, 1.5, 2].map(speed => (
                                    <button 
                                        key={speed}
                                        onClick={() => setPlaybackRate(speed)}
                                        disabled={isRendering || !!videoError}
                                        className={`px-2 py-1 text-[10px] font-mono rounded ${playbackRate === speed ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white disabled:opacity-50'}`}
                                    >
                                        {speed}x
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="flex-1 p-8 flex items-center justify-center overflow-hidden relative">
                    <div className="relative shadow-2xl bg-[#111] checkerboard-bg">
                         {isVideo ? (
                             <div className="relative group">
                                {videoError ? (
                                    <div className="w-[600px] h-[400px] flex flex-col items-center justify-center bg-slate-900 border border-red-900/50 rounded text-red-400 p-6 text-center">
                                        <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
                                        <p className="font-semibold">{videoError}</p>
                                        <p className="text-xs text-slate-500 mt-2 break-all">{asset.url}</p>
                                    </div>
                                ) : (
                                    <>
                                        <video 
                                            ref={videoRef}
                                            src={asset.url}
                                            className="max-w-full max-h-[70vh]"
                                            style={videoFilterStyle}
                                            onPlay={() => setIsPlaying(true)}
                                            onPause={() => setIsPlaying(false)}
                                            loop={!isRendering}
                                            crossOrigin="anonymous"
                                            onLoadedMetadata={handleVideoMetadata}
                                            onError={handleVideoError}
                                        />
                                        {/* Custom Video Controls Overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            {!isPlaying && !isRendering && (
                                                <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10 pointer-events-auto cursor-pointer hover:scale-110 transition-transform" onClick={togglePlay}>
                                                    <Play className="w-10 h-10 text-white fill-current ml-1" />
                                                </div>
                                            )}
                                        </div>
                                        {!isRendering && (
                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-auto bg-black/60 px-6 py-2 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => {if(videoRef.current) videoRef.current.currentTime -= 5}} className="text-white hover:text-indigo-400"><Rewind className="w-5 h-5"/></button>
                                                <button onClick={togglePlay} className="text-white hover:text-indigo-400">
                                                    {isPlaying ? <Pause className="w-5 h-5 fill-current"/> : <Play className="w-5 h-5 fill-current"/>}
                                                </button>
                                                <button onClick={() => {if(videoRef.current) videoRef.current.currentTime += 5}} className="text-white hover:text-indigo-400"><FastForward className="w-5 h-5"/></button>
                                            </div>
                                        )}
                                    </>
                                )}
                             </div>
                         ) : (
                             <canvas ref={canvasRef} className="max-w-full max-h-[80vh] object-contain" />
                         )}
                    </div>
                </div>
            </div>
            
            <style>{`
                .checkerboard-bg {
                    background-image:
                        linear-gradient(45deg, #1e293b 25%, transparent 25%),
                        linear-gradient(-45deg, #1e293b 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #1e293b 75%),
                        linear-gradient(-45deg, transparent 75%, #1e293b 75%);
                    background-size: 20px 20px;
                    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
                }
            `}</style>
        </div>
    );
};