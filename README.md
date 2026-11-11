# Halftone Lab — Professional Retro Photo Editor & Creative Studio

> **Transform ordinary photographs into retro comics, manga screentones, newspaper prints, and vintage halftone artwork directly inside your browser.**

**Halftone Lab** is a client-side creative photo editing studio built with pure vanilla HTML5, CSS3, and JavaScript using the HTML5 Canvas API. Designed with the clean, modern layout and micro-interaction philosophy of **Canva's modern photo editor**, Halftone Lab empowers designers, illustrators, and printmakers with real-time analog halftone rendering, procedural dithering, multi-angle rosette CMYK simulation, and organic paper textures.

**Zero external dependencies. Zero frameworks. Zero server uploads. 100% private and offline-capable.**

---

## 🌟 Highlights & Key Features

- **Canva-Inspired Creative Studio UI/UX**:
  - Crisp, modern layout featuring clean white/light slate surfaces, subtle borders, soft multi-tier shadows, and violet/indigo accents (`#7C3AED`).
  - Icon-based left tool rail with quick-switching panels: **Uploads**, **Effects**, **Adjust**, **Halftone**, **Texture**, **Compare**, and **About**.
  - Persistent top navigation bar with editable project title, real-time "All changes saved" status, undo/redo history stack, and purple **Export** action.
  - Large central canvas workspace with dynamic zoom (10% to 500%), pan navigation, fit-to-screen (`0`), 1:1 view, and fullscreen mode.
  - Empty-state hero card with drag-and-drop upload and 4 instant procedural sample artworks (Cyberpunk, Vintage Jazz, Tokyo Street, 1970s Sports Car).

- **21 Curated, Fully-Functional Effects**:
  - **Comic & Manga**: Classic Manga, Japanese Screentone, Vintage Comic Book, Pop Art (Roy Lichtenstein style), Newspaper Print, Graphic Novel (Frank Miller noir), Black & White Ink (Sumi-e wash), Vintage Comic Dots.
  - **Retro & Analog**: 1970s Retro Print, Vintage Newspaper (1920s print), Risograph (Dual-drum Fluorescent Pink & Deep Teal), Photocopy (90s Xerox toner distortion), Grainy Film (3200 ASA silver halide), Old Magazine (1960s publication), Distressed Print (Woodblock stamp erosion).
  - **Artistic**: Crosshatch (Multi-angle pen lines), Stippling (Stochastic ink pen dots), Line Art (Sobel contour extraction), Pencil Halftone (Directional graphite shading), Engraving (Currency undulating curves), High Contrast Noir (Obsidian chiaroscuro).

- **Advanced Halftone & Dithering Engine**:
  - Variable dot geometry: **Circle**, **Square**, **Diamond**, **Ellipse**, and **Engraved Line / Stripe**.
  - Arbitrary screen angles ($0^\circ$ modern grid, $45^\circ$ classic print, $60^\circ$ manga screentone).
  - 4-color CMYK halftone rosette simulation with angled screen offsets ($15^\circ$ Cyan, $75^\circ$ Magenta, $0^\circ$ Yellow, $45^\circ$ Black).
  - Advanced dithering algorithms: **Floyd-Steinberg error diffusion**, **Atkinson dithering**, **Bayer $4\times 4$ and $8\times 8$ ordered matrices**, and **Stochastic random dither**.
  - Sobel edge convolution for crisp comic and manga contour ink lines.
  - Ink bleed and edge feathering simulation for vintage mechanical print look.

- **Non-Destructive Adjustments & Tone Curve**:
  - 10 interactive sliders: Brightness, Contrast, Exposure, Highlights, Shadows, Gamma ($0.2\text{--}2.5$), Saturation, Temperature (cool blue to warm amber), Sharpness (3x3 unsharp convolution), and Film Grain.
  - Individual reset buttons per slider and global "Reset adjustments" control.

- **Procedural Canvas Textures**:
  - 8 realistic procedural paper surfaces: Clean White, Fine Matte, Aged Parchment, Newspaper Print, Rough Recycled (with visible pulp fibers), Vintage Yellow Pulp, Grunge Distress, and Heavy Grain.
  - Custom blend modes (`multiply`, `overlay`, `soft-light`, `normal`), intensity controls, and paper wash tint pickers.

- **Real-Time Interactive Comparison (Before / After)**:
  - Draggable split-view divider directly on the live canvas with smooth mouse/touch tracking.
  - Instant original preview: hold <kbd>Spacebar</kbd> anytime to peek at the raw unedited photograph.

- **Studio-Grade Export System**:
  - Formats: Lossless **PNG**, High-DPI **JPEG**, and Modern **WebP**.
  - Scales: **1x** (Original resolution), **2x** (Ultra Print supersampling), and **0.5x** (Web preview).
  - Transparent paper background option (for transparent PNG cutouts).
  - Native system clipboard copy via `ClipboardItem` API.
  - Zero-lag real-time preview canvas decoupled from full-resolution export rendering.

---

## 📁 Project Structure

