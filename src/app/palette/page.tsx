"use client";

import { useState, useRef, useEffect } from "react";
import { Dropzone } from "@/components/Dropzone";
import { ArrowLeft, Copy, Check, Code2, AlertCircle, FileJson, ClipboardList, ImageIcon, Wind, X, Download, Pipette } from "lucide-react";
import Link from "next/link";

type ColorFormat = "hex" | "rgb" | "hsl";

type PaletteColor = {
  hex: () => string;
  rgb: () => { r: number; g: number; b: number };
};

type ExportModalState = {
  formatName: string;
  content: string;
  filename: string;
  mimeType: string;
} | null;

function rgbToHslStr(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

export default function PalettePage() {
  const [file, setFile] = useState<File | null>(null);
  const [palette, setPalette] = useState<PaletteColor[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedState, setCopiedState] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: "success" | "error", id: number} | null>(null);
  
  const [colorFormat, setColorFormat] = useState<ColorFormat>("hex");
  const [exportModal, setExportModal] = useState<ExportModalState>(null);

  type PixelModal = {
    hex: string;
    rgb: { r: number; g: number; b: number };
    previewDataUrl: string;
  } | null;
  const [pixelModal, setPixelModal] = useState<PixelModal>(null);
  const [pixelCopied, setPixelCopied] = useState(false);

  const showToast = (message: string, type: "success" | "error") => {
    const id = Date.now();
    setToast({ message, type, id });
    setTimeout(() => {
      setToast(current => current?.id === id ? null : current);
    }, 3000);
  };

  const imgRef = useRef<HTMLImageElement>(null);

  const extractColors = async () => {
    if (!imgRef.current) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const { getPaletteSync } = await import("colorthief") as {
        getPaletteSync: (image: HTMLImageElement, options: { colorCount: number }) => PaletteColor[] | null;
      };
      const colors = getPaletteSync(imgRef.current, { colorCount: 20 });
      
      if (!colors) {
        setPalette([]);
        return;
      }

      // Filter out overly similar colors to get only truthful distinct dominant colors
      const distinct: PaletteColor[] = [];
      const threshold = 35; // RGB distance threshold

      for (const color of colors) {
        const { r, g, b } = color.rgb();
        let isDistinct = true;
        for (const existing of distinct) {
          const { r: r2, g: g2, b: b2 } = existing.rgb();
          const distance = Math.sqrt(Math.pow(r - r2, 2) + Math.pow(g - g2, 2) + Math.pow(b - b2, 2));
          if (distance < threshold) {
            isDistinct = false;
            break;
          }
        }
        if (isDistinct) {
          distinct.push(color);
        }
      }

      setPalette(distinct);
    } catch (e: unknown) {
      console.error("Failed to extract colors", e);
      setErrorMsg(e instanceof Error ? e.message : "Failed to extract colors. Please try another image.");
      setPalette([]);
      showToast("Failed to extract palette", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!file || !imgRef.current) return;
    const objUrl = URL.createObjectURL(file);
    setLoading(true);
    setErrorMsg(null);
    setPalette([]);
    imgRef.current.src = objUrl;

    imgRef.current.onload = () => {
      // Simulate slight delay for smooth UI transition
      setTimeout(() => extractColors(), 300);
    };

    imgRef.current.onerror = () => {
      setLoading(false);
      setPalette([]);
      setErrorMsg("The image could not be processed. Please try another image.");
      showToast("The image could not be processed", "error");
    };

    return () => URL.revokeObjectURL(objUrl);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  const getFormattedColor = (color: PaletteColor) => {
    if (colorFormat === "hex") return color.hex().toLowerCase();
    const { r, g, b } = color.rgb();
    if (colorFormat === "rgb") return `rgb(${r}, ${g}, ${b})`;
    return rgbToHslStr(r, g, b);
  };

  const handleCopy = (text: string, id: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedState(id);
      showToast(`Copied ${text}`, "success");
      setTimeout(() => setCopiedState((current) => current === id ? null : current), 2000);
    } catch {
      showToast(`Failed to copy color`, "error");
    }
  };

  const copyAllHex = () => {
    try {
      const allFormats = palette.map(c => getFormattedColor(c)).join("\n");
      navigator.clipboard.writeText(allFormats);
      setCopiedState("all");
      showToast(`Copied all ${colorFormat.toUpperCase()} values!`, "success");
      setTimeout(() => setCopiedState((current) => current === "all" ? null : current), 2000);
    } catch {
      showToast("Failed to copy all colors", "error");
    }
  };

  const openExportModalCSS = () => {
    const cssVars = palette.map((c, i) => `  --color-${i + 1}: ${getFormattedColor(c)};`).join("\n");
    const fullCss = `:root {\n${cssVars}\n}`;
    setExportModal({
      formatName: "CSS Variables",
      content: fullCss,
      filename: "pixelgrab-palette.css",
      mimeType: "text/css"
    });
  };

  const openExportModalJSON = () => {
    const jsonArr = palette.map((c) => getFormattedColor(c));
    const content = JSON.stringify({ colors: jsonArr }, null, 2);
    setExportModal({
      formatName: "JSON",
      content: content,
      filename: "pixelgrab-palette.json",
      mimeType: "application/json"
    });
  };

  const openExportModalTailwind = () => {
    const colorsObj = palette.reduce((acc, c, i) => {
      acc[`palette-${i + 1}`] = getFormattedColor(c);
      return acc;
    }, {} as Record<string, string>);
    
    // Create the tailwind config content formatting manually for clean output
    const formattedColors = Object.entries(colorsObj)
      .map(([k, v]) => `        "${k}": "${v}"`)
      .join(",\n");

    const tailwindConfig = `module.exports = {
  theme: {
    extend: {
      colors: {
${formattedColors}
      }
    }
  }
}`;
    setExportModal({
      formatName: "Tailwind Config",
      content: tailwindConfig,
      filename: "pixelgrab-palette-tailwind.js",
      mimeType: "text/javascript"
    });
  };

  const handleModalCopy = () => {
    if (!exportModal) return;
    try {
      navigator.clipboard.writeText(exportModal.content);
      showToast("Snippet copied to clipboard!", "success");
    } catch {
      showToast("Failed to copy snippet", "error");
    }
  };

  const handleModalDownload = () => {
    if (!exportModal) return;
    try {
      const blob = new Blob([exportModal.content], { type: exportModal.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = exportModal.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`Downloaded ${exportModal.filename}`, "success");
      setExportModal(null);
    } catch {
      showToast("Failed to download file", "error");
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const img = imgRef.current;
    if (!img || loading) return;

    const rect = img.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;
    const naturalX = Math.round(clickX * scaleX);
    const naturalY = Math.round(clickY * scaleY);

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);

    const pixel = ctx.getImageData(
      Math.min(naturalX, img.naturalWidth - 1),
      Math.min(naturalY, img.naturalHeight - 1),
      1, 1
    ).data;
    const r = pixel[0], g = pixel[1], b = pixel[2];
    const hex = "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");

    // Build a zoomed preview (100×100 natural px → 200×200 canvas)
    const previewSize = 200;
    const zoomRadius = 50;
    const srcX = Math.max(0, naturalX - zoomRadius);
    const srcY = Math.max(0, naturalY - zoomRadius);
    const srcW = Math.min(zoomRadius * 2, img.naturalWidth - srcX);
    const srcH = Math.min(zoomRadius * 2, img.naturalHeight - srcY);

    const pCanvas = document.createElement("canvas");
    pCanvas.width = previewSize;
    pCanvas.height = previewSize;
    const pCtx = pCanvas.getContext("2d");
    if (!pCtx) return;
    pCtx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, previewSize, previewSize);

    // Crosshair
    const cx = previewSize / 2, cy = previewSize / 2;
    pCtx.strokeStyle = "rgba(255,255,255,0.9)";
    pCtx.lineWidth = 1.5;
    pCtx.beginPath();
    pCtx.moveTo(cx - 18, cy); pCtx.lineTo(cx + 18, cy);
    pCtx.moveTo(cx, cy - 18); pCtx.lineTo(cx, cy + 18);
    pCtx.stroke();
    pCtx.strokeStyle = "rgba(0,0,0,0.4)";
    pCtx.lineWidth = 3;
    pCtx.beginPath();
    pCtx.arc(cx, cy, 13, 0, Math.PI * 2);
    pCtx.stroke();
    pCtx.strokeStyle = "rgba(255,255,255,0.95)";
    pCtx.lineWidth = 1.5;
    pCtx.beginPath();
    pCtx.arc(cx, cy, 13, 0, Math.PI * 2);
    pCtx.stroke();

    setPixelCopied(false);
    setPixelModal({ hex, rgb: { r, g, b }, previewDataUrl: pCanvas.toDataURL() });
  };

  const handlePixelCopy = () => {
    if (!pixelModal) return;
    try {
      navigator.clipboard.writeText(pixelModal.hex.toUpperCase());
      setPixelCopied(true);
      showToast(`Copied ${pixelModal.hex.toUpperCase()}`, "success");
      setTimeout(() => setPixelCopied(false), 2000);
    } catch {
      showToast("Failed to copy color", "error");
    }
  };

  const loadSampleImage = async () => {
    setErrorMsg(null);
    setPalette([]);
    setCopiedState(null);

    try {
      const response = await fetch("/samples/palette-sample.png");
      if (!response.ok) {
        throw new Error("Sample image request failed");
      }

      const blob = await response.blob();
      const sampleFile = new File([blob], "pixelgrab-sample.png", {
        type: blob.type || "image/png",
      });
      setFile(sampleFile);
    } catch {
      setLoading(false);
      setErrorMsg("The sample image could not be loaded. Please upload an image instead.");
      showToast("Failed to load sample image", "error");
    }
  };

  const clearUpload = () => {
    setFile(null);
    setPalette([]);
    setErrorMsg(null);
    setCopiedState(null);
  };

  return (
    <div className="flex flex-col gap-5 sm:gap-6 w-full animate-in fade-in duration-500 ease-out pb-12 sm:pb-20">
      <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors w-fit group">
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span className="text-sm font-medium">Home</span>
      </Link>

      {!file ? (
        <div className="flex flex-col items-center gap-8 py-10 sm:py-16 w-full animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-3 text-center max-w-sm">
            <div className="p-3.5 bg-zinc-800/80 rounded-2xl border border-zinc-700/60">
              <ImageIcon className="w-7 h-7 text-zinc-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-200">Drop your image here</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Upload any PNG, JPG, GIF, or WebP. PixelGrab will extract the dominant colors and let you copy or export them instantly.
            </p>
          </div>
          <div className="w-full max-w-2xl">
            <Dropzone onFileAccepted={setFile} />
          </div>
          <button
            type="button"
            onClick={loadSampleImage}
            data-testid="sample-image-button"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-800 active:scale-95"
          >
            <ImageIcon className="w-4 h-4 text-zinc-400" />
            Try sample image
          </button>
          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-xs text-zinc-600">
            <span>HEX · RGB · HSL</span>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span>CSS · JSON · Tailwind</span>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span>Up to 10 MB</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mt-2 w-full">
          
          {/* Left Column: Image Area */}
          <div className="flex flex-col gap-4 sm:gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both w-full">
            <div className="flex items-center justify-between h-9 px-1">
              <h3 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-zinc-500" /> Source Image
              </h3>
              <button 
                onClick={clearUpload} 
                data-testid="upload-new-image"
                className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors active:scale-95 px-2 py-1 rounded-md hover:bg-blue-500/10"
              >
                Upload new image
              </button>
            </div>
            <div className="relative rounded-3xl overflow-hidden border border-zinc-800/80 bg-zinc-900/30 flex flex-col items-center justify-center p-4 sm:p-6 min-h-[400px] lg:min-h-[500px] shadow-sm flex-1 w-full">
              <img
                ref={imgRef}
                onClick={handleImageClick}
                data-testid="source-image"
                className={`max-w-full max-h-[600px] object-contain rounded-xl shadow-lg transition-all duration-700 ease-out select-none ${loading ? "opacity-30 scale-[0.98] blur-[2px] cursor-default" : "opacity-100 scale-100 blur-0 cursor-crosshair"}`}
                alt="Uploaded source"
                crossOrigin="anonymous"
              />
            </div>
            {!loading && palette.length > 0 && (
              <p className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1 px-1">
                <Pipette className="w-3.5 h-3.5" />
                Click anywhere on the image to pick a color
              </p>
            )}
          </div>

          {/* Right Column: Palette Results */}
          <div className="flex flex-col gap-4 sm:gap-5 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-150 fill-mode-both w-full">
            <div className="flex items-center justify-between h-9 w-full px-1">
              <h3 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
                Extracted Palette
                {palette.length > 0 && !loading && (
                  <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-300">
                    {palette.length}
                  </span>
                )}
              </h3>

              {/* Format Switcher */}
              {palette.length > 0 && !loading && !errorMsg && (
                <div className="flex items-center gap-1 bg-zinc-900/80 border border-zinc-800 p-1 rounded-xl shadow-sm">
                  {(["hex", "rgb", "hsl"] as ColorFormat[]).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setColorFormat(fmt)}
                      data-testid={`format-${fmt}`}
                      aria-pressed={colorFormat === fmt}
                      className={`px-3 sm:px-4 py-1.5 text-xs font-bold rounded-[8px] transition-all duration-200 uppercase tracking-wider ${
                        colorFormat === fmt 
                          ? "bg-zinc-700 text-white shadow-sm" 
                          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col flex-1 border border-zinc-800/80 bg-zinc-900/30 rounded-3xl p-5 sm:p-6 lg:p-8 min-h-[400px] lg:min-h-[500px] shadow-sm relative overflow-hidden w-full">
              {loading ? (
                // Loading Skeleton Layout
                <div
                  className="flex flex-col flex-1 h-full animate-in fade-in duration-300"
                  role="status"
                  aria-live="polite"
                  data-testid="palette-loading"
                >
                  <p className="sr-only">Extracting palette...</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="flex flex-col gap-3 animate-pulse" style={{ animationDelay: `${i * 50}ms` }}>
                        <div className="w-full aspect-square bg-zinc-800/40 rounded-xl" />
                        <div className="h-9 w-full bg-zinc-800/40 rounded-lg" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : errorMsg ? (
                // Error Layout
                <div
                  className="flex flex-col items-center justify-center flex-1 h-full gap-4 text-red-400 p-8 text-center animate-in zoom-in-95 duration-300"
                  role="alert"
                  data-testid="palette-error"
                >
                  <div className="p-4 bg-red-950/30 rounded-full">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                  </div>
                  <p className="text-base font-medium">{errorMsg}</p>
                </div>
              ) : palette.length > 0 ? (
                // Loaded Palette Layout
                <div className="flex flex-col h-full" data-testid="palette-results" data-color-format={colorFormat}>
                  {/* Staggered Colors Grid */}
                  <div
                    className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 relative z-10 mb-8 flex-1"
                    data-testid="palette-grid"
                  >
                    {palette.map((color, idx) => {
                      const formattedValue = getFormattedColor(color);
                      const hexPreview = color.hex();
                      const isCopied = copiedState === `color-${idx}`;
                      return (
                        <div
                          key={idx}
                          onClick={() => handleCopy(formattedValue, `color-${idx}`)}
                          data-testid={`palette-color-${idx}`}
                          className="group flex flex-col gap-2.5 relative cursor-pointer animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
                          style={{ animationDelay: `${idx * 40}ms` }}
                        >
                          {/* Color Block */}
                          <div
                            className="w-full aspect-square rounded-2xl shadow-sm border border-zinc-800/40 transition-all duration-300 ease-out 
                                     group-hover:-translate-y-1 group-hover:scale-[1.02] group-active:scale-[0.98]"
                            style={{ 
                              backgroundColor: hexPreview,
                              boxShadow: isCopied ? `0 0 0 2px #4ade80` : undefined,
                            }}
                          >
                            {/* Inner subtle glow for extra premium feel when hovered */}
                            <div className="absolute inset-x-0 top-0 h-full w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-10" style={{ backgroundColor: hexPreview }} />
                          </div>
                          
                          {/* Color Value Label */}
                          <div
                            className={`flex items-center justify-between px-2.5 py-2 sm:px-3 sm:py-2.5 border rounded-xl transition-all duration-300 ease-out group-active:scale-[0.98] min-w-0
                              ${isCopied 
                                ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-400" 
                                : "bg-zinc-900/60 border-zinc-800 text-zinc-300 group-hover:border-zinc-600 group-hover:bg-zinc-800"
                              }`}
                            title={`Copy ${formattedValue}`}
                          >
                            <span className="font-mono text-[11px] sm:text-xs tracking-tight truncate mr-2 font-medium">
                              {colorFormat === "hex" ? formattedValue.toUpperCase() : formattedValue}
                            </span>
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400 scale-in-center animate-in zoom-in shrink-0" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:text-zinc-200 transition-opacity shrink-0" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Action Buttons Group - 2x2 Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-6 mt-auto border-t border-zinc-800/60 w-full">
                    <button
                      onClick={copyAllHex}
                      data-testid="copy-all-colors"
                      className="flex items-center justify-center gap-2.5 text-sm font-semibold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 active:scale-95 px-4 py-3 sm:py-3.5 rounded-xl transition-all duration-200 border border-zinc-700 hover:border-zinc-500 shadow-sm"
                    >
                      {copiedState === "all" ? <Check className="w-4 h-4 text-green-400 shrink-0" /> : <ClipboardList className="w-4 h-4 text-zinc-400 shrink-0" />}
                      <span>{copiedState === "all" ? "Copied All" : "Copy All"}</span>
                    </button>
                    <button
                      onClick={openExportModalCSS}
                      data-testid="export-css"
                      className="flex items-center justify-center gap-2.5 text-sm font-semibold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 active:scale-95 px-4 py-3 sm:py-3.5 rounded-xl transition-all duration-200 border border-zinc-700 hover:border-zinc-500 shadow-sm"
                    >
                      <Code2 className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span>Export CSS</span>
                    </button>
                    <button
                      onClick={openExportModalJSON}
                      data-testid="export-json"
                      className="flex items-center justify-center gap-2.5 text-sm font-semibold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 active:scale-95 px-4 py-3 sm:py-3.5 rounded-xl transition-all duration-200 border border-zinc-700 hover:border-zinc-500 shadow-sm"
                    >
                      <FileJson className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span>Export JSON</span>
                    </button>
                    <button
                      onClick={openExportModalTailwind}
                      data-testid="export-tailwind"
                      className="flex items-center justify-center gap-2.5 text-sm font-semibold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 active:scale-95 px-4 py-3 sm:py-3.5 rounded-xl transition-all duration-200 border border-zinc-700 hover:border-zinc-500 shadow-sm"
                    >
                      <Wind className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span>Export Tailwind</span>
                    </button>
                  </div>
                </div>
              ) : (
                // Fallback Empty 
                <div className="flex flex-col items-center justify-center flex-1 h-full text-zinc-500 gap-2 animate-in fade-in">
                  <p>No dominant colors identified.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pixel Picker Modal */}
      {pixelModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setPixelModal(null)}
        >
          <div
            className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col w-full max-w-xs animate-in zoom-in-95 duration-200 ease-out"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-900/60">
              <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <Pipette className="w-4 h-4 text-zinc-400" />
                Picked Color
              </h3>
              <button
                onClick={() => setPixelModal(null)}
                className="text-zinc-500 hover:text-zinc-200 transition-colors p-1 hover:bg-zinc-800 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Zoomed preview */}
            <div className="relative w-full aspect-square bg-zinc-900 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pixelModal.previewDataUrl}
                alt="Zoomed preview"
                className="w-full h-full object-cover"
                style={{ imageRendering: "pixelated" }}
              />
            </div>

            {/* Color info & copy */}
            <div className="flex flex-col gap-4 px-5 py-5">
              {/* Swatch + values */}
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-xl shadow-md border border-zinc-700/50 shrink-0"
                  style={{ backgroundColor: pixelModal.hex }}
                />
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="font-mono text-xl font-bold text-zinc-100 tracking-wide">
                    {pixelModal.hex.toUpperCase()}
                  </span>
                  <span className="font-mono text-xs text-zinc-500">
                    rgb({pixelModal.rgb.r}, {pixelModal.rgb.g}, {pixelModal.rgb.b})
                  </span>
                  <span className="font-mono text-xs text-zinc-500">
                    {rgbToHslStr(pixelModal.rgb.r, pixelModal.rgb.g, pixelModal.rgb.b)}
                  </span>
                </div>
              </div>

              {/* Copy button */}
              <button
                onClick={handlePixelCopy}
                className={`flex items-center justify-center gap-2.5 w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 ${
                  pixelCopied
                    ? "bg-emerald-900/60 border border-emerald-700/60 text-emerald-400"
                    : "bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-500 text-zinc-200"
                }`}
              >
                {pixelCopied ? (
                  <><Check className="w-4 h-4" /> Copied!</>
                ) : (
                  <><Copy className="w-4 h-4" /> Copy HEX</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal Overlay */}
      {exportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 ease-out max-h-[90dvh]"
            role="dialog"
            aria-modal="true"
            aria-label={`Export as ${exportModal.formatName}`}
            data-testid="export-modal"
            data-export-format={exportModal.formatName}
          >
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                Export as {exportModal.formatName}
              </h3>
              <button 
                onClick={() => setExportModal(null)} 
                data-testid="export-modal-close"
                className="text-zinc-500 hover:text-zinc-200 transition-colors p-1 hover:bg-zinc-800 rounded-md"
              >
                 <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative bg-zinc-950 p-4 sm:p-6 overflow-y-auto max-h-[40vh] sm:max-h-[55vh] custom-scrollbar border-b border-zinc-800">
              <pre
                className="text-sm font-mono text-zinc-300 whitespace-pre-wrap break-all leading-relaxed"
                data-testid="export-modal-content"
              >
                {exportModal.content}
              </pre>
            </div>
            
            <div className="px-6 py-5 bg-zinc-900/50 flex flex-wrap justify-end gap-3 sm:gap-4">
              <button 
                onClick={handleModalCopy} 
                data-testid="export-modal-copy"
                className="flex items-center justify-center gap-2 font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-5 py-2.5 rounded-lg transition-colors border border-zinc-700 w-full sm:w-auto active:scale-95"
              >
                <Copy className="w-4 h-4" /> Copy Snippet
              </button>
              <button 
                onClick={handleModalDownload} 
                data-testid="export-modal-download"
                className="flex items-center justify-center gap-2 font-semibold bg-zinc-100 hover:bg-white text-zinc-900 px-5 py-2.5 rounded-lg transition-colors w-full sm:w-auto active:scale-95 shadow-sm"
              >
                <Download className="w-4 h-4" /> Download File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification System */}
      {toast && (
        <div 
          className={`fixed bottom-4 sm:bottom-8 right-4 sm:right-8 left-4 sm:left-auto px-4 sm:px-5 py-3 sm:py-4 rounded-xl shadow-2xl border text-sm font-semibold z-[110] flex items-center gap-3 animate-in fade-in slide-in-from-bottom-6 duration-300 ease-out fill-mode-both ${
            toast.type === "success" 
              ? "bg-emerald-950/90 border-emerald-900/50 text-emerald-400 backdrop-blur-md" 
              : "bg-red-950/90 border-red-900/50 text-red-500 backdrop-blur-md"
          }`}
        >
          {toast.type === "success" ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
