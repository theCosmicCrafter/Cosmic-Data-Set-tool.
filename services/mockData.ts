import { Asset, TagSource } from "../types";

export const MOCK_ASSETS: Asset[] = [
  {
    id: '1',
    type: 'image',
    url: 'https://picsum.photos/800/600?random=1',
    thumbnailUrl: 'https://picsum.photos/300/300?random=1',
    name: 'landscape_mountain_001.jpg',
    metadata: {
      resolution: '800x600',
      fileSize: '1.2MB',
      dateTaken: '2023-10-15',
      cameraModel: 'Sony A7III',
      iso: '100',
      exposure: '1/200s'
    },
    tags: [
      { id: 't1', name: 'mountain', source: TagSource.MANUAL, confidence: 1 },
      { id: 't2', name: 'nature', source: TagSource.AI_COMFY, confidence: 0.85 },
      { id: 't3', name: 'sky', source: TagSource.AI_COMFY, confidence: 0.92 },
    ],
    rating: 4,
    flagged: false,
    processed: true,
    caption: 'A serene mountain landscape with clear blue skies.',
    aesthetic: {
      score: 8.5,
      colorPalette: ['#4a90e2', '#50e3c2', '#f5a623', '#ffffff', '#2c3e50'],
      isGalleryStandard: true,
      critique: "Excellent composition and dynamic range, though the foreground could be sharper."
    }
  },
  {
    id: '2',
    type: 'image',
    url: 'https://picsum.photos/800/1200?random=2',
    thumbnailUrl: 'https://picsum.photos/300/450?random=2',
    name: 'portrait_urban_042.jpg',
    metadata: {
      resolution: '800x1200',
      fileSize: '2.4MB',
      dateTaken: '2023-11-02',
      cameraModel: 'Canon R5',
      iso: '400',
      exposure: '1/60s'
    },
    tags: [
      { id: 't4', name: 'portrait', source: TagSource.MANUAL, confidence: 1 },
      { id: 't5', name: 'urban', source: TagSource.AI_GEMINI, confidence: 0.88 },
    ],
    rating: 0,
    flagged: false,
    processed: false,
  },
  {
    id: '3',
    type: 'image',
    url: 'https://picsum.photos/1200/800?random=3',
    thumbnailUrl: 'https://picsum.photos/450/300?random=3',
    name: 'abstract_texture_09.png',
    metadata: {
      resolution: '1200x800',
      fileSize: '3.1MB',
      dateTaken: '2024-01-10',
      cameraModel: 'Blender 4.0',
    },
    tags: [],
    rating: 2,
    flagged: true,
    processed: false,
  },
  {
    id: '4', // DUPLICATE OF 1
    type: 'image',
    url: 'https://picsum.photos/800/600?random=1',
    thumbnailUrl: 'https://picsum.photos/300/300?random=1',
    name: 'landscape_mountain_001_copy.jpg',
    metadata: {
      resolution: '800x600',
      fileSize: '1.2MB',
      dateTaken: '2023-10-15',
    },
    tags: [],
    rating: 0,
    flagged: false,
    processed: false,
  },
  {
    id: '5',
    type: 'audio',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Valid Audio Sample
    thumbnailUrl: '', // No image thumbnail
    name: 'ambient_synth_loop_04.mp3',
    metadata: {
      duration: '0:45',
      fileSize: '8.4MB',
      bpm: 120,
      key: 'Cm',
      sampleRate: '44.1kHz'
    },
    tags: [
      { id: 'a1', name: 'ambient', source: TagSource.MANUAL, confidence: 1 },
      { id: 'a2', name: 'synth', source: TagSource.AI_GEMINI, confidence: 0.9 }
    ],
    rating: 3,
    flagged: false,
    processed: true,
    caption: 'A moody, atmospheric synth texture with a slow attack and long release.'
  },
  {
    id: '6',
    type: 'audio',
    url: 'https://www2.cs.uic.edu/~i101/SoundFiles/StarWars3.wav',
    thumbnailUrl: '',
    name: 'drum_break_vintage.wav',
    metadata: {
      duration: '0:12',
      fileSize: '1.1MB',
      bpm: 96,
      key: 'N/A',
      bitrate: '320kbps'
    },
    tags: [],
    rating: 0,
    flagged: false,
    processed: false,
  },
  {
    id: '7',
    type: 'video',
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', // Valid Video Sample
    thumbnailUrl: '',
    name: 'cyberpunk_city_loop.mp4',
    metadata: {
      duration: '0:15',
      resolution: '1920x1080',
      fileSize: '24.5MB',
      fps: 60,
      codec: 'h264'
    },
    tags: [
      { id: 'v1', name: 'city', source: TagSource.MANUAL, confidence: 1 },
      { id: 'v2', name: 'neon', source: TagSource.AI_GEMINI, confidence: 0.8 }
    ],
    rating: 5,
    flagged: false,
    processed: true,
    caption: 'A high-speed drone shot flying through a neon-lit futuristic city.'
  }
];

export const generateId = () => Math.random().toString(36).substr(2, 9);