```text
halftone-lab/
├── index.html        # Semantic HTML5 layout, Canva-inspired dock, modals & canvas stage
├── style.css         # CSS design tokens, Canva aesthetic surfaces, transitions & responsive rules
├── app.js            # Core studio state, halftone math, dithering, procedural samples & pipeline
└── README.md         # Architecture, math documentation & deployment instructions
```

---

## 🧮 Halftone & Image Processing Algorithms

### 1. Luminance & Geometric Dot Radius
The image is converted to grayscale luminance $L \in [0, 1]$ using standard ITU-R BT.601 perceptual weighting:

$$L = \frac{0.299 \cdot R + 0.587 \cdot G + 0.114 \cdot B}{255}$$

For a dot pitch (spacing) $P$ and screen angle $\theta$, the sample coordinates are transformed via rotational matrix:

$$\begin{pmatrix} x' \\ y' \end{pmatrix} = \begin{pmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{pmatrix} \begin{pmatrix} g_x \\ g_y \end{pmatrix} + \begin{pmatrix} c_x \\ c_y \end{pmatrix}$$

The maximum dot radius $R_{\text{max}} = \frac{P}{2} \cdot \sqrt{2} \cdot \text{scale}$. To preserve tonal linearity, dot area is proportional to darkness $D = 1 - L$, yielding radius:

$$r = R_{\text{max}} \cdot \sqrt{D}$$

### 2. CMYK Rosette Simulation
In authentic four-color process printing, four separate halftone screens are superimposed at specific angles to prevent optical moiré patterns:
- **Cyan**: $15^\circ$
- **Magenta**: $75^\circ$
- **Yellow**: $0^\circ$
- **Black (Key)**: $45^\circ$

Halftone Lab computes CMYK channel values from RGB, then executes four independent rotational sampling passes blended with `ctx.globalCompositeOperation = 'multiply'`.

### 3. Error Diffusion & Ordered Dithering
- **Floyd-Steinberg**: Propagates quantization error $\varepsilon = \text{oldVal} - \text{newVal}$ across four neighboring pixels:
  - $(x+1, y) \to \frac{7}{16} \varepsilon$
  - $(x-1, y+1) \to \frac{3}{16} \varepsilon$
  - $(x, y+1) \to \frac{5}{16} \varepsilon$
  - $(x+1, y+1) \to \frac{1}{16} \varepsilon$
- **Atkinson**: Apple MacPaint error diffusion distributing $\frac{1}{8} \varepsilon$ across 6 neighboring pixels, preserving stark contrast with minimal banding.
- **Bayer Matrices**: Spatial ordered threshold matrices normalized across $4\times 4$ and $8\times 8$ grids.

### 4. Sobel Edge Contours
Horizontal and vertical convolution kernels compute gradient magnitude $|\nabla I| = \sqrt{G_x^2 + G_y^2}$:

$$G_x = \begin{bmatrix} -1 & 0 & 1 \\ -2 & 0 & 2 \\ -1 & 0 & 1 \end{bmatrix} * I, \quad G_y = \begin{bmatrix} -1 & -2 & -1 \\ 0 & 0 & 0 \\ 1 & 2 & 1 \end{bmatrix} * I$$

---

## ⌨️ Keyboard Shortcuts Reference

| Shortcut | Action |
| :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> | Undo previous adjustment or preset |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> / <kbd>Ctrl</kbd> + <kbd>Y</kbd> | Redo reverted action |
| <kbd>Ctrl</kbd> + <kbd>S</kbd> | Open Export & Download Dialog |
| <kbd>Ctrl</kbd> + <kbd>O</kbd> | Open local image file dialog |
| <kbd>C</kbd> | Toggle interactive Before / After split view |
| <kbd>Spacebar</kbd> *(Hold)* | Instant Peek at 100% original photograph |
| <kbd>+</kbd> / <kbd>=</kbd> | Zoom In |
| <kbd>-</kbd> | Zoom Out |
| <kbd>0</kbd> | Fit canvas to viewport |
| <kbd>Shift</kbd> + Drag | Pan workspace when zoomed |

---

## 🚀 Deployment & Local Usage

Halftone Lab has **zero dependencies**, requires no Node.js build step, and runs right out of the box.

### Quick Start:
1. Double-click `index.html` in your file browser (Chrome, Edge, Safari, Firefox).
2. Or serve locally with any HTTP server:
   ```bash
   # Python 3
   python -m http.server 8080
   
   # Or npx serve
   npx serve .
   ```
3. Open `http://localhost:8080` in your browser.

### GitHub Pages Deployment:
1. Push `index.html`, `style.css`, `app.js`, and `README.md` to your GitHub repository.
2. In your repository settings, go to **Pages** > **Build and deployment**.
3. Set Source to **Deploy from a branch** and select the `main` (or `master`) branch `/ (root)`.
4. Click Save. Your Halftone Lab editor will be live worldwide within seconds!

---

## 🛡️ Privacy Guarantee
Halftone Lab performs all pixel manipulations directly inside your local browser thread through HTML5 Canvas buffers. No cookies, no trackers, no external APIs, and no server uploads. Your artwork and photographs never leave your computer.
