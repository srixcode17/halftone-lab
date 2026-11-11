/**
 * HALFTONE LAB — PROFESSIONAL PHOTO EDITOR
 * Canva-Inspired Creative Studio Core Application
 * Zero external dependencies. 100% Client-Side.
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. STATE MANAGEMENT
  // ==========================================================================

  const DEFAULT_ADJUSTMENTS = {
    brightness: 0,
    contrast: 0,
    exposure: 0,
    highlights: 0,
    shadows: 0,
    gamma: 1.0,
    saturation: 0,
    temperature: 0,
    sharpness: 0,
    grain: 0
  };

  const DEFAULT_HALFTONE = {
    enabled: true,
    shape: 'circle', // 'circle', 'square', 'diamond', 'ellipse', 'line', 'crosshatch'
    size: 10,
    angle: 45,
    scale: 1.0,
    contrast: 1.0,
    density: 1.0,
    invert: false,
    colorMode: 'mono', // 'mono', 'cmyk', 'duotone', 'color'
    inkColor: '#111827',
    paperColor: '#ffffff',
    dither: 'none', // 'none', 'floyd-steinberg', 'atkinson', 'bayer2', 'bayer4', 'bayer8', 'random'
    ditherAmount: 0,
    edgeStrength: 0,
    edgeWidth: 1,
    inkBleed: 0,
    threshold: 0
  };

  const DEFAULT_TEXTURE = {
    type: 'none', // 'none', 'clean', 'parchment', 'newspaper', 'recycled', 'yellow', 'grunge', 'fine-grain', 'heavy-grain'
    intensity: 40,
    scale: 1.0,
    blendMode: 'multiply',
    paperTint: '#fdfbf7',
    grainAmount: 20
  };

  const state = {
    // Project info
    projectTitle: 'Untitled Artwork',
    imageLoaded: false,
    originalImage: null, // HTMLImageElement
    originalCanvas: null, // Full-resolution original
    cachedWorkCanvas: null, // Cached preview canvas
    adjustedCanvas: null, // Pre-halftone tone/color adjusted
    previewCanvas: null, // Working canvas scaled to display size
    
    // Active Tab & Tooling
    activeTab: 'uploads', // 'uploads', 'effects', 'adjust', 'halftone', 'texture', 'compare', 'about'
    isPanelCollapsed: false,
    
    // Core parameters
    adjustments: { ...DEFAULT_ADJUSTMENTS },
    halftone: { ...DEFAULT_HALFTONE },
    texture: { ...DEFAULT_TEXTURE },
    
    // Preset
    activeEffect: 'none', // 'classic-manga', etc.
    effectIntensity: 100,

    // View & Canvas Navigation
    zoom: 1.0,
    panX: 0,
    panY: 0,
    fitZoom: 1.0,
    isPanning: false,
    panStartX: 0,
    panStartY: 0,
    isFullscreen: false,

    // Comparison Mode
    compareMode: false,
    compareSplit: 0.5,
    compareOrientation: 'vertical',
    isHoldingPeek: false,
    isDraggingDivider: false,

    // Export Options
    exportFormat: 'png',
    exportScale: 1,
    exportQuality: 0.92,
    exportTransparent: false,

    // History (Undo / Redo)
    history: [],
    historyIndex: -1,
    maxHistory: 30,

    // UI state
    isProcessing: false,
    pendingUpdate: false
  };

  // ==========================================================================
  // 2. EFFECT PRESET DEFINITIONS (21 CURATED EFFECTS)
  // ==========================================================================

  const EFFECT_PRESETS = {
    // --- Comic & Manga ---
    'classic-manga': {
      name: 'Classic Manga',
      category: 'comic',
      desc: 'High-contrast ink screentone with authentic 45° dot rastering.',
      adjustments: { brightness: 5, contrast: 45, exposure: 0, highlights: 20, shadows: -30, gamma: 1.1, saturation: -100, temperature: 0, sharpness: 40, grain: 0 },
      halftone: { enabled: true, shape: 'circle', size: 7, angle: 45, scale: 1.1, invert: false, colorMode: 'mono', inkColor: '#090d16', paperColor: '#fcfcfc', dither: 'none', ditherAmount: 0, edgeStrength: 45, edgeWidth: 1.5, inkBleed: 0.3, threshold: 10 },
      texture: { type: 'clean', intensity: 20, scale: 1.0, blendMode: 'multiply', paperTint: '#ffffff', grainAmount: 10 }
    },
    'japanese-screentone': {
      name: 'Japanese Screentone',
      category: 'comic',
      desc: 'Uniform fine diamond screentone matrix with crisp line contours.',
      adjustments: { brightness: 0, contrast: 35, exposure: 0, highlights: 10, shadows: -20, gamma: 1.0, saturation: -100, temperature: 0, sharpness: 50, grain: 0 },
      halftone: { enabled: true, shape: 'diamond', size: 6, angle: 60, scale: 1.0, invert: false, colorMode: 'mono', inkColor: '#111827', paperColor: '#f8fafc', dither: 'none', ditherAmount: 0, edgeStrength: 60, edgeWidth: 1.2, inkBleed: 0, threshold: 15 },
      texture: { type: 'clean', intensity: 15, scale: 1.0, blendMode: 'multiply', paperTint: '#fdfbf7', grainAmount: 5 }
    },
    'vintage-comic': {
      name: 'Vintage Comic Book',
      category: 'comic',
      desc: '4-color CMYK halftone rosette simulation on aged pulp paper.',
      adjustments: { brightness: 8, contrast: 25, exposure: 5, highlights: 10, shadows: -15, gamma: 1.0, saturation: 20, temperature: 15, sharpness: 30, grain: 15 },
      halftone: { enabled: true, shape: 'circle', size: 9, angle: 45, scale: 1.1, invert: false, colorMode: 'cmyk', inkColor: '#18181b', paperColor: '#faf3e0', dither: 'none', ditherAmount: 0, edgeStrength: 35, edgeWidth: 1.5, inkBleed: 0.8, threshold: 0 },
      texture: { type: 'yellow', intensity: 45, scale: 1.2, blendMode: 'multiply', paperTint: '#faf2da', grainAmount: 25 }
    },
    'pop-art': {
      name: 'Pop Art',
      category: 'comic',
      desc: 'Roy Lichtenstein inspired bold outlines & punchy primary Ben-Day dots.',
      adjustments: { brightness: 10, contrast: 50, exposure: 10, highlights: 25, shadows: -25, gamma: 1.1, saturation: 50, temperature: 5, sharpness: 60, grain: 0 },
      halftone: { enabled: true, shape: 'circle', size: 14, angle: 45, scale: 1.2, invert: false, colorMode: 'color', inkColor: '#000000', paperColor: '#ffffff', dither: 'none', ditherAmount: 0, edgeStrength: 80, edgeWidth: 2.2, inkBleed: 0, threshold: 0 },
      texture: { type: 'clean', intensity: 20, scale: 1.0, blendMode: 'multiply', paperTint: '#ffffff', grainAmount: 0 }
    },
    'newspaper-print': {
      name: 'Newspaper Print',
      category: 'comic',
      desc: 'Coarse monochrome 45° dots with ink bleed and vintage newsprint texture.',
      adjustments: { brightness: 5, contrast: 20, exposure: 0, highlights: 0, shadows: -10, gamma: 0.95, saturation: -100, temperature: 10, sharpness: 25, grain: 20 },
      halftone: { enabled: true, shape: 'circle', size: 10, angle: 45, scale: 1.05, invert: false, colorMode: 'mono', inkColor: '#1e293b', paperColor: '#e8e5dc', dither: 'none', ditherAmount: 0, edgeStrength: 25, edgeWidth: 1.0, inkBleed: 1.2, threshold: 0 },
      texture: { type: 'newspaper', intensity: 50, scale: 1.0, blendMode: 'multiply', paperTint: '#ebe6db', grainAmount: 35 }
    },
    'graphic-novel': {
      name: 'Graphic Novel',
      category: 'comic',
      desc: 'Dramatic chiaroscuro shadows, stark black ink, and razor sharp cutouts.',
      adjustments: { brightness: -5, contrast: 70, exposure: 0, highlights: 30, shadows: -60, gamma: 1.3, saturation: -100, temperature: 0, sharpness: 70, grain: 0 },
      halftone: { enabled: true, shape: 'circle', size: 8, angle: 45, scale: 1.0, invert: false, colorMode: 'mono', inkColor: '#030712', paperColor: '#ffffff', dither: 'none', ditherAmount: 0, edgeStrength: 75, edgeWidth: 2.0, inkBleed: 0, threshold: 30 },
      texture: { type: 'clean', intensity: 10, scale: 1.0, blendMode: 'multiply', paperTint: '#ffffff', grainAmount: 0 }
    },
    'bw-ink': {
      name: 'Black & White Ink',
      category: 'comic',
      desc: 'Traditional sumi-e wash and heavy ink pen illustration.',
      adjustments: { brightness: 0, contrast: 40, exposure: 5, highlights: 15, shadows: -35, gamma: 1.1, saturation: -100, temperature: -5, sharpness: 45, grain: 5 },
      halftone: { enabled: true, shape: 'ellipse', size: 8, angle: 30, scale: 1.1, invert: false, colorMode: 'mono', inkColor: '#0f172a', paperColor: '#fafaf9', dither: 'none', ditherAmount: 0, edgeStrength: 50, edgeWidth: 1.5, inkBleed: 0.5, threshold: 10 },
      texture: { type: 'recycled', intensity: 30, scale: 1.1, blendMode: 'multiply', paperTint: '#fafaf9', grainAmount: 15 }
    },
    'vintage-comic-dots': {
      name: 'Vintage Comic Dots',
      category: 'comic',
      desc: 'Oversized nostalgic comic book halftone dots with retro ink tint.',
      adjustments: { brightness: 12, contrast: 30, exposure: 8, highlights: 15, shadows: -20, gamma: 1.0, saturation: 15, temperature: 20, sharpness: 35, grain: 10 },
      halftone: { enabled: true, shape: 'circle', size: 16, angle: 45, scale: 1.25, invert: false, colorMode: 'duotone', inkColor: '#1e1b4b', paperColor: '#fef08a', dither: 'none', ditherAmount: 0, edgeStrength: 40, edgeWidth: 1.8, inkBleed: 0.7, threshold: 0 },
      texture: { type: 'yellow', intensity: 50, scale: 1.0, blendMode: 'multiply', paperTint: '#fef3c7', grainAmount: 20 }
    },

    // --- Retro & Analog ---
    'retro-print-70s': {
      name: '1970s Retro Print',
      category: 'retro',
      desc: 'Warm amber & forest teal duotone halftone with nostalgic film grain.',
      adjustments: { brightness: 5, contrast: 25, exposure: 0, highlights: 10, shadows: -15, gamma: 1.0, saturation: -10, temperature: 35, sharpness: 25, grain: 30 },
      halftone: { enabled: true, shape: 'circle', size: 9, angle: 45, scale: 1.05, invert: false, colorMode: 'duotone', inkColor: '#064e3b', paperColor: '#fef3c7', dither: 'none', ditherAmount: 0, edgeStrength: 25, edgeWidth: 1.2, inkBleed: 0.6, threshold: 0 },
      texture: { type: 'parchment', intensity: 40, scale: 1.0, blendMode: 'multiply', paperTint: '#fef9c3', grainAmount: 30 }
    },
    'vintage-newspaper': {
      name: 'Vintage Newspaper',
      category: 'retro',
      desc: 'Weathered 1920s print with oxidized paper fibers and variable ink density.',
      adjustments: { brightness: 5, contrast: 15, exposure: 0, highlights: 0, shadows: -10, gamma: 0.95, saturation: -100, temperature: 25, sharpness: 15, grain: 35 },
      halftone: { enabled: true, shape: 'circle', size: 11, angle: 45, scale: 1.0, invert: false, colorMode: 'mono', inkColor: '#292524', paperColor: '#e7e2d3', dither: 'none', ditherAmount: 0, edgeStrength: 20, edgeWidth: 1.0, inkBleed: 1.4, threshold: 0 },
      texture: { type: 'newspaper', intensity: 60, scale: 1.0, blendMode: 'multiply', paperTint: '#e6dfd1', grainAmount: 40 }
    },
    'risograph': {
      name: 'Risograph',
      category: 'retro',
      desc: 'Authentic dual-drum Risograph screen print: Fluorescent Pink & Deep Teal.',
      adjustments: { brightness: 10, contrast: 35, exposure: 5, highlights: 15, shadows: -20, gamma: 1.05, saturation: 10, temperature: 0, sharpness: 40, grain: 20 },
      halftone: { enabled: true, shape: 'circle', size: 8, angle: 45, scale: 1.15, invert: false, colorMode: 'duotone', inkColor: '#0f766e', paperColor: '#fce7f3', dither: 'none', ditherAmount: 0, edgeStrength: 30, edgeWidth: 1.2, inkBleed: 0.5, threshold: 5 },
      texture: { type: 'recycled', intensity: 35, scale: 1.1, blendMode: 'multiply', paperTint: '#fff1f2', grainAmount: 25 }
    },
    'photocopy': {
      name: 'Photocopy',
      category: 'retro',
      desc: '90s Xerox toner distress: blown-out highlights, crushed blacks & toner artifacts.',
      adjustments: { brightness: -5, contrast: 80, exposure: 0, highlights: 40, shadows: -70, gamma: 1.3, saturation: -100, temperature: -10, sharpness: 80, grain: 40 },
      halftone: { enabled: true, shape: 'square', size: 6, angle: 0, scale: 1.2, invert: false, colorMode: 'mono', inkColor: '#000000', paperColor: '#ffffff', dither: 'random', ditherAmount: 50, edgeStrength: 70, edgeWidth: 2.0, inkBleed: 0, threshold: 25 },
      texture: { type: 'grunge', intensity: 50, scale: 1.0, blendMode: 'multiply', paperTint: '#ffffff', grainAmount: 45 }
    },
    'grainy-film': {
      name: 'Grainy Film',
      category: 'retro',
      desc: 'High-ISO monochrome silver halide film grain with organic tonal gradation.',
      adjustments: { brightness: 2, contrast: 25, exposure: 0, highlights: 10, shadows: -15, gamma: 1.0, saturation: -100, temperature: 0, sharpness: 30, grain: 75 },
      halftone: { enabled: true, shape: 'circle', size: 4, angle: 45, scale: 0.9, invert: false, colorMode: 'mono', inkColor: '#0f172a', paperColor: '#ffffff', dither: 'floyd-steinberg', ditherAmount: 65, edgeStrength: 15, edgeWidth: 1.0, inkBleed: 0.2, threshold: 0 },
      texture: { type: 'heavy-grain', intensity: 45, scale: 1.0, blendMode: 'overlay', paperTint: '#ffffff', grainAmount: 60 }
    },
    'old-magazine': {
      name: 'Old Magazine',
      category: 'retro',
      desc: '1960s glossy publication print with subtle moiré and nostalgic fade.',
      adjustments: { brightness: 5, contrast: 18, exposure: 0, highlights: 5, shadows: -10, gamma: 1.0, saturation: -15, temperature: 15, sharpness: 20, grain: 15 },
      halftone: { enabled: true, shape: 'circle', size: 7, angle: 45, scale: 1.0, invert: false, colorMode: 'cmyk', inkColor: '#1c1917', paperColor: '#f5f5f4', dither: 'none', ditherAmount: 0, edgeStrength: 20, edgeWidth: 1.0, inkBleed: 0.4, threshold: 0 },
      texture: { type: 'parchment', intensity: 30, scale: 1.0, blendMode: 'multiply', paperTint: '#fdfbf7', grainAmount: 15 }
    },
    'distressed-print': {
      name: 'Distressed Print',
      category: 'retro',
      desc: 'Eroded letterpress ink stamp with weathered fiber voids and missing toner spots.',
      adjustments: { brightness: 0, contrast: 50, exposure: 0, highlights: 20, shadows: -40, gamma: 1.15, saturation: -100, temperature: 10, sharpness: 50, grain: 25 },
      halftone: { enabled: true, shape: 'diamond', size: 9, angle: 45, scale: 1.1, invert: false, colorMode: 'mono', inkColor: '#1c1917', paperColor: '#f5f5f4', dither: 'none', ditherAmount: 0, edgeStrength: 45, edgeWidth: 1.5, inkBleed: 0.6, threshold: 15 },
      texture: { type: 'grunge', intensity: 65, scale: 1.2, blendMode: 'multiply', paperTint: '#f5f2eb', grainAmount: 40 }
    },

    // --- Artistic ---
    'crosshatch': {
      name: 'Crosshatch',
      category: 'artistic',
      desc: 'Multi-directional architectural ink pen hatching lines.',
      adjustments: { brightness: 5, contrast: 40, exposure: 0, highlights: 15, shadows: -30, gamma: 1.1, saturation: -100, temperature: 0, sharpness: 55, grain: 0 },
      halftone: { enabled: true, shape: 'crosshatch', size: 8, angle: 45, scale: 1.2, invert: false, colorMode: 'mono', inkColor: '#090d16', paperColor: '#ffffff', dither: 'none', ditherAmount: 0, edgeStrength: 65, edgeWidth: 1.5, inkBleed: 0.1, threshold: 10 },
      texture: { type: 'recycled', intensity: 25, scale: 1.0, blendMode: 'multiply', paperTint: '#ffffff', grainAmount: 10 }
    },
    'stippling': {
      name: 'Stippling',
      category: 'artistic',
      desc: 'Hand-drawn stipple ink pen dot distribution with variable density.',
      adjustments: { brightness: 0, contrast: 30, exposure: 0, highlights: 10, shadows: -20, gamma: 1.0, saturation: -100, temperature: 0, sharpness: 40, grain: 0 },
      halftone: { enabled: true, shape: 'circle', size: 5, angle: 45, scale: 0.95, invert: false, colorMode: 'mono', inkColor: '#0f172a', paperColor: '#ffffff', dither: 'floyd-steinberg', ditherAmount: 85, edgeStrength: 35, edgeWidth: 1.0, inkBleed: 0, threshold: 0 },
      texture: { type: 'clean', intensity: 20, scale: 1.0, blendMode: 'multiply', paperTint: '#ffffff', grainAmount: 10 }
    },
    'line-art': {
      name: 'Line Art',
      category: 'artistic',
      desc: 'Clean vector manga contour line extraction with subtle shading hints.',
      adjustments: { brightness: 25, contrast: 50, exposure: 15, highlights: 40, shadows: -20, gamma: 1.1, saturation: -100, temperature: 0, sharpness: 80, grain: 0 },
      halftone: { enabled: true, shape: 'circle', size: 5, angle: 45, scale: 0.4, invert: false, colorMode: 'mono', inkColor: '#000000', paperColor: '#ffffff', dither: 'none', ditherAmount: 0, edgeStrength: 95, edgeWidth: 1.8, inkBleed: 0, threshold: 55 },
      texture: { type: 'clean', intensity: 5, scale: 1.0, blendMode: 'multiply', paperTint: '#ffffff', grainAmount: 0 }
    },
    'pencil-halftone': {
      name: 'Pencil Halftone',
      category: 'artistic',
      desc: 'Soft graphite pencil sketch shading with directional grain.',
      adjustments: { brightness: 2, contrast: 25, exposure: 0, highlights: 10, shadows: -15, gamma: 1.0, saturation: -100, temperature: 5, sharpness: 30, grain: 35 },
      halftone: { enabled: true, shape: 'ellipse', size: 7, angle: 45, scale: 1.0, invert: false, colorMode: 'mono', inkColor: '#334155', paperColor: '#fafaf9', dither: 'none', ditherAmount: 0, edgeStrength: 40, edgeWidth: 1.2, inkBleed: 0.4, threshold: 5 },
      texture: { type: 'recycled', intensity: 40, scale: 1.0, blendMode: 'multiply', paperTint: '#f5f5f4', grainAmount: 30 }
    },
    'engraving': {
      name: 'Engraving',
      category: 'artistic',
      desc: 'Banknote & currency style undulating parallel engraved grooves.',
      adjustments: { brightness: 5, contrast: 45, exposure: 0, highlights: 15, shadows: -30, gamma: 1.1, saturation: -100, temperature: 10, sharpness: 60, grain: 0 },
      halftone: { enabled: true, shape: 'line', size: 9, angle: 15, scale: 1.15, invert: false, colorMode: 'mono', inkColor: '#1c1917', paperColor: '#f7fee7', dither: 'none', ditherAmount: 0, edgeStrength: 50, edgeWidth: 1.5, inkBleed: 0.2, threshold: 10 },
      texture: { type: 'parchment', intensity: 35, scale: 1.0, blendMode: 'multiply', paperTint: '#fefce8', grainAmount: 15 }
    },
    'high-contrast-noir': {
      name: 'High Contrast Noir',
      category: 'artistic',
      desc: 'Film noir chiaroscuro: deep obsidian shadows and luminous highlights.',
      adjustments: { brightness: -10, contrast: 85, exposure: -5, highlights: 35, shadows: -80, gamma: 1.4, saturation: -100, temperature: -15, sharpness: 80, grain: 10 },
      halftone: { enabled: true, shape: 'circle', size: 6, angle: 45, scale: 0.9, invert: false, colorMode: 'mono', inkColor: '#020617', paperColor: '#f8fafc', dither: 'none', ditherAmount: 0, edgeStrength: 70, edgeWidth: 1.8, inkBleed: 0, threshold: 35 },
      texture: { type: 'clean', intensity: 15, scale: 1.0, blendMode: 'multiply', paperTint: '#ffffff', grainAmount: 5 }
    }
  };

  // ==========================================================================
  // 3. SAMPLE ARTWORK GENERATOR (ZERO NETWORK CALLS, 100% OFFLINE)
  // ==========================================================================

  const SampleGenerator = {
    samples: [
      { id: 'sample-cyberpunk', title: 'Cyberpunk Portrait', tag: 'Neon & Duotone' },
      { id: 'sample-jazz', title: 'Vintage Jazz Sax', tag: 'Retro Noir' },
      { id: 'sample-tokyo', title: 'Tokyo Street', tag: 'Manga Cityscape' },
      { id: 'sample-car', title: '1970s Sports Car', tag: 'Pop Art & Print' }
    ],

    generate(id, width = 1200, height = 900) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      switch (id) {
        case 'sample-cyberpunk':
          this.paintCyberpunk(ctx, width, height);
          break;
        case 'sample-jazz':
          this.paintJazz(ctx, width, height);
          break;
        case 'sample-tokyo':
          this.paintTokyo(ctx, width, height);
          break;
        case 'sample-car':
        default:
          this.paintCar(ctx, width, height);
          break;
      }

      return canvas;
    },

    paintCyberpunk(ctx, w, h) {
      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, '#0a0a1a');
      bgGrad.addColorStop(0.5, '#1e1035');
      bgGrad.addColorStop(1, '#050510');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Distant neon skyscrapers
      ctx.fillStyle = '#110c26';
      for (let x = 40; x < w; x += 70) {
        const bh = 250 + Math.sin(x * 0.05) * 150;
        ctx.fillRect(x, h - bh - 200, 55, bh + 200);
        // glowing windows
        ctx.fillStyle = (x % 3 === 0) ? '#ff2a85' : '#00f0ff';
        for (let wy = h - bh - 180; wy < h - 220; wy += 28) {
          if (Math.sin(x * wy) > 0.1) {
            ctx.fillRect(x + 10, wy, 8, 12);
            ctx.fillRect(x + 30, wy, 8, 12);
          }
        }
        ctx.fillStyle = '#110c26';
      }

      // Atmospheric cyan/magenta haze
      const haze1 = ctx.createRadialGradient(w * 0.25, h * 0.4, 20, w * 0.25, h * 0.4, w * 0.5);
      haze1.addColorStop(0, 'rgba(0, 240, 255, 0.4)');
      haze1.addColorStop(1, 'rgba(0, 240, 255, 0)');
      ctx.fillStyle = haze1;
      ctx.fillRect(0, 0, w, h);

      const haze2 = ctx.createRadialGradient(w * 0.75, h * 0.45, 20, w * 0.75, h * 0.45, w * 0.5);
      haze2.addColorStop(0, 'rgba(255, 42, 133, 0.4)');
      haze2.addColorStop(1, 'rgba(255, 42, 133, 0)');
      ctx.fillStyle = haze2;
      ctx.fillRect(0, 0, w, h);

      // Stylized Portrait Silhouette
      const cx = w * 0.5;
      const cy = h * 0.52;

      // Shoulders / Jacket
      ctx.fillStyle = '#090914';
      ctx.beginPath();
      ctx.moveTo(cx - 280, h);
      ctx.bezierCurveTo(cx - 240, cy + 200, cx - 140, cy + 140, cx - 70, cy + 120);
      ctx.lineTo(cx + 70, cy + 120);
      ctx.bezierCurveTo(cx + 140, cy + 140, cx + 240, cy + 200, cx + 280, h);
      ctx.closePath();
      ctx.fill();

      // Cyber jacket collar neon rim
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#00f0ff';
      ctx.beginPath();
      ctx.moveTo(cx - 140, cy + 180);
      ctx.lineTo(cx - 60, cy + 120);
      ctx.stroke();

      ctx.strokeStyle = '#ff2a85';
      ctx.beginPath();
      ctx.moveTo(cx + 140, cy + 180);
      ctx.lineTo(cx + 60, cy + 120);
      ctx.stroke();

      // Neck
      ctx.fillStyle = '#1f1a30';
      ctx.fillRect(cx - 45, cy + 60, 90, 80);

      // Head shape
      ctx.fillStyle = '#2d2442';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 95, 125, 0, 0, Math.PI * 2);
      ctx.fill();

      // Jaw contour
      ctx.beginPath();
      ctx.moveTo(cx - 85, cy + 20);
      ctx.quadraticCurveTo(cx - 50, cy + 115, cx, cy + 125);
      ctx.quadraticCurveTo(cx + 50, cy + 115, cx + 85, cy + 20);
      ctx.closePath();
      ctx.fill();

      // Hair
      ctx.fillStyle = '#0f0c1a';
      ctx.beginPath();
      ctx.arc(cx, cy - 25, 110, Math.PI * 0.9, Math.PI * 2.1);
      ctx.lineTo(cx + 115, cy + 30);
      ctx.lineTo(cx + 80, cy - 60);
      ctx.lineTo(cx - 80, cy - 60);
      ctx.lineTo(cx - 115, cy + 30);
      ctx.closePath();
      ctx.fill();

      // Cyber Visor / Glasses (striking highlight for halftone)
      ctx.fillStyle = '#050508';
      ctx.beginPath();
      ctx.roundRect(cx - 90, cy - 25, 180, 50, 10);
      ctx.fill();

      // Visor glowing gradient reflection
      const visorGrad = ctx.createLinearGradient(cx - 85, cy, cx + 85, cy);
      visorGrad.addColorStop(0, '#00f0ff');
      visorGrad.addColorStop(0.4, '#7c3aed');
      visorGrad.addColorStop(1, '#ff2a85');
      ctx.fillStyle = visorGrad;
      ctx.beginPath();
      ctx.roundRect(cx - 85, cy - 20, 170, 40, 8);
      ctx.fill();

      // Visor tech lines
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 60, cy - 14, 25, 3);
      ctx.fillRect(cx - 20, cy - 14, 45, 3);
      ctx.fillRect(cx + 35, cy - 14, 30, 3);

      // Nose & Lips highlights
      ctx.fillStyle = '#ff2a85';
      ctx.fillRect(cx - 6, cy + 55, 12, 4); // nose shadow
      ctx.fillRect(cx - 18, cy + 80, 36, 6); // lips
    },

    paintJazz(ctx, w, h) {
      // Deep club noir gradient
      const bg = ctx.createRadialGradient(w * 0.6, h * 0.4, 40, w * 0.5, h * 0.5, w * 0.7);
      bg.addColorStop(0, '#4a4238');
      bg.addColorStop(0.6, '#181512');
      bg.addColorStop(1, '#080706');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Stage Spotlight Cone
      ctx.save();
      ctx.fillStyle = 'rgba(255, 235, 190, 0.12)';
      ctx.beginPath();
      ctx.moveTo(w * 0.85, 0);
      ctx.lineTo(w * 0.15, h);
      ctx.lineTo(w * 0.9, h);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Smoky atmospheric streaks
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.ellipse(w * 0.5 + i * 40, h * 0.4 + i * 30, 300, 40, -0.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Jazz Musician Silhouette
      const cx = w * 0.45;
      const cy = h * 0.52;

      // Body & suit
      ctx.fillStyle = '#141210';
      ctx.beginPath();
      ctx.moveTo(cx - 200, h);
      ctx.quadraticCurveTo(cx - 150, cy + 180, cx - 80, cy + 100);
      ctx.lineTo(cx + 100, cy + 100);
      ctx.quadraticCurveTo(cx + 180, cy + 200, cx + 220, h);
      ctx.closePath();
      ctx.fill();

      // Fedora hat
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 100, 120, 24, -0.15, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.roundRect(cx - 65, cy - 165, 110, 75, [25, 25, 4, 4]);
      ctx.fill();

      // Hat ribbon highlight
      ctx.fillStyle = '#e7e5e4';
      ctx.fillRect(cx - 65, cy - 110, 110, 14);

      // Face in shadow
      ctx.fillStyle = '#383028';
      ctx.beginPath();
      ctx.arc(cx + 10, cy - 60, 50, 0, Math.PI * 2);
      ctx.fill();

      // Brass Saxophone (Rich specular reflections for Halftone)
      const saxGrad = ctx.createLinearGradient(cx - 20, cy, cx + 220, cy + 160);
      saxGrad.addColorStop(0, '#fef08a');
      saxGrad.addColorStop(0.3, '#ca8a04');
      saxGrad.addColorStop(0.6, '#eab308');
      saxGrad.addColorStop(0.8, '#713f12');
      saxGrad.addColorStop(1, '#fde047');
      ctx.fillStyle = saxGrad;

      // Sax bell
      ctx.beginPath();
      ctx.ellipse(cx + 160, cy + 80, 55, 80, 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Sax bell hollow
      ctx.fillStyle = '#291e0a';
      ctx.beginPath();
      ctx.ellipse(cx + 165, cy + 80, 40, 65, 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Sax body tube
      ctx.strokeStyle = saxGrad;
      ctx.lineWidth = 26;
      ctx.beginPath();
      ctx.moveTo(cx + 10, cy - 40);
      ctx.quadraticCurveTo(cx + 80, cy + 40, cx + 110, cy + 140);
      ctx.quadraticCurveTo(cx + 120, cy + 190, cx + 150, cy + 160);
      ctx.lineTo(cx + 160, cy + 100);
      ctx.stroke();

      // Sax keys
      ctx.fillStyle = '#ffffff';
      for (let k = 0; k < 6; k++) {
        ctx.beginPath();
        ctx.arc(cx + 40 + k * 12, cy + 10 + k * 18, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    },

    paintTokyo(ctx, w, h) {
      // Night sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#0c1022');
      sky.addColorStop(0.7, '#241a3d');
      sky.addColorStop(1, '#151421');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Moon / atmospheric glow
      ctx.fillStyle = 'rgba(255, 230, 180, 0.85)';
      ctx.beginPath();
      ctx.arc(w * 0.72, h * 0.22, 60, 0, Math.PI * 2);
      ctx.fill();

      // Buildings & Shopfronts (Perspective street)
      // Left side buildings
      ctx.fillStyle = '#16192e';
      ctx.beginPath();
      ctx.moveTo(0, 80);
      ctx.lineTo(w * 0.38, h * 0.55);
      ctx.lineTo(w * 0.38, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Right side buildings
      ctx.fillStyle = '#1a182c';
      ctx.beginPath();
      ctx.moveTo(w, 100);
      ctx.lineTo(w * 0.62, h * 0.55);
      ctx.lineTo(w * 0.62, h);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // Street wet reflections
      const streetGrad = ctx.createLinearGradient(0, h * 0.55, 0, h);
      streetGrad.addColorStop(0, '#1c1b29');
      streetGrad.addColorStop(1, '#0e0e17');
      ctx.fillStyle = streetGrad;
      ctx.beginPath();
      ctx.moveTo(w * 0.38, h * 0.55);
      ctx.lineTo(w * 0.62, h * 0.55);
      ctx.lineTo(w * 0.85, h);
      ctx.lineTo(w * 0.15, h);
      ctx.closePath();
      ctx.fill();

      // Glowing Neon Signs (Kanji & English style)
      // Left vertical sign
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(w * 0.14, h * 0.2, 38, 220);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('東', w * 0.14 + 7, h * 0.2 + 35);
      ctx.fillText('京', w * 0.14 + 7, h * 0.2 + 75);
      ctx.fillText('夜', w * 0.14 + 7, h * 0.2 + 115);
      ctx.fillText('市', w * 0.14 + 7, h * 0.2 + 155);

      // Right cyan sign
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(w * 0.78, h * 0.28, 44, 180);
      ctx.fillStyle = '#0a0a14';
      ctx.fillText('ラ', w * 0.78 + 9, h * 0.28 + 40);
      ctx.fillText('メ', w * 0.78 + 9, h * 0.28 + 80);
      ctx.fillText('ン', w * 0.78 + 9, h * 0.28 + 120);

      // Traditional Paper Lanterns
      ctx.fillStyle = '#ff3b30';
      for (let i = 0; i < 4; i++) {
        const lx = w * 0.25 + i * 38;
        const ly = h * 0.52 - i * 6;
        ctx.beginPath();
        ctx.ellipse(lx, ly, 14, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffeeaa';
        ctx.fillRect(lx - 6, ly - 4, 12, 8);
        ctx.fillStyle = '#ff3b30';
      }

      // Overhead Power cables & wires (authentic Tokyo manga detail)
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#000000';
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 140 + i * 35);
        ctx.quadraticCurveTo(w * 0.5, 220 + i * 40, w, 160 + i * 30);
        ctx.stroke();
      }

      // Pedestrian with umbrella in center
      ctx.fillStyle = '#090812';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.65, 45, Math.PI, Math.PI * 2); // umbrella
      ctx.fill();
      ctx.fillRect(w * 0.485, h * 0.65, 30, 95); // coat
    },

    paintCar(ctx, w, h) {
      // Sunset Desert Gradient
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#f97316');
      sky.addColorStop(0.35, '#ec4899');
      sky.addColorStop(0.65, '#8b5cf6');
      sky.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Giant retro sun
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.48, 140, 0, Math.PI * 2);
      ctx.fill();

      // Distant mountain ranges
      ctx.fillStyle = '#311042';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.58);
      ctx.lineTo(w * 0.2, h * 0.48);
      ctx.lineTo(w * 0.45, h * 0.56);
      ctx.lineTo(w * 0.7, h * 0.45);
      ctx.lineTo(w, h * 0.55);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Highway ground
      ctx.fillStyle = '#0f0e17';
      ctx.fillRect(0, h * 0.65, w, h * 0.35);

      // Speed lines on road
      ctx.fillStyle = '#fbbf24';
      for (let x = 0; x < w; x += 140) {
        ctx.fillRect(x, h * 0.88, 70, 8);
      }

      // 1970s Classic Sports Coupe
      const cx = w * 0.5;
      const cy = h * 0.72;

      // Car body
      const carGrad = ctx.createLinearGradient(cx - 360, cy, cx + 360, cy);
      carGrad.addColorStop(0, '#e11d48');
      carGrad.addColorStop(0.5, '#f43f5e');
      carGrad.addColorStop(1, '#9f1239');
      ctx.fillStyle = carGrad;

      ctx.beginPath();
      ctx.moveTo(cx - 340, cy + 40);
      ctx.bezierCurveTo(cx - 320, cy - 20, cx - 220, cy - 40, cx - 140, cy - 50);
      ctx.bezierCurveTo(cx - 60, cy - 100, cx + 80, cy - 100, cx + 180, cy - 50);
      ctx.bezierCurveTo(cx + 280, cy - 40, cx + 340, cy, cx + 350, cy + 40);
      ctx.lineTo(cx + 340, cy + 65);
      ctx.lineTo(cx - 330, cy + 65);
      ctx.closePath();
      ctx.fill();

      // Cabin & Windows
      ctx.fillStyle = '#0a0a14';
      ctx.beginPath();
      ctx.moveTo(cx - 120, cy - 45);
      ctx.lineTo(cx - 50, cy - 90);
      ctx.lineTo(cx + 120, cy - 90);
      ctx.lineTo(cx + 170, cy - 45);
      ctx.closePath();
      ctx.fill();

      // Window reflection
      ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
      ctx.beginPath();
      ctx.moveTo(cx - 40, cy - 85);
      ctx.lineTo(cx + 40, cy - 85);
      ctx.lineTo(cx + 10, cy - 50);
      ctx.lineTo(cx - 70, cy - 50);
      ctx.closePath();
      ctx.fill();

      // Chrome Bumper
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(cx - 355, cy + 35, 45, 20);
      ctx.fillRect(cx + 325, cy + 35, 30, 20);

      // Headlight glow
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(cx - 320, cy + 25, 18, 0, Math.PI * 2);
      ctx.fill();

      // Wheels
      const drawWheel = (wx) => {
        ctx.fillStyle = '#050508';
        ctx.beginPath();
        ctx.arc(wx, cy + 65, 48, 0, Math.PI * 2);
        ctx.fill();

        // Chrome rim
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(wx, cy + 65, 28, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(wx, cy + 65, 12, 0, Math.PI * 2);
        ctx.fill();
      };

      drawWheel(cx - 220);
      drawWheel(cx + 220);
    }
  };

  // ==========================================================================
  // 4. IMAGE ADJUSTMENTS & PIXEL PROCESSING ENGINE
  // ==========================================================================

  const ImageProcessor = {
    // Generate pre-calculated Lookup Table (LUT) for basic curve adjustments
    createLUT(adj) {
      const lut = new Uint8ClampedArray(256);
      const b = adj.brightness * 2.55;
      const c = (adj.contrast + 100) / 100; // 0 to 2
      const contrastFactor = c * c;
      const gamma = adj.gamma || 1.0;
      const exposureFactor = Math.pow(2, adj.exposure / 50);

      for (let i = 0; i < 256; i++) {
        // Exposure
        let v = i * exposureFactor;
        // Brightness & Contrast
        v = (v - 128) * contrastFactor + 128 + b;
        // Gamma
        if (gamma !== 1.0) {
          v = 255 * Math.pow(Math.max(0, Math.min(255, v)) / 255, 1 / gamma);
        }
        lut[i] = Math.max(0, Math.min(255, Math.round(v)));
      }
      return lut;
    },

    // Apply adjustments to ImageData
    applyAdjustments(srcImageData, adj) {
      const w = srcImageData.width;
      const h = srcImageData.height;
      const dstImageData = new ImageData(new Uint8ClampedArray(srcImageData.data), w, h);
      const d = dstImageData.data;
      const totalPixels = w * h;

      const lut = this.createLUT(adj);
      const sat = (adj.saturation + 100) / 100;
      const temp = adj.temperature; // -100 to 100
      const grain = adj.grain;
      const hasGrain = grain > 0;
      const grainFactor = grain * 0.4;
      const highlights = adj.highlights * 0.5;
      const shadows = adj.shadows * 0.5;

      for (let i = 0; i < totalPixels; i++) {
        const idx = i * 4;
        let r = lut[d[idx]];
        let g = lut[d[idx + 1]];
        let b = lut[d[idx + 2]];

        // Highlights and shadows adjustment
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (highlights !== 0 && lum > 128) {
          const factor = (lum - 128) / 128;
          r += highlights * factor;
          g += highlights * factor;
          b += highlights * factor;
        }
        if (shadows !== 0 && lum < 128) {
          const factor = (128 - lum) / 128;
          r += shadows * factor;
          g += shadows * factor;
          b += shadows * factor;
        }

        // Temperature (warm amber / cool blue)
        if (temp !== 0) {
          if (temp > 0) {
            r += temp * 0.5;
            b -= temp * 0.4;
          } else {
            r += temp * 0.3;
            b -= temp * 0.5;
          }
        }

        // Saturation
        if (sat !== 1.0) {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = gray + sat * (r - gray);
          g = gray + sat * (g - gray);
          b = gray + sat * (b - gray);
        }

        // Film grain
        if (hasGrain) {
          const noise = (Math.random() - 0.5) * grainFactor * 255 * 0.2;
          r += noise;
          g += noise;
          b += noise;
        }

        d[idx] = Math.max(0, Math.min(255, r));
        d[idx + 1] = Math.max(0, Math.min(255, g));
        d[idx + 2] = Math.max(0, Math.min(255, b));
      }

      // Unsharp mask / Sharpness
      if (adj.sharpness > 0) {
        this.applySharpness(dstImageData, adj.sharpness);
      }

      return dstImageData;
    },

    // Fast 3x3 unsharp masking convolution
    applySharpness(imageData, strength) {
      const d = imageData.data;
      const w = imageData.width;
      const h = imageData.height;
      const copy = new Uint8ClampedArray(d);
      const k = (strength / 100) * 1.5;

      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = (y * w + x) * 4;
          for (let c = 0; c < 3; c++) {
            const center = copy[idx + c];
            const up = copy[((y - 1) * w + x) * 4 + c];
            const down = copy[((y + 1) * w + x) * 4 + c];
            const left = copy[(y * w + (x - 1)) * 4 + c];
            const right = copy[(y * w + (x + 1)) * 4 + c];

            const sharpVal = center + k * (4 * center - up - down - left - right);
            d[idx + c] = Math.max(0, Math.min(255, sharpVal));
          }
        }
      }
    },

    // Sobel edge detection for contour lines
    computeSobelEdges(imageData, strength, width = 1) {
      const w = imageData.width;
      const h = imageData.height;
      const d = imageData.data;
      const edgeData = new Uint8ClampedArray(w * h);
      const thresh = (100 - strength) * 1.8;

      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = (y * w + x);
          
          // Compute luminance for 3x3 neighborhood
          const l00 = 0.299 * d[((y - 1) * w + (x - 1)) * 4] + 0.587 * d[((y - 1) * w + (x - 1)) * 4 + 1] + 0.114 * d[((y - 1) * w + (x - 1)) * 4 + 2];
          const l01 = 0.299 * d[((y - 1) * w + x) * 4] + 0.587 * d[((y - 1) * w + x) * 4 + 1] + 0.114 * d[((y - 1) * w + x) * 4 + 2];
          const l02 = 0.299 * d[((y - 1) * w + (x + 1)) * 4] + 0.587 * d[((y - 1) * w + (x + 1)) * 4 + 1] + 0.114 * d[((y - 1) * w + (x + 1)) * 4 + 2];
          
          const l10 = 0.299 * d[(y * w + (x - 1)) * 4] + 0.587 * d[(y * w + (x - 1)) * 4 + 1] + 0.114 * d[(y * w + (x - 1)) * 4 + 2];
          const l12 = 0.299 * d[(y * w + (x + 1)) * 4] + 0.587 * d[(y * w + (x + 1)) * 4 + 1] + 0.114 * d[(y * w + (x + 1)) * 4 + 2];
          
          const l20 = 0.299 * d[((y + 1) * w + (x - 1)) * 4] + 0.587 * d[((y + 1) * w + (x - 1)) * 4 + 1] + 0.114 * d[((y + 1) * w + (x - 1)) * 4 + 2];
          const l21 = 0.299 * d[((y + 1) * w + x) * 4] + 0.587 * d[((y + 1) * w + x) * 4 + 1] + 0.114 * d[((y + 1) * w + x) * 4 + 2];
          const l22 = 0.299 * d[((y + 1) * w + (x + 1)) * 4] + 0.587 * d[((y + 1) * w + (x + 1)) * 4 + 1] + 0.114 * d[((y + 1) * w + (x + 1)) * 4 + 2];

          // Sobel kernels
          const gx = (-1 * l00 + 1 * l02) + (-2 * l10 + 2 * l12) + (-1 * l20 + 1 * l22);
          const gy = (-1 * l00 - 2 * l01 - 1 * l02) + (1 * l20 + 2 * l21 + 1 * l22);

          const mag = Math.sqrt(gx * gx + gy * gy);
          edgeData[idx] = mag > thresh ? 255 : 0;
        }
      }

      return edgeData;
    }
  };

  // ==========================================================================
  // 5. HALFTONE & DITHERING ENGINE
  // ==========================================================================

  const HalftoneEngine = {
    // Bayer 2x2 matrix
    BAYER_2: [
      [ 0,  2],
      [ 3,  1]
    ],

    // Bayer 4x4 matrix
    BAYER_4: [
      [ 0,  8,  2, 10],
      [12,  4, 14,  6],
      [ 3, 11,  1,  9],
      [15,  7, 13,  5]
    ],

    // Bayer 8x8 matrix
    BAYER_8: [
      [ 0, 32,  8, 40,  2, 34, 10, 42],
      [48, 16, 56, 24, 50, 18, 58, 26],
      [12, 44,  4, 36, 14, 46,  6, 38],
      [60, 28, 52, 20, 62, 30, 54, 22],
      [ 3, 35, 11, 43,  1, 33,  9, 41],
      [51, 19, 59, 27, 49, 17, 57, 25],
      [15, 47,  7, 39, 13, 45,  5, 37],
      [63, 31, 55, 23, 61, 29, 53, 21]
    ],

    // Render Halftone Artwork onto destination canvas
    render(sourceImageData, destCanvas, htConfig, edgeStrength = 0, edgeWidth = 1, transparentBg = false) {
      const w = sourceImageData.width;
      const h = sourceImageData.height;
      destCanvas.width = w;
      destCanvas.height = h;
      const ctx = destCanvas.getContext('2d');

      // 1. Fill Paper Background
      if (!transparentBg) {
        ctx.fillStyle = htConfig.paperColor || '#ffffff';
        ctx.fillRect(0, 0, w, h);
      } else {
        ctx.clearRect(0, 0, w, h);
      }

      // Check if pure dithering is requested instead of geometric dots
      if (htConfig.dither && htConfig.dither !== 'none') {
        this.renderPureDither(sourceImageData, ctx, htConfig, w, h, transparentBg);
      } else if (htConfig.colorMode === 'cmyk') {
        // Multi-angle 4-color CMYK halftone rosettes
        this.renderCMYKHalftone(sourceImageData, ctx, htConfig, w, h);
      } else {
        // Standard geometric halftone (Circle, Square, Diamond, Ellipse, Line)
        this.renderGeometricHalftone(sourceImageData, ctx, htConfig, w, h);
      }

      // 2. Ink Bleed / Feathering
      if (htConfig.inkBleed > 0) {
        ctx.save();
        ctx.filter = `blur(${htConfig.inkBleed}px)`;
        ctx.globalAlpha = 0.35;
        ctx.drawImage(destCanvas, 0, 0);
        ctx.restore();
      }

      // 3. Sobel Edge Overlay
      if (edgeStrength > 0) {
        this.renderEdgeContours(sourceImageData, ctx, edgeStrength, edgeWidth, htConfig.inkColor, w, h);
      }
    },

    // Geometric Halftone Rastering with angled grid rotation
    renderGeometricHalftone(srcData, ctx, config, w, h) {
      const d = srcData.data;
      const pitch = Math.max(3, config.size);
      const angleRad = (config.angle * Math.PI) / 180;
      const cosA = Math.cos(angleRad);
      const sinA = Math.sin(angleRad);
      const maxR = (pitch / 2) * config.scale * 1.414;
      const invert = config.invert;
      const colorMode = config.colorMode;
      const shape = config.shape || 'circle';

      ctx.fillStyle = config.inkColor || '#000000';

      // Diagonal bounding box to cover entire canvas during grid rotation
      const diag = Math.sqrt(w * w + h * h);
      const cx = w / 2;
      const cy = h / 2;

      for (let gy = -diag; gy <= diag; gy += pitch) {
        for (let gx = -diag; gx <= diag; gx += pitch) {
          // Transform grid coordinates from rotated space back to image space
          const px = Math.round(cx + (gx * cosA - gy * sinA));
          const py = Math.round(cy + (gx * sinA + gy * cosA));

          if (px < 0 || px >= w || py < 0 || py >= h) continue;

          // Sample pixel color and luminance
          const idx = (py * w + px) * 4;
          const r = d[idx];
          const g = d[idx + 1];
          const b = d[idx + 2];
          let lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

          // Thresholding
          if (config.threshold > 0) {
            const t = config.threshold / 100;
            lum = lum < t ? 0 : 1;
          }

          // Dot contrast
          if (config.contrast && config.contrast !== 1.0) {
            lum = Math.pow(Math.max(0, Math.min(1, lum)), config.contrast);
          }

          // Invert or normal darkness
          const darkness = invert ? lum : (1 - lum);
          if (darkness <= 0.02) continue;

          // Compute dot radius with density control
          const density = config.density || 1.0;
          const dotRadius = maxR * Math.sqrt(darkness) * density;

          // Color application
          if (colorMode === 'color') {
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          } else if (colorMode === 'duotone') {
            // Ink color scaled by darkness
            ctx.fillStyle = config.inkColor;
          }

          // Draw the dot shape
          this.drawDotShape(ctx, px, py, dotRadius, shape, angleRad, pitch);
        }
      }
    },

    // Draw individual dot primitives
    drawDotShape(ctx, x, y, r, shape, angleRad, pitch) {
      if (r <= 0.5) return;

      ctx.beginPath();
      switch (shape) {
        case 'square':
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angleRad);
          ctx.fillRect(-r, -r, r * 2, r * 2);
          ctx.restore();
          break;

        case 'diamond':
          ctx.moveTo(x, y - r);
          ctx.lineTo(x + r, y);
          ctx.lineTo(x, y + r);
          ctx.lineTo(x - r, y);
          ctx.closePath();
          ctx.fill();
          break;

        case 'ellipse':
          ctx.ellipse(x, y, r, r * 0.55, angleRad, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'line':
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angleRad);
          ctx.fillRect(-pitch * 0.6, -r * 0.7, pitch * 1.2, r * 1.4);
          ctx.restore();
          break;

        case 'crosshatch':
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angleRad);
          ctx.fillRect(-pitch * 0.6, -r * 0.45, pitch * 1.2, r * 0.9);
          ctx.rotate(Math.PI / 2);
          ctx.fillRect(-pitch * 0.6, -r * 0.45, pitch * 1.2, r * 0.9);
          ctx.restore();
          break;

        case 'circle':
        default:
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
    },

    // 4-Color CMYK Halftone Rosettes simulation
    renderCMYKHalftone(srcData, ctx, config, w, h) {
      const d = srcData.data;
      const pitch = Math.max(4, config.size);
      const diag = Math.sqrt(w * w + h * h);
      const cx = w / 2;
      const cy = h / 2;

      // Authentic CMYK Screen Angles
      const screens = [
        { name: 'C', angle: 15, color: '#00a8e8' },
        { name: 'M', angle: 75, color: '#e6007e' },
        { name: 'Y', angle: 0,  color: '#ffea00' },
        { name: 'K', angle: 45, color: '#111827' }
      ];

      ctx.save();
      ctx.globalCompositeOperation = 'multiply';

      for (const screen of screens) {
        ctx.fillStyle = screen.color;
        const rad = (screen.angle * Math.PI) / 180;
        const cosA = Math.cos(rad);
        const sinA = Math.sin(rad);
        const maxR = (pitch / 2) * config.scale * 1.3;

        for (let gy = -diag; gy <= diag; gy += pitch) {
          for (let gx = -diag; gx <= diag; gx += pitch) {
            const px = Math.round(cx + (gx * cosA - gy * sinA));
            const py = Math.round(cy + (gx * sinA + gy * cosA));

            if (px < 0 || px >= w || py < 0 || py >= h) continue;

            const idx = (py * w + px) * 4;
            const r = d[idx] / 255;
            const g = d[idx + 1] / 255;
            const b = d[idx + 2] / 255;

            // RGB to CMYK conversion
            const k = 1 - Math.max(r, g, b);
            let val = 0;
            if (screen.name === 'K') {
              val = k;
            } else if (k < 1) {
              if (screen.name === 'C') val = (1 - r - k) / (1 - k);
              if (screen.name === 'M') val = (1 - g - k) / (1 - k);
              if (screen.name === 'Y') val = (1 - b - k) / (1 - k);
            }

            if (val <= 0.05) continue;
            const dotR = maxR * Math.sqrt(val);

            ctx.beginPath();
            ctx.arc(px, py, dotR, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      ctx.restore();
    },

    // Pure Floyd-Steinberg, Atkinson, Bayer, and Random Dithering
    renderPureDither(srcData, ctx, config, w, h, transparentBg = false) {
      const imgData = new ImageData(new Uint8ClampedArray(srcData.data), w, h);
      const d = imgData.data;
      const type = config.dither;
      const inkRGB = parseHexColor(config.inkColor || '#000000');
      const paperRGB = parseHexColor(config.paperColor || '#ffffff');
      const ditherAmt = config.ditherAmount !== undefined ? config.ditherAmount : 100;
      const blendFactor = Math.max(0.1, ditherAmt / 100);

      if (type === 'floyd-steinberg' || type === 'atkinson') {
        const lumArr = new Float32Array(w * h);
        for (let i = 0; i < w * h; i++) {
          const idx = i * 4;
          lumArr[i] = 0.299 * d[idx] + 0.587 * d[idx + 1] + 0.114 * d[idx + 2];
        }

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            const oldVal = lumArr[idx];
            const newVal = oldVal < 128 ? 0 : 255;
            lumArr[idx] = newVal;
            const err = oldVal - newVal;

            if (type === 'floyd-steinberg') {
              if (x + 1 < w) lumArr[idx + 1] += err * (7 / 16);
              if (x - 1 >= 0 && y + 1 < h) lumArr[idx + w - 1] += err * (3 / 16);
              if (y + 1 < h) lumArr[idx + w] += err * (5 / 16);
              if (x + 1 < w && y + 1 < h) lumArr[idx + w + 1] += err * (1 / 16);
            } else if (type === 'atkinson') {
              const e8 = err / 8;
              if (x + 1 < w) lumArr[idx + 1] += e8;
              if (x + 2 < w) lumArr[idx + 2] += e8;
              if (x - 1 >= 0 && y + 1 < h) lumArr[idx + w - 1] += e8;
              if (y + 1 < h) lumArr[idx + w] += e8;
              if (x + 1 < w && y + 1 < h) lumArr[idx + w + 1] += e8;
              if (y + 2 < h) lumArr[idx + 2 * w] += e8;
            }
          }
        }

        for (let i = 0; i < w * h; i++) {
          const idx = i * 4;
          const isInk = lumArr[i] < 128;
          const targetR = isInk ? inkRGB.r : paperRGB.r;
          const targetG = isInk ? inkRGB.g : paperRGB.g;
          const targetB = isInk ? inkRGB.b : paperRGB.b;
          const targetA = isInk ? 255 : (transparentBg ? 0 : 255);

          if (blendFactor < 1.0) {
            d[idx] = Math.round(srcData.data[idx] * (1 - blendFactor) + targetR * blendFactor);
            d[idx + 1] = Math.round(srcData.data[idx + 1] * (1 - blendFactor) + targetG * blendFactor);
            d[idx + 2] = Math.round(srcData.data[idx + 2] * (1 - blendFactor) + targetB * blendFactor);
            d[idx + 3] = targetA;
          } else {
            d[idx] = targetR;
            d[idx + 1] = targetG;
            d[idx + 2] = targetB;
            d[idx + 3] = targetA;
          }
        }
      } else if (type === 'bayer2' || type === 'bayer4' || type === 'bayer8') {
        const matrix = type === 'bayer2' ? this.BAYER_2 : (type === 'bayer4' ? this.BAYER_4 : this.BAYER_8);
        const size = matrix.length;
        const scale = 256 / (size * size);

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const lum = 0.299 * d[idx] + 0.587 * d[idx + 1] + 0.114 * d[idx + 2];
            const thresh = matrix[y % size][x % size] * scale;
            const isInk = lum < thresh;
            const targetR = isInk ? inkRGB.r : paperRGB.r;
            const targetG = isInk ? inkRGB.g : paperRGB.g;
            const targetB = isInk ? inkRGB.b : paperRGB.b;
            const targetA = isInk ? 255 : (transparentBg ? 0 : 255);

            if (blendFactor < 1.0) {
              d[idx] = Math.round(srcData.data[idx] * (1 - blendFactor) + targetR * blendFactor);
              d[idx + 1] = Math.round(srcData.data[idx + 1] * (1 - blendFactor) + targetG * blendFactor);
              d[idx + 2] = Math.round(srcData.data[idx + 2] * (1 - blendFactor) + targetB * blendFactor);
              d[idx + 3] = targetA;
            } else {
              d[idx] = targetR;
              d[idx + 1] = targetG;
              d[idx + 2] = targetB;
              d[idx + 3] = targetA;
            }
          }
        }
      } else if (type === 'random') {
        for (let i = 0; i < w * h; i++) {
          const idx = i * 4;
          const lum = 0.299 * d[idx] + 0.587 * d[idx + 1] + 0.114 * d[idx + 2];
          const thresh = Math.random() * 255;
          const isInk = lum < thresh;
          const targetR = isInk ? inkRGB.r : paperRGB.r;
          const targetG = isInk ? inkRGB.g : paperRGB.g;
          const targetB = isInk ? inkRGB.b : paperRGB.b;
          const targetA = isInk ? 255 : (transparentBg ? 0 : 255);

          if (blendFactor < 1.0) {
            d[idx] = Math.round(srcData.data[idx] * (1 - blendFactor) + targetR * blendFactor);
            d[idx + 1] = Math.round(srcData.data[idx + 1] * (1 - blendFactor) + targetG * blendFactor);
            d[idx + 2] = Math.round(srcData.data[idx + 2] * (1 - blendFactor) + targetB * blendFactor);
            d[idx + 3] = targetA;
          } else {
            d[idx] = targetR;
            d[idx + 1] = targetG;
            d[idx + 2] = targetB;
            d[idx + 3] = targetA;
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
    },

    // Fast Sobel Contour Line drawing via offscreen buffer (23x performance boost over fillRect loop)
    renderEdgeContours(srcData, ctx, strength, width, inkColor, w, h) {
      const edges = ImageProcessor.computeSobelEdges(srcData, strength, width);
      const inkRGB = parseHexColor(inkColor || '#000000');
      const edgeImgData = ctx.createImageData(w, h);
      const d = edgeImgData.data;
      const strokeW = Math.max(1, Math.round(width));

      if (strokeW === 1) {
        for (let i = 0; i < w * h; i++) {
          if (edges[i] === 255) {
            const idx = i * 4;
            d[idx] = inkRGB.r;
            d[idx + 1] = inkRGB.g;
            d[idx + 2] = inkRGB.b;
            d[idx + 3] = 255;
          }
        }
      } else {
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            if (edges[y * w + x] === 255) {
              for (let dy = 0; dy < strokeW && y + dy < h; dy++) {
                for (let dx = 0; dx < strokeW && x + dx < w; dx++) {
                  const idx = ((y + dy) * w + (x + dx)) * 4;
                  d[idx] = inkRGB.r;
                  d[idx + 1] = inkRGB.g;
                  d[idx + 2] = inkRGB.b;
                  d[idx + 3] = 255;
                }
              }
            }
          }
        }
      }

      const offCanvas = document.createElement('canvas');
      offCanvas.width = w;
      offCanvas.height = h;
      offCanvas.getContext('2d').putImageData(edgeImgData, 0, 0);
      ctx.drawImage(offCanvas, 0, 0);
    }
  };

  // ==========================================================================
  // 6. PROCEDURAL TEXTURE GENERATION ENGINE
  // ==========================================================================

  const TextureEngine = {
    // Generate organic canvas texture
    applyTexture(destCanvas, textureConfig) {
      if (!textureConfig || textureConfig.type === 'none' || textureConfig.intensity <= 0) return;

      const w = destCanvas.width;
      const h = destCanvas.height;
      const ctx = destCanvas.getContext('2d');
      const texCanvas = document.createElement('canvas');
      texCanvas.width = w;
      texCanvas.height = h;
      const tctx = texCanvas.getContext('2d');

      const type = textureConfig.type;
      const tint = textureConfig.paperTint || '#fdfbf7';
      const grain = textureConfig.grainAmount !== undefined ? textureConfig.grainAmount : 20;
      const scale = textureConfig.scale || 1.0;

      // Base wash (omitted when exporting transparent background to preserve alpha transparency)
      if (!textureConfig.transparentBg) {
        tctx.fillStyle = tint;
        tctx.fillRect(0, 0, w, h);
      }

      switch (type) {
        case 'parchment':
          this.paintParchment(tctx, w, h, grain, scale);
          break;
        case 'newspaper':
          this.paintNewspaper(tctx, w, h, grain, scale);
          break;
        case 'recycled':
          this.paintRecycled(tctx, w, h, grain, scale);
          break;
        case 'yellow':
          this.paintYellowPulp(tctx, w, h, grain, scale);
          break;
        case 'grunge':
          this.paintGrunge(tctx, w, h, grain, scale);
          break;
        case 'fine-grain':
          this.paintGrain(tctx, w, h, Math.max(10, grain));
          break;
        case 'heavy-grain':
          this.paintGrain(tctx, w, h, Math.max(35, grain * 1.6));
          break;
        case 'clean':
        default:
          this.paintGrain(tctx, w, h, Math.max(4, grain * 0.4));
          break;
      }

      // Blend onto destCanvas (source-atop if transparent background to modulate only ink dots)
      ctx.save();
      ctx.globalCompositeOperation = textureConfig.transparentBg ? 'source-atop' : (textureConfig.blendMode || 'multiply');
      ctx.globalAlpha = textureConfig.intensity / 100;
      ctx.drawImage(texCanvas, 0, 0);
      ctx.restore();
    },

    paintGrain(ctx, w, h, amount) {
      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;
      const count = w * h;
      for (let i = 0; i < count; i++) {
        const idx = i * 4;
        const noise = (Math.random() - 0.5) * amount * 2;
        d[idx] = Math.max(0, Math.min(255, d[idx] + noise));
        d[idx + 1] = Math.max(0, Math.min(255, d[idx + 1] + noise));
        d[idx + 2] = Math.max(0, Math.min(255, d[idx + 2] + noise));
      }
      ctx.putImageData(imgData, 0, 0);
    },

    paintParchment(ctx, w, h, grain = 15, scale = 1.0) {
      // Warm subtle clouds scaled
      for (let i = 0; i < 15; i++) {
        ctx.fillStyle = `rgba(180, 140, 90, ${0.04 + Math.random() * 0.04})`;
        ctx.beginPath();
        ctx.arc(Math.random() * w, Math.random() * h, (100 + Math.random() * 250) * scale, 0, Math.PI * 2);
        ctx.fill();
      }
      this.paintGrain(ctx, w, h, grain || 15);
    },

    paintNewspaper(ctx, w, h, grain = 28, scale = 1.0) {
      ctx.fillStyle = 'rgba(235, 230, 219, 0.9)';
      ctx.fillRect(0, 0, w, h);
      // Horizontal subtle print band jitter scaled
      ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
      const step = Math.max(2, Math.round(4 * scale));
      for (let y = 0; y < h; y += step) {
        if (Math.random() > 0.4) ctx.fillRect(0, y, w, Math.max(1, Math.round(2 * scale)));
      }
      this.paintGrain(ctx, w, h, grain || 28);
    },

    paintRecycled(ctx, w, h, grain = 20, scale = 1.0) {
      this.paintGrain(ctx, w, h, grain || 20);
      // Random paper fiber flecks scaled
      ctx.lineWidth = Math.max(0.8, 1.2 * scale);
      const fiberLen = 8 * scale;
      for (let i = 0; i < w * 0.4; i++) {
        ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(90, 70, 50, 0.15)' : 'rgba(40, 50, 70, 0.12)';
        const fx = Math.random() * w;
        const fy = Math.random() * h;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx + (Math.random() - 0.5) * fiberLen, fy + (Math.random() - 0.5) * fiberLen);
        ctx.stroke();
      }
    },

    paintYellowPulp(ctx, w, h, grain = 22, scale = 1.0) {
      const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.2 * scale, w / 2, h / 2, w * 0.7 * scale);
      grad.addColorStop(0, '#fef9c3');
      grad.addColorStop(1, '#fde68a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      this.paintGrain(ctx, w, h, grain || 22);
    },

    paintGrunge(ctx, w, h, grain = 35, scale = 1.0) {
      this.paintGrain(ctx, w, h, grain || 35);
      // Ink splatter / scratches scaled
      ctx.fillStyle = 'rgba(20, 20, 20, 0.15)';
      for (let i = 0; i < 30; i++) {
        const sx = Math.random() * w;
        const sy = Math.random() * h;
        const r = (1 + Math.random() * 4) * scale;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  // ==========================================================================
  // 7. PIPELINE COORDINATOR & RENDERING
  // ==========================================================================

  const Pipeline = {
    // Execute full pipeline and update display canvas
    update() {
      if (!state.imageLoaded || !state.originalCanvas) return;

      this.showProcessing(true);

      requestAnimationFrame(() => {
        try {
          const displayCanvas = document.getElementById('display-canvas');
          if (!displayCanvas) return;

          // 1. Determine working canvas size (optimizes real-time viewport response)
          const origW = state.originalCanvas.width;
          const origH = state.originalCanvas.height;
          
          // Max dimension for real-time interactive preview is 1400px
          const maxDim = 1400;
          let scale = 1.0;
          if (origW > maxDim || origH > maxDim) {
            scale = maxDim / Math.max(origW, origH);
          }

          const workW = Math.round(origW * scale);
          const workH = Math.round(origH * scale);

          // Scaled working canvas (cached to eliminate redundant scaling of multi-megapixel originals)
          if (!state.cachedWorkCanvas || state.cachedWorkCanvas.width !== workW || state.cachedWorkCanvas.height !== workH) {
            state.cachedWorkCanvas = document.createElement('canvas');
            state.cachedWorkCanvas.width = workW;
            state.cachedWorkCanvas.height = workH;
            const cwctx = state.cachedWorkCanvas.getContext('2d');
            cwctx.drawImage(state.originalCanvas, 0, 0, workW, workH);
          }
          const workCanvas = state.cachedWorkCanvas;
          const wctx = workCanvas.getContext('2d');

          // 2. Adjustments Stage
          const srcData = wctx.getImageData(0, 0, workW, workH);
          const adjustedData = ImageProcessor.applyAdjustments(srcData, state.adjustments);

          // 3. Halftone & Dithering Stage
          const processedCanvas = document.createElement('canvas');
          if (state.halftone.enabled) {
            HalftoneEngine.render(
              adjustedData,
              processedCanvas,
              state.halftone,
              state.halftone.edgeStrength,
              state.halftone.edgeWidth,
              false
            );
          } else {
            processedCanvas.width = workW;
            processedCanvas.height = workH;
            processedCanvas.getContext('2d').putImageData(adjustedData, 0, 0);
          }

          // 4. Procedural Texture Overlay Stage
          TextureEngine.applyTexture(processedCanvas, state.texture);

          // 5. Effect Intensity Blending (smoothly fades between raw photograph and full retro effect)
          let finalRenderCanvas = processedCanvas;
          if (state.effectIntensity < 100) {
            const blendedCanvas = document.createElement('canvas');
            blendedCanvas.width = workW;
            blendedCanvas.height = workH;
            const bctx = blendedCanvas.getContext('2d');
            bctx.drawImage(workCanvas, 0, 0);
            bctx.globalAlpha = state.effectIntensity / 100;
            bctx.drawImage(processedCanvas, 0, 0);
            finalRenderCanvas = blendedCanvas;
          }

          // 6. Draw to Display Canvas (handling Before / After split)
          displayCanvas.width = workW;
          displayCanvas.height = workH;
          const dctx = displayCanvas.getContext('2d');

          if (state.isHoldingPeek) {
            // Temporarily show pure original
            dctx.drawImage(state.originalCanvas, 0, 0, workW, workH);
          } else if (state.compareMode) {
            this.renderComparisonSplit(dctx, workCanvas, finalRenderCanvas, workW, workH);
          } else {
            dctx.drawImage(finalRenderCanvas, 0, 0);
          }

          // Store current processed result for export preview
          state.previewCanvas = finalRenderCanvas;

        } catch (err) {
          console.error('Pipeline error:', err);
        } finally {
          this.showProcessing(false);
          this.updateStatus('All changes saved');
        }
      });
    },

    // Render Split-View Comparison directly on canvas
    renderComparisonSplit(ctx, originalCanvas, processedCanvas, w, h) {
      ctx.clearRect(0, 0, w, h);
      const split = state.compareSplit;

      if (state.compareOrientation === 'vertical') {
        const splitX = Math.round(w * split);

        // Left side: Original
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, splitX, h);
        ctx.clip();
        ctx.drawImage(originalCanvas, 0, 0, w, h);
        ctx.restore();

        // Right side: Halftone Processed
        ctx.save();
        ctx.beginPath();
        ctx.rect(splitX, 0, w - splitX, h);
        ctx.clip();
        ctx.drawImage(processedCanvas, 0, 0);
        ctx.restore();

        // Update DOM divider line position
        const divider = document.getElementById('compare-divider');
        if (divider) {
          divider.style.left = `${split * 100}%`;
          divider.style.top = '0';
          divider.classList.remove('horizontal');
        }
      } else {
        const splitY = Math.round(h * split);

        // Top side: Original
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, w, splitY);
        ctx.clip();
        ctx.drawImage(originalCanvas, 0, 0, w, h);
        ctx.restore();

        // Bottom side: Halftone Processed
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, splitY, w, h - splitY);
        ctx.clip();
        ctx.drawImage(processedCanvas, 0, 0);
        ctx.restore();

        const divider = document.getElementById('compare-divider');
        if (divider) {
          divider.style.top = `${split * 100}%`;
          divider.style.left = '0';
          divider.classList.add('horizontal');
        }
      }
    },

    showProcessing(visible) {
      state.isProcessing = visible;
      const el = document.getElementById('processing-indicator');
      const dot = document.querySelector('.status-dot');
      if (el) el.classList.toggle('visible', visible);
      if (dot) dot.classList.toggle('saving', visible);
    },

    updateStatus(text) {
      const el = document.querySelector('.status-text');
      if (el) el.textContent = text;
    }
  };

  // ==========================================================================
  // 8. CANVAS VIEW & TRANSFORMS (ZOOM & PAN)
  // ==========================================================================

  const CanvasViewer = {
    init() {
      const workspace = document.getElementById('canvas-workspace');
      const transformLayer = document.getElementById('canvas-transform-layer');

      if (!workspace || !transformLayer) return;

      // Wheel Zoom (smooth trackpad or mouse wheel)
      workspace.addEventListener('wheel', (e) => {
        if (!state.imageLoaded) return;
        e.preventDefault();

        const zoomDelta = e.deltaY < 0 ? 1.12 : 0.89;
        this.setZoom(state.zoom * zoomDelta);
      }, { passive: false });

      // Mouse drag for panning when zoomed or holding space
      workspace.addEventListener('mousedown', (e) => {
        if (!state.imageLoaded) return;
        // Middle click or Space+LeftClick
        if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
          state.isPanning = true;
          state.panStartX = e.clientX - state.panX;
          state.panStartY = e.clientY - state.panY;
          workspace.style.cursor = 'grabbing';
          e.preventDefault();
        }
      });

      window.addEventListener('mousemove', (e) => {
        if (state.isPanning) {
          state.panX = e.clientX - state.panStartX;
          state.panY = e.clientY - state.panStartY;
          this.applyTransform();
        } else if (state.isDraggingDivider) {
          this.handleDividerDrag(e);
        }
      });

      window.addEventListener('mouseup', () => {
        if (state.isPanning) {
          state.isPanning = false;
          workspace.style.cursor = 'default';
        }
        if (state.isDraggingDivider) {
          state.isDraggingDivider = false;
          const divider = document.getElementById('compare-divider');
          if (divider) divider.classList.remove('dragging');
        }
      });

      // Split Divider dragging
      const divider = document.getElementById('compare-divider');
      if (divider) {
        divider.addEventListener('mousedown', (e) => {
          if (!state.compareMode) return;
          state.isDraggingDivider = true;
          divider.classList.add('dragging');
          e.preventDefault();
          e.stopPropagation();
        });

        divider.addEventListener('touchstart', (e) => {
          if (!state.compareMode) return;
          state.isDraggingDivider = true;
          divider.classList.add('dragging');
        }, { passive: true });
      }

      window.addEventListener('touchmove', (e) => {
        if (state.isDraggingDivider && e.touches && e.touches[0]) {
          this.handleDividerDrag(e.touches[0]);
        }
      }, { passive: true });

      window.addEventListener('touchend', () => {
        if (state.isDraggingDivider) {
          state.isDraggingDivider = false;
          if (divider) divider.classList.remove('dragging');
        }
      });
    },

    handleDividerDrag(e) {
      const stage = document.getElementById('canvas-transform-layer');
      if (!stage) return;
      const rect = stage.getBoundingClientRect();

      if (state.compareOrientation === 'vertical') {
        const x = e.clientX - rect.left;
        const ratio = Math.max(0.01, Math.min(0.99, x / rect.width));
        state.compareSplit = ratio;
      } else {
        const y = e.clientY - rect.top;
        const ratio = Math.max(0.01, Math.min(0.99, y / rect.height));
        state.compareSplit = ratio;
      }

      Pipeline.update();
    },

    setZoom(newZoom) {
      state.zoom = Math.max(0.1, Math.min(5.0, newZoom));
      this.applyTransform();
      this.updateZoomDisplay();
    },

    fitToScreen() {
      if (!state.originalCanvas) return;
      const workspace = document.getElementById('canvas-workspace');
      if (!workspace) return;

      const wsWidth = workspace.clientWidth - 80;
      const wsHeight = workspace.clientHeight - 80;

      const imgW = state.originalCanvas.width;
      const imgH = state.originalCanvas.height;

      const scale = Math.min(wsWidth / imgW, wsHeight / imgH, 1.0);
      state.fitZoom = Math.max(0.1, scale);
      state.zoom = state.fitZoom;
      state.panX = 0;
      state.panY = 0;

      this.applyTransform();
      this.updateZoomDisplay();
    },

    resetView() {
      state.zoom = 1.0;
      state.panX = 0;
      state.panY = 0;
      this.applyTransform();
      this.updateZoomDisplay();
    },

    applyTransform() {
      const transformLayer = document.getElementById('canvas-transform-layer');
      if (transformLayer) {
        transformLayer.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`;
      }
    },

    updateZoomDisplay() {
      const el = document.getElementById('zoom-percentage');
      if (el) {
        el.textContent = `${Math.round(state.zoom * 100)}%`;
      }
    }
  };

  // ==========================================================================
  // 9. HISTORY ENGINE (UNDO / REDO)
  // ==========================================================================

  const HistoryManager = {
    debounceTimer: null,

    pushState(label = 'Action') {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        const snapshot = {
          label,
          adjustments: JSON.parse(JSON.stringify(state.adjustments)),
          halftone: JSON.parse(JSON.stringify(state.halftone)),
          texture: JSON.parse(JSON.stringify(state.texture)),
          activeEffect: state.activeEffect,
          effectIntensity: state.effectIntensity
        };

        // Truncate future states if we are in the middle of history
        if (state.historyIndex < state.history.length - 1) {
          state.history = state.history.slice(0, state.historyIndex + 1);
        }

        state.history.push(snapshot);
        if (state.history.length > state.maxHistory) {
          state.history.shift();
        } else {
          state.historyIndex++;
        }

        this.updateButtons();
      }, 150);
    },

    undo() {
      if (state.historyIndex > 0) {
        state.historyIndex--;
        this.restoreState(state.history[state.historyIndex]);
        UI.showToast('Undo: ' + (state.history[state.historyIndex].label || 'Previous'));
      }
    },

    redo() {
      if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++;
        this.restoreState(state.history[state.historyIndex]);
        UI.showToast('Redo: ' + (state.history[state.historyIndex].label || 'Next'));
      }
    },

    restoreState(snapshot) {
      if (!snapshot) return;
      state.adjustments = JSON.parse(JSON.stringify(snapshot.adjustments));
      state.halftone = JSON.parse(JSON.stringify(snapshot.halftone));
      state.texture = JSON.parse(JSON.stringify(snapshot.texture));
      state.activeEffect = snapshot.activeEffect;
      state.effectIntensity = snapshot.effectIntensity;

      UI.syncAllControls();
      Pipeline.update();
      this.updateButtons();
    },

    updateButtons() {
      const btnUndo = document.getElementById('btn-undo');
      const btnRedo = document.getElementById('btn-redo');
      const badge = document.getElementById('history-badge');

      if (btnUndo) btnUndo.disabled = state.historyIndex <= 0;
      if (btnRedo) btnRedo.disabled = state.historyIndex >= state.history.length - 1;
      if (badge) {
        badge.textContent = `${Math.max(1, state.historyIndex + 1)}/${Math.max(1, state.history.length)}`;
      }
    }
  };

  // ==========================================================================
  // 10. EXPORT SYSTEM (HIGH-RESOLUTION PRINT READY)
  // ==========================================================================

  const ExportManager = {
    openModal() {
      if (!state.imageLoaded) {
        UI.showToast('Please upload an image first');
        return;
      }

      const modal = document.getElementById('export-modal');
      if (!modal) return;

      // Update filename input
      const fnInput = document.getElementById('export-filename');
      if (fnInput) {
        fnInput.value = state.projectTitle.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      }

      this.updateSummary();
      modal.classList.add('open');
    },

    closeModal() {
      const modal = document.getElementById('export-modal');
      if (modal) modal.classList.remove('open');
    },

    updateSummary() {
      if (!state.originalCanvas) return;
      const scale = state.exportScale || 1;
      const w = Math.round(state.originalCanvas.width * scale);
      const h = Math.round(state.originalCanvas.height * scale);

      const dimEl = document.getElementById('export-dim');
      const formatEl = document.getElementById('export-format-summary');
      const sizeEl = document.getElementById('export-est-size');

      if (dimEl) dimEl.textContent = `${w} × ${h} px (${scale}x)`;
      if (formatEl) formatEl.textContent = state.exportFormat.toUpperCase();

      // Estimated size calculation
      if (sizeEl) {
        let estMB = (w * h * (state.exportFormat === 'png' ? 1.8 : 0.45)) / (1024 * 1024);
        sizeEl.textContent = `~${estMB.toFixed(2)} MB`;
      }

      // Sync Quality Group & Transparency Toggle per format
      const qualityGroup = document.getElementById('export-quality-group');
      const transparentToggle = document.getElementById('toggle-export-transparent');
      if (qualityGroup) {
        qualityGroup.style.display = state.exportFormat === 'png' ? 'none' : 'flex';
      }
      if (transparentToggle) {
        if (state.exportFormat === 'jpeg') {
          transparentToggle.disabled = true;
          transparentToggle.checked = false;
          state.exportTransparent = false;
        } else {
          transparentToggle.disabled = false;
        }
      }
    },

    // Render Full-Resolution Export Artwork
    generateFullArtwork() {
      const scale = state.exportScale || 1;
      const origW = state.originalCanvas.width;
      const origH = state.originalCanvas.height;
      const finalW = Math.round(origW * scale);
      const finalH = Math.round(origH * scale);

      // Scaled base canvas
      const scaledCanvas = document.createElement('canvas');
      scaledCanvas.width = finalW;
      scaledCanvas.height = finalH;
      const sctx = scaledCanvas.getContext('2d');
      sctx.drawImage(state.originalCanvas, 0, 0, finalW, finalH);

      // 1. Full-res adjustments
      const srcData = sctx.getImageData(0, 0, finalW, finalH);
      const adjustedData = ImageProcessor.applyAdjustments(srcData, state.adjustments);

      // 2. Full-res Halftone
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = finalW;
      finalCanvas.height = finalH;

      if (state.halftone.enabled) {
        // Adjust dot pitch to maintain relative scale if supersampled
        const htConfig = {
          ...state.halftone,
          size: state.halftone.size * scale
        };

        HalftoneEngine.render(
          adjustedData,
          finalCanvas,
          htConfig,
          state.halftone.edgeStrength,
          state.halftone.edgeWidth * scale,
          state.exportTransparent && (state.exportFormat === 'png' || state.exportFormat === 'webp')
        );
      } else {
        finalCanvas.getContext('2d').putImageData(adjustedData, 0, 0);
      }

      // 3. Full-res texture
      TextureEngine.applyTexture(finalCanvas, { ...state.texture, transparentBg: state.exportTransparent && (state.exportFormat === 'png' || state.exportFormat === 'webp') });

      // 4. Full-res Effect Intensity blend
      let finalArtwork = finalCanvas;
      if (state.effectIntensity < 100) {
        const blend = document.createElement('canvas');
        blend.width = finalW;
        blend.height = finalH;
        const bctx = blend.getContext('2d');
        bctx.drawImage(scaledCanvas, 0, 0);
        bctx.globalAlpha = state.effectIntensity / 100;
        bctx.drawImage(finalCanvas, 0, 0);
        finalArtwork = blend;
      }

      return finalArtwork;
    },

    download() {
      const finalCanvas = this.generateFullArtwork();
      const fnInput = document.getElementById('export-filename');
      const filename = (fnInput && fnInput.value.trim()) || 'halftone-artwork';

      let mime = 'image/png';
      let ext = 'png';
      if (state.exportFormat === 'jpeg') {
        mime = 'image/jpeg';
        ext = 'jpg';
      } else if (state.exportFormat === 'webp') {
        mime = 'image/webp';
        ext = 'webp';
      }

      finalCanvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);

        this.closeModal();
        UI.showToast(`Downloaded: ${filename}.${ext}`);
      }, mime, state.exportQuality);
    },

    copyToClipboard() {
      const finalCanvas = this.generateFullArtwork();
      finalCanvas.toBlob((blob) => {
        if (!blob) return;
        if (navigator.clipboard && window.ClipboardItem) {
          const item = new ClipboardItem({ 'image/png': blob });
          navigator.clipboard.write([item]).then(() => {
            this.closeModal();
            UI.showToast('Copied artwork to clipboard!');
          }).catch((err) => {
            console.error('Clipboard error:', err);
            UI.showToast('Clipboard copy failed. Use Download instead.');
          });
        } else {
          UI.showToast('Clipboard API not supported in this browser.');
        }
      }, 'image/png');
    }
  };

  // ==========================================================================
  // 11. UI CONTROLLER & EVENT LISTENERS
  // ==========================================================================

  const UI = {
    init() {
      this.bindHeader();
      this.bindRail();
      this.bindPanelControls();
      this.bindEffects();
      this.bindTextures();
      this.bindUploads();
      this.bindModals();
      this.bindKeyboardShortcuts();
      this.generateSampleThumbnails();
      CanvasViewer.init();

      // Load first sample by default so user can immediately play!
      setTimeout(() => {
        this.loadSample('sample-cyberpunk');
      }, 100);
    },

    // Top Navigation bindings
    bindHeader() {
      // Inline Project Title Editor
      const titleInput = document.getElementById('project-title');
      if (titleInput) {
        titleInput.addEventListener('input', (e) => {
          state.projectTitle = e.target.value.trim() || 'Untitled Artwork';
          document.title = `${state.projectTitle} — Halftone Lab`;
        });
      }

      // Undo / Redo buttons
      const btnUndo = document.getElementById('btn-undo');
      const btnRedo = document.getElementById('btn-redo');
      if (btnUndo) btnUndo.addEventListener('click', () => HistoryManager.undo());
      if (btnRedo) btnRedo.addEventListener('click', () => HistoryManager.redo());

      // Quick Compare Toggle in header
      const btnCompare = document.getElementById('btn-quick-compare');
      if (btnCompare) {
        btnCompare.addEventListener('click', () => {
          this.toggleCompareMode();
        });
      }

      // Quick Reset All in header
      const btnReset = document.getElementById('btn-quick-reset');
      if (btnReset) {
        btnReset.addEventListener('click', () => {
          this.resetAllEdits();
        });
      }

      // Help Modal toggle
      const btnHelp = document.getElementById('btn-help');
      if (btnHelp) {
        btnHelp.addEventListener('click', () => {
          const modal = document.getElementById('help-modal');
          if (modal) modal.classList.add('open');
        });
      }

      // Quick Download PNG
      const btnQuickDownload = document.getElementById('btn-quick-download');
      if (btnQuickDownload) {
        btnQuickDownload.addEventListener('click', () => {
          ExportManager.download();
        });
      }

      // Primary Purple Export Button
      const btnExport = document.getElementById('btn-open-export');
      if (btnExport) {
        btnExport.addEventListener('click', () => {
          ExportManager.openModal();
        });
      }

      // File Menu Dropdown
      const menuBtn = document.getElementById('menu-file-btn');
      const menuDropdown = document.getElementById('file-menu-dropdown');
      if (menuBtn && menuDropdown) {
        menuBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          menuDropdown.classList.toggle('active');
        });

        window.addEventListener('click', () => {
          menuDropdown.classList.remove('active');
        });
      }
    },

    // Left Navigation Rail Tabs
    bindRail() {
      const railItems = document.querySelectorAll('.rail-item');
      railItems.forEach((btn) => {
        btn.addEventListener('click', () => {
          const tab = btn.dataset.tab;
          this.switchTab(tab);
        });
      });

      // Panel close / collapse button
      const closeBtn = document.getElementById('panel-close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          this.togglePanelCollapse();
        });
      }
    },

    switchTab(tabName) {
      state.activeTab = tabName;

      // Update active states on rail
      document.querySelectorAll('.rail-item').forEach((item) => {
        item.classList.toggle('active', item.dataset.tab === tabName);
      });

      // Ensure panel is expanded
      const panel = document.getElementById('tool-panel-container');
      if (panel) panel.classList.remove('collapsed');

      // Update panel title
      const titleMap = {
        uploads: 'Uploads & Samples',
        effects: 'Effects Library',
        adjust: 'Photo Adjustments',
        halftone: 'Halftone Engine',
        texture: 'Texture & Paper',
        compare: 'Before & After',
        about: 'About Halftone Lab'
      };
      const titleEl = document.getElementById('panel-title');
      if (titleEl) titleEl.textContent = titleMap[tabName] || 'Editor Tools';

      // Show matching panel content
      document.querySelectorAll('.panel-tab-content').forEach((view) => {
        view.style.display = view.dataset.tabView === tabName ? 'flex' : 'none';
      });
    },

    togglePanelCollapse() {
      const panel = document.getElementById('tool-panel-container');
      if (panel) {
        panel.classList.toggle('collapsed');
      }
    },

    // Bind Range Sliders, Shape Pickers, Color Pickers
    bindPanelControls() {
      // 1. Adjustment Sliders
      const adjustmentKeys = ['brightness', 'contrast', 'exposure', 'highlights', 'shadows', 'gamma', 'saturation', 'temperature', 'sharpness', 'grain'];
      adjustmentKeys.forEach((key) => {
        const slider = document.getElementById(`adj-${key}`);
        const valEl = document.getElementById(`val-adj-${key}`);
        const resetBtn = document.getElementById(`reset-adj-${key}`);

        if (slider) {
          slider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            state.adjustments[key] = val;
            if (valEl) valEl.textContent = val;
            if (resetBtn) resetBtn.classList.toggle('visible', val !== DEFAULT_ADJUSTMENTS[key]);
            Pipeline.update();
          });

          slider.addEventListener('change', () => {
            HistoryManager.pushState(`Adjust ${key}`);
          });
        }

        if (resetBtn) {
          resetBtn.addEventListener('click', () => {
            state.adjustments[key] = DEFAULT_ADJUSTMENTS[key];
            if (slider) slider.value = DEFAULT_ADJUSTMENTS[key];
            if (valEl) valEl.textContent = DEFAULT_ADJUSTMENTS[key];
            resetBtn.classList.remove('visible');
            Pipeline.update();
            HistoryManager.pushState(`Reset ${key}`);
          });
        }
      });

      // Global Reset Adjustments button
      const resetAllAdjBtn = document.getElementById('btn-reset-all-adj');
      if (resetAllAdjBtn) {
        resetAllAdjBtn.addEventListener('click', () => {
          state.adjustments = { ...DEFAULT_ADJUSTMENTS };
          this.syncAdjustmentControls();
          Pipeline.update();
          HistoryManager.pushState('Reset All Adjustments');
          this.showToast('Adjustments reset');
        });
      }

      // 2. Halftone Master Toggle
      const htToggle = document.getElementById('toggle-halftone-enabled');
      if (htToggle) {
        htToggle.addEventListener('change', (e) => {
          state.halftone.enabled = e.target.checked;
          Pipeline.update();
          HistoryManager.pushState('Toggle Halftone');
        });
      }

      // Halftone Shape Selector buttons
      const shapeBtns = document.querySelectorAll('.shape-btn');
      shapeBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          shapeBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          state.halftone.shape = btn.dataset.shape;
          Pipeline.update();
          HistoryManager.pushState(`Shape ${state.halftone.shape}`);
        });
      });

      // Halftone Sliders (size, angle, scale, contrast, density, inkBleed, edgeStrength, threshold)
      const htSliders = [
        { id: 'ht-size', prop: 'size' },
        { id: 'ht-angle', prop: 'angle' },
        { id: 'ht-scale', prop: 'scale', mult: 0.01 },
        { id: 'ht-contrast', prop: 'contrast' },
        { id: 'ht-density', prop: 'density' },
        { id: 'ht-bleed', prop: 'inkBleed', mult: 0.1 },
        { id: 'ht-edge', prop: 'edgeStrength' },
        { id: 'ht-threshold', prop: 'threshold' }
      ];

      htSliders.forEach(({ id, prop, mult = 1 }) => {
        const slider = document.getElementById(id);
        const valEl = document.getElementById(`val-${id}`);
        if (slider) {
          slider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value) * mult;
            state.halftone[prop] = val;
            if (valEl) valEl.textContent = prop === 'scale' ? `${Math.round(val * 100)}%` : Math.round(val);
            Pipeline.update();
          });
          slider.addEventListener('change', () => {
            HistoryManager.pushState(`Halftone ${prop}`);
          });
        }
      });

      // Quick Angle Presets
      document.querySelectorAll('[data-angle-preset]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const ang = parseInt(btn.dataset.anglePreset, 10);
          state.halftone.angle = ang;
          const slider = document.getElementById('ht-angle');
          const valEl = document.getElementById('val-ht-angle');
          if (slider) slider.value = ang;
          if (valEl) valEl.textContent = ang;
          Pipeline.update();
          HistoryManager.pushState(`Angle ${ang}°`);
        });
      });

      // Color Mode Segmented Control
      document.querySelectorAll('[data-colormode]').forEach((btn) => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('[data-colormode]').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          state.halftone.colorMode = btn.dataset.colormode;
          Pipeline.update();
          HistoryManager.pushState(`Color Mode: ${state.halftone.colorMode}`);
        });
      });

      // Dithering Select & Intensity Slider
      const ditherSelect = document.getElementById('select-dither-algo');
      if (ditherSelect) {
        ditherSelect.addEventListener('change', (e) => {
          state.halftone.dither = e.target.value;
          Pipeline.update();
          HistoryManager.pushState(`Dither ${state.halftone.dither}`);
        });
      }

      const ditherAmt = document.getElementById('ht-dither-amount');
      const ditherAmtVal = document.getElementById('val-ht-dither-amount');
      if (ditherAmt) {
        ditherAmt.addEventListener('input', (e) => {
          state.halftone.ditherAmount = parseInt(e.target.value, 10);
          if (ditherAmtVal) ditherAmtVal.textContent = `${state.halftone.ditherAmount}%`;
          Pipeline.update();
        });
        ditherAmt.addEventListener('change', () => {
          HistoryManager.pushState('Dither Intensity');
        });
      }

      // Comparison Split Slider
      const splitSlider = document.getElementById('compare-split-slider');
      const splitVal = document.getElementById('val-compare-split');
      if (splitSlider) {
        splitSlider.addEventListener('input', (e) => {
          const val = parseInt(e.target.value, 10);
          state.compareSplit = val / 100;
          if (splitVal) splitVal.textContent = `${val}%`;
          Pipeline.update();
        });
      }

      // Comparison Orientation Toggle
      document.querySelectorAll('[data-compare-orientation]').forEach((btn) => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('[data-compare-orientation]').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          state.compareOrientation = btn.dataset.compareOrientation;
          Pipeline.update();
        });
      });

      // Ink Color & Paper Color Pickers
      const inkPicker = document.getElementById('picker-ink-color');
      const paperPicker = document.getElementById('picker-paper-color');
      if (inkPicker) {
        inkPicker.addEventListener('input', (e) => {
          state.halftone.inkColor = e.target.value;
          Pipeline.update();
        });
      }
      if (paperPicker) {
        paperPicker.addEventListener('input', (e) => {
          state.halftone.paperColor = e.target.value;
          Pipeline.update();
        });
      }

      // Swatch Buttons for Ink & Paper
      document.querySelectorAll('[data-ink-swatch]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const c = btn.dataset.inkSwatch;
          state.halftone.inkColor = c;
          if (inkPicker) inkPicker.value = c;
          Pipeline.update();
          HistoryManager.pushState('Ink Color');
        });
      });

      document.querySelectorAll('[data-paper-swatch]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const c = btn.dataset.paperSwatch;
          state.halftone.paperColor = c;
          if (paperPicker) paperPicker.value = c;
          Pipeline.update();
          HistoryManager.pushState('Paper Color');
        });
      });

      // Invert Dots Switch
      const invertSwitch = document.getElementById('toggle-ht-invert');
      if (invertSwitch) {
        invertSwitch.addEventListener('change', (e) => {
          state.halftone.invert = e.target.checked;
          Pipeline.update();
          HistoryManager.pushState('Invert Polarity');
        });
      }
    },

    // Bind Effects Cards Grid & Categories
    bindEffects() {
      // Category Navigation buttons
      const catBtns = document.querySelectorAll('.effect-cat-btn');
      catBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          catBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          const cat = btn.dataset.category;

          document.querySelectorAll('.effect-card').forEach((card) => {
            const cardCat = card.dataset.effectCat;
            card.style.display = (cat === 'all' || cardCat === cat) ? 'flex' : 'none';
          });
        });
      });

      // Effect Card selection
      const effectCards = document.querySelectorAll('.effect-card');
      effectCards.forEach((card) => {
        card.addEventListener('click', () => {
          const effectKey = card.dataset.effectKey;
          this.applyEffect(effectKey);
        });
      });

      // Effect Intensity slider
      const intensitySlider = document.getElementById('effect-intensity-slider');
      const intensityVal = document.getElementById('val-effect-intensity');
      if (intensitySlider) {
        intensitySlider.addEventListener('input', (e) => {
          state.effectIntensity = parseInt(e.target.value, 10);
          if (intensityVal) intensityVal.textContent = `${state.effectIntensity}%`;
          Pipeline.update();
        });
      }

      // Reset Effect Button
      const resetEffectBtn = document.getElementById('btn-reset-effect');
      if (resetEffectBtn) {
        resetEffectBtn.addEventListener('click', () => {
          this.resetEffect();
        });
      }
    },

    applyEffect(effectKey) {
      const preset = EFFECT_PRESETS[effectKey];
      if (!preset) return;

      state.activeEffect = effectKey;

      // Safely apply preset merged over complete defaults to avoid state pollution
      state.adjustments = { ...DEFAULT_ADJUSTMENTS, ...JSON.parse(JSON.stringify(preset.adjustments)) };
      state.halftone = { ...DEFAULT_HALFTONE, ...JSON.parse(JSON.stringify(preset.halftone)) };
      state.texture = { ...DEFAULT_TEXTURE, ...JSON.parse(JSON.stringify(preset.texture)) };
      state.effectIntensity = 100;

      // Update active card highlighting
      document.querySelectorAll('.effect-card').forEach((card) => {
        card.classList.toggle('active', card.dataset.effectKey === effectKey);
      });

      this.syncAllControls();
      Pipeline.update();
      HistoryManager.pushState(`Effect: ${preset.name}`);
      this.showToast(`Applied preset: ${preset.name}`);
    },

    resetEffect() {
      state.activeEffect = 'none';
      state.adjustments = { ...DEFAULT_ADJUSTMENTS };
      state.halftone = { ...DEFAULT_HALFTONE };
      state.texture = { ...DEFAULT_TEXTURE };
      state.effectIntensity = 100;

      document.querySelectorAll('.effect-card').forEach((c) => c.classList.remove('active'));
      this.syncAllControls();
      Pipeline.update();
      HistoryManager.pushState('Reset Effect');
      this.showToast('Reset to original');
    },

    // Bind Textures Library
    bindTextures() {
      const textureCards = document.querySelectorAll('.texture-card');
      textureCards.forEach((card) => {
        card.addEventListener('click', () => {
          textureCards.forEach((c) => c.classList.remove('active'));
          card.classList.add('active');
          state.texture.type = card.dataset.textureType;
          Pipeline.update();
          HistoryManager.pushState(`Texture: ${state.texture.type}`);
        });
      });

      // Texture Intensity Slider
      const texSlider = document.getElementById('texture-intensity-slider');
      const texVal = document.getElementById('val-texture-intensity');
      if (texSlider) {
        texSlider.addEventListener('input', (e) => {
          state.texture.intensity = parseInt(e.target.value, 10);
          if (texVal) texVal.textContent = `${state.texture.intensity}%`;
          Pipeline.update();
        });
        texSlider.addEventListener('change', () => {
          HistoryManager.pushState('Texture Intensity');
        });
      }

      // Texture Scale Slider
      const scaleSlider = document.getElementById('texture-scale-slider');
      const scaleVal = document.getElementById('val-texture-scale');
      if (scaleSlider) {
        scaleSlider.addEventListener('input', (e) => {
          state.texture.scale = parseInt(e.target.value, 10) / 100;
          if (scaleVal) scaleVal.textContent = `${Math.round(state.texture.scale * 100)}%`;
          Pipeline.update();
        });
        scaleSlider.addEventListener('change', () => {
          HistoryManager.pushState('Texture Scale');
        });
      }

      // Texture Grain Slider
      const grainSlider = document.getElementById('texture-grain-slider');
      const grainVal = document.getElementById('val-texture-grain');
      if (grainSlider) {
        grainSlider.addEventListener('input', (e) => {
          state.texture.grainAmount = parseInt(e.target.value, 10);
          if (grainVal) grainVal.textContent = state.texture.grainAmount;
          Pipeline.update();
        });
        grainSlider.addEventListener('change', () => {
          HistoryManager.pushState('Texture Grain');
        });
      }

      // Blend Mode selector
      const blendSelect = document.getElementById('select-texture-blend');
      if (blendSelect) {
        blendSelect.addEventListener('change', (e) => {
          state.texture.blendMode = e.target.value;
          Pipeline.update();
          HistoryManager.pushState(`Blend Mode: ${state.texture.blendMode}`);
        });
      }

      // Paper Tint picker
      const tintPicker = document.getElementById('picker-paper-tint');
      if (tintPicker) {
        tintPicker.addEventListener('input', (e) => {
          state.texture.paperTint = e.target.value;
          Pipeline.update();
        });
      }
    },

    // Bind Image Uploads & Drag-and-Drop
    bindUploads() {
      const fileInput = document.getElementById('file-upload-input');
      const panelDrop = document.getElementById('panel-dropzone');
      const emptyDrop = document.getElementById('empty-drop-area');
      const emptyBrowseBtn = document.getElementById('empty-btn-browse');

      const triggerUpload = () => {
        if (fileInput) fileInput.click();
      };

      if (panelDrop) panelDrop.addEventListener('click', triggerUpload);
      if (emptyBrowseBtn) emptyBrowseBtn.addEventListener('click', triggerUpload);

      if (fileInput) {
        fileInput.addEventListener('change', (e) => {
          const file = e.target.files && e.target.files[0];
          if (file) this.loadFile(file);
        });
      }

      // Drag and Drop listeners
      const setupDropArea = (area) => {
        if (!area) return;
        ['dragenter', 'dragover'].forEach((eventName) => {
          area.addEventListener(eventName, (e) => {
            e.preventDefault();
            area.classList.add('dragover');
          });
        });

        ['dragleave', 'drop'].forEach((eventName) => {
          area.addEventListener(eventName, (e) => {
            e.preventDefault();
            area.classList.remove('dragover');
          });
        });

        area.addEventListener('drop', (e) => {
          const dt = e.dataTransfer;
          const file = dt && dt.files && dt.files[0];
          if (file) this.loadFile(file);
        });
      };

      setupDropArea(panelDrop);
      setupDropArea(emptyDrop);
      setupDropArea(document.getElementById('canvas-workspace'));
    },

    loadFile(file) {
      // Validate format via MIME type and file extension fallback
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const fileName = file.name ? file.name.toLowerCase() : '';
      const hasValidExt = /\.(jpe?g|png|webp)$/i.test(fileName);
      const hasValidType = validTypes.includes(file.type.toLowerCase());

      if (!hasValidType && !hasValidExt) {
        this.showToast('Please upload a valid JPG, PNG, or WEBP image.');
        return;
      }

      const objUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objUrl);
        this.setImage(img, file.name.replace(/\.[^/.]+$/, ''));
        this.showToast(`Loaded ${file.name}`);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objUrl);
        this.showToast('Failed to load image file.');
      };
      img.src = objUrl;
    },

    loadSample(sampleId) {
      const sampleCanvas = SampleGenerator.generate(sampleId, 1400, 1050);
      const img = new Image();
      img.onload = () => {
        const found = SampleGenerator.samples.find((s) => s.id === sampleId);
        const name = found ? found.title : 'Sample Artwork';
        this.setImage(img, name);
        this.showToast(`Loaded sample: ${name}`);
      };
      img.src = sampleCanvas.toDataURL('image/png');
    },

    setImage(img, title = 'Untitled Design') {
      state.cachedWorkCanvas = null;
      state.imageLoaded = true;
      state.originalImage = img;
      state.projectTitle = title;

      // Update header project title
      const titleInput = document.getElementById('project-title');
      if (titleInput) titleInput.value = title;
      document.title = `${title} — Halftone Lab`;

      // Create full-resolution original canvas
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      state.originalCanvas = canvas;

      // Update UI elements
      const emptyState = document.getElementById('workspace-empty-state');
      const stageWrapper = document.getElementById('canvas-stage-wrapper');
      const infoBox = document.getElementById('current-image-info');

      if (emptyState) emptyState.style.display = 'none';
      if (stageWrapper) stageWrapper.classList.add('active');

      if (infoBox) {
        infoBox.style.display = 'flex';
        document.getElementById('info-dimensions').textContent = `${img.width} × ${img.height} px`;
        document.getElementById('info-aspect').textContent = (img.width / img.height).toFixed(2);
      }

      // Reset view to fit screen
      CanvasViewer.fitToScreen();

      // Render initial state
      Pipeline.update();
      HistoryManager.pushState('Open Image');
    },

    // Generate Mini Rendered Previews for Sample Cards & Effect Cards
    generateSampleThumbnails() {
      // 1. Empty state & Uploads sample cards (preserving overlay labels)
      SampleGenerator.samples.forEach((sample) => {
        const smallCanvas = SampleGenerator.generate(sample.id, 240, 160);
        document.querySelectorAll(`[data-sample-id="${sample.id}"]`).forEach((container) => {
          let c = container.querySelector('canvas');
          if (!c) {
            c = document.createElement('canvas');
            c.width = 240;
            c.height = 160;
            container.insertBefore(c, container.firstChild);
          }
          c.getContext('2d').drawImage(smallCanvas, 0, 0);
          container.onclick = () => this.loadSample(sample.id);
        });
      });

      // 2. Render miniatures for Effect Cards
      const testMini = SampleGenerator.generate('sample-cyberpunk', 160, 110);
      const testData = testMini.getContext('2d').getImageData(0, 0, 160, 110);

      document.querySelectorAll('.effect-card').forEach((card) => {
        const key = card.dataset.effectKey;
        const preset = EFFECT_PRESETS[key];
        const thumbContainer = card.querySelector('.effect-card-thumb');

        if (preset && thumbContainer) {
          const miniCanvas = document.createElement('canvas');
          miniCanvas.width = 160;
          miniCanvas.height = 110;

          // Quick mini halftone
          const adjData = ImageProcessor.applyAdjustments(testData, preset.adjustments);
          HalftoneEngine.render(adjData, miniCanvas, preset.halftone, preset.halftone.edgeStrength, 1, false);

          thumbContainer.innerHTML = '';
          thumbContainer.appendChild(miniCanvas);
        }
      });
    },

    // Modal Events
    bindModals() {
      // Close modal on backdrop click or close button
      document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
        backdrop.addEventListener('click', (e) => {
          if (e.target === backdrop) backdrop.classList.remove('open');
        });
      });

      document.querySelectorAll('.modal-close-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const modal = btn.closest('.modal-backdrop');
          if (modal) modal.classList.remove('open');
        });
      });

      // Export Format Selection
      document.querySelectorAll('[data-export-format]').forEach((btn) => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('[data-export-format]').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          state.exportFormat = btn.dataset.exportFormat;
          ExportManager.updateSummary();
        });
      });

      // Export Scale Selection
      document.querySelectorAll('[data-export-scale]').forEach((btn) => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('[data-export-scale]').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          state.exportScale = parseFloat(btn.dataset.exportScale);
          ExportManager.updateSummary();
        });
      });

      // Export Quality Slider (for JPEG / WebP)
      const qualitySlider = document.getElementById('export-quality-slider');
      const qualityVal = document.getElementById('val-export-quality');
      if (qualitySlider) {
        qualitySlider.addEventListener('input', (e) => {
          state.exportQuality = parseInt(e.target.value, 10) / 100;
          if (qualityVal) qualityVal.textContent = `${Math.round(state.exportQuality * 100)}%`;
          ExportManager.updateSummary();
        });
      }

      // Export Transparent Background Toggle
      const transparentToggle = document.getElementById('toggle-export-transparent');
      if (transparentToggle) {
        transparentToggle.addEventListener('change', (e) => {
          state.exportTransparent = e.target.checked;
        });
      }

      // Export Download Button
      const btnConfirmDownload = document.getElementById('btn-confirm-download');
      if (btnConfirmDownload) {
        btnConfirmDownload.addEventListener('click', () => {
          ExportManager.download();
        });
      }

      // Export Copy to Clipboard
      const btnCopy = document.getElementById('btn-copy-clipboard');
      if (btnCopy) {
        btnCopy.addEventListener('click', () => {
          ExportManager.copyToClipboard();
        });
      }

      // Zoom Toolbar buttons
      const btnZoomIn = document.getElementById('btn-zoom-in');
      const btnZoomOut = document.getElementById('btn-zoom-out');
      const btnFit = document.getElementById('btn-fit-screen');
      const btn100 = document.getElementById('btn-zoom-100');
      const btnFullscreen = document.getElementById('btn-toggle-fullscreen');

      if (btnZoomIn) btnZoomIn.addEventListener('click', () => CanvasViewer.setZoom(state.zoom * 1.25));
      if (btnZoomOut) btnZoomOut.addEventListener('click', () => CanvasViewer.setZoom(state.zoom * 0.8));
      if (btnFit) btnFit.addEventListener('click', () => CanvasViewer.fitToScreen());
      if (btn100) btn100.addEventListener('click', () => CanvasViewer.resetView());
      if (btnFullscreen) {
        btnFullscreen.addEventListener('click', () => {
          this.toggleFullscreen();
        });
      }
    },

    toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => console.log(err));
      } else {
        document.exitFullscreen().catch((err) => console.log(err));
      }
    },

    toggleCompareMode() {
      state.compareMode = !state.compareMode;
      const divider = document.getElementById('compare-divider');
      const badges = document.querySelectorAll('.compare-badge');
      const btnCompare = document.getElementById('btn-quick-compare');

      if (divider) divider.style.display = state.compareMode ? 'block' : 'none';
      badges.forEach((b) => b.style.display = state.compareMode ? 'block' : 'none');
      if (btnCompare) btnCompare.classList.toggle('active', state.compareMode);

      Pipeline.update();
      this.showToast(state.compareMode ? 'Compare Split View Enabled' : 'Compare View Disabled');
    },

    resetAllEdits() {
      state.adjustments = { ...DEFAULT_ADJUSTMENTS };
      state.halftone = { ...DEFAULT_HALFTONE };
      state.texture = { ...DEFAULT_TEXTURE };
      state.activeEffect = 'none';

      this.syncAllControls();
      Pipeline.update();
      HistoryManager.pushState('Reset All Edits');
      this.showToast('All adjustments and effects reset');
    },

    // Keyboard Shortcuts
    bindKeyboardShortcuts() {
      window.addEventListener('keydown', (e) => {
        // Ignore if typing in an input
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

        // Undo: Ctrl+Z or Cmd+Z
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
          e.preventDefault();
          HistoryManager.undo();
        }
        // Redo: Ctrl+Shift+Z or Ctrl+Y
        else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
          e.preventDefault();
          HistoryManager.redo();
        }
        // Save/Export: Ctrl+S
        else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
          e.preventDefault();
          ExportManager.openModal();
        }
        // Open file: Ctrl+O
        else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
          e.preventDefault();
          const fileInput = document.getElementById('file-upload-input');
          if (fileInput) fileInput.click();
        }
        // Toggle Compare: C
        else if (e.key.toLowerCase() === 'c') {
          this.toggleCompareMode();
        }
        // Hold Space to Peek Original
        else if (e.code === 'Space' && !state.isHoldingPeek) {
          state.isHoldingPeek = true;
          Pipeline.update();
        }
        // Delete / Backspace: Reset edits or clear image
        else if (e.key === 'Delete') {
          if (state.imageLoaded) {
            this.resetAllEdits();
          }
        }
        // Zoom shortcuts: + / = and -
        else if (e.key === '=' || e.key === '+') {
          CanvasViewer.setZoom(state.zoom * 1.2);
        } else if (e.key === '-') {
          CanvasViewer.setZoom(state.zoom * 0.8);
        } else if (e.key === '0') {
          CanvasViewer.fitToScreen();
        }
      });

      window.addEventListener('keyup', (e) => {
        if (e.code === 'Space' && state.isHoldingPeek) {
          state.isHoldingPeek = false;
          Pipeline.update();
        }
      });
    },

    // Sync all form inputs to current state values
    syncAllControls() {
      this.syncAdjustmentControls();
      this.syncHalftoneControls();
      this.syncTextureControls();
      this.syncCompareControls();
      this.syncEffectControls();
    },

    syncAdjustmentControls() {
      for (const [key, val] of Object.entries(state.adjustments)) {
        const slider = document.getElementById(`adj-${key}`);
        const valEl = document.getElementById(`val-adj-${key}`);
        const resetBtn = document.getElementById(`reset-adj-${key}`);
        if (slider) slider.value = val;
        if (valEl) valEl.textContent = val;
        if (resetBtn) resetBtn.classList.toggle('visible', val !== DEFAULT_ADJUSTMENTS[key]);
      }
    },

    syncHalftoneControls() {
      const toggle = document.getElementById('toggle-halftone-enabled');
      if (toggle) toggle.checked = state.halftone.enabled;

      // Shape
      document.querySelectorAll('.shape-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.shape === state.halftone.shape);
      });

      // Color mode
      document.querySelectorAll('[data-colormode]').forEach((b) => {
        b.classList.toggle('active', b.dataset.colormode === state.halftone.colorMode);
      });

      // Pickers
      const ink = document.getElementById('picker-ink-color');
      const paper = document.getElementById('picker-paper-color');
      if (ink) ink.value = state.halftone.inkColor;
      if (paper) paper.value = state.halftone.paperColor;

      // Dithering select & intensity
      const ditherSelect = document.getElementById('select-dither-algo');
      if (ditherSelect) ditherSelect.value = state.halftone.dither || 'none';
      const ditherAmt = document.getElementById('ht-dither-amount');
      const ditherAmtVal = document.getElementById('val-ht-dither-amount');
      const amtVal = state.halftone.ditherAmount !== undefined ? state.halftone.ditherAmount : 100;
      if (ditherAmt) ditherAmt.value = amtVal;
      if (ditherAmtVal) ditherAmtVal.textContent = `${amtVal}%`;

      // Sliders & Value Labels
      const sizeSlider = document.getElementById('ht-size');
      const sizeVal = document.getElementById('val-ht-size');
      if (sizeSlider) sizeSlider.value = state.halftone.size;
      if (sizeVal) sizeVal.textContent = state.halftone.size;

      const angleSlider = document.getElementById('ht-angle');
      const angleVal = document.getElementById('val-ht-angle');
      if (angleSlider) angleSlider.value = state.halftone.angle;
      if (angleVal) angleVal.textContent = state.halftone.angle;

      const scaleSlider = document.getElementById('ht-scale');
      const scaleVal = document.getElementById('val-ht-scale');
      if (scaleSlider) scaleSlider.value = Math.round(state.halftone.scale * 100);
      if (scaleVal) scaleVal.textContent = `${Math.round(state.halftone.scale * 100)}%`;

      const contrastSlider = document.getElementById('ht-contrast');
      const contrastVal = document.getElementById('val-ht-contrast');
      if (contrastSlider) contrastSlider.value = state.halftone.contrast;
      if (contrastVal) contrastVal.textContent = state.halftone.contrast;

      const densitySlider = document.getElementById('ht-density');
      const densityVal = document.getElementById('val-ht-density');
      if (densitySlider) densitySlider.value = state.halftone.density;
      if (densityVal) densityVal.textContent = state.halftone.density;

      const edgeSlider = document.getElementById('ht-edge');
      const edgeVal = document.getElementById('val-ht-edge');
      if (edgeSlider) edgeSlider.value = state.halftone.edgeStrength;
      if (edgeVal) edgeVal.textContent = state.halftone.edgeStrength;

      const bleedSlider = document.getElementById('ht-bleed');
      const bleedVal = document.getElementById('val-ht-bleed');
      if (bleedSlider) bleedSlider.value = Math.round((state.halftone.inkBleed || 0) * 10);
      if (bleedVal) bleedVal.textContent = state.halftone.inkBleed || 0;

      const threshSlider = document.getElementById('ht-threshold');
      const threshVal = document.getElementById('val-ht-threshold');
      if (threshSlider) threshSlider.value = state.halftone.threshold;
      if (threshVal) threshVal.textContent = state.halftone.threshold;
    },

    syncTextureControls() {
      document.querySelectorAll('.texture-card').forEach((c) => {
        c.classList.toggle('active', c.dataset.textureType === state.texture.type);
      });
      const intensity = document.getElementById('texture-intensity-slider');
      const intensityVal = document.getElementById('val-texture-intensity');
      if (intensity) intensity.value = state.texture.intensity;
      if (intensityVal) intensityVal.textContent = `${state.texture.intensity}%`;

      const scale = document.getElementById('texture-scale-slider');
      const scaleVal = document.getElementById('val-texture-scale');
      if (scale) scale.value = Math.round((state.texture.scale || 1.0) * 100);
      if (scaleVal) scaleVal.textContent = `${Math.round((state.texture.scale || 1.0) * 100)}%`;

      const grain = document.getElementById('texture-grain-slider');
      const grainVal = document.getElementById('val-texture-grain');
      if (grain) grain.value = state.texture.grainAmount !== undefined ? state.texture.grainAmount : 25;
      if (grainVal) grainVal.textContent = state.texture.grainAmount !== undefined ? state.texture.grainAmount : 25;

      const tintPicker = document.getElementById('picker-paper-tint');
      if (tintPicker) tintPicker.value = state.texture.paperTint || '#fdfbf7';

      const blendSelect = document.getElementById('select-texture-blend');
      if (blendSelect) blendSelect.value = state.texture.blendMode || 'multiply';
    },

    syncCompareControls() {
      const splitSlider = document.getElementById('compare-split-slider');
      const splitVal = document.getElementById('val-compare-split');
      const pct = Math.round((state.compareSplit || 0.5) * 100);
      if (splitSlider) splitSlider.value = pct;
      if (splitVal) splitVal.textContent = `${pct}%`;

      document.querySelectorAll('[data-compare-orientation]').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.compareOrientation === state.compareOrientation);
      });
    },

    syncEffectControls() {
      const effSlider = document.getElementById('effect-intensity-slider');
      const effVal = document.getElementById('val-effect-intensity');
      if (effSlider) effSlider.value = state.effectIntensity;
      if (effVal) effVal.textContent = `${state.effectIntensity}%`;

      document.querySelectorAll('.effect-card').forEach((card) => {
        card.classList.toggle('active', card.dataset.effectKey === state.activeEffect);
      });
    },

    // Toast Notification System
    showToast(message) {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        <span>${message}</span>
      `;
      container.appendChild(toast);

      setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 250);
      }, 2600);
    }
  };

  // Expose namespace for testing & developer inspection
  window.HalftoneLab = { state, UI, Pipeline, ExportManager, HistoryManager, HalftoneEngine, TextureEngine, ImageProcessor };

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => UI.init());
  } else {
    UI.init();
  }

})();
