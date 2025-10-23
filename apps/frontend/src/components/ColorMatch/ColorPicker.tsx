import { useRef, useState, useEffect } from "react";

// ColorPickerNoEyedropper
// A self-contained React component that provides a color picker UI WITHOUT
// using the native <input type="color"> (so browsers won't show an eyedropper).
// Features:
// - SV (saturation/value) canvas square
// - Hue slider (canvas)
// - Hex input and quick swatches
// - onChange returns hex color (#rrggbb)
// - Accessible-ish controls (keyboard on inputs)

// Usage:
// <ColorPickerNoEyedropper value="#ff00aa" onChange={(hex)=>{}} />

function clamp(v: number, a = 0, b = 1): number {
  return Math.min(b, Math.max(a, v));
}

function hsvToRgb(
  h: number,
  s: number,
  v: number
): { r: number; g: number; b: number } {
  // h in [0,360), s,v in [0,1]
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }): string {
  return (
    "#" +
    [r, g, b]
      .map((n) => {
        const s = n.toString(16).toUpperCase();
        return s.length === 1 ? "0" + s : s;
      })
      .join("")
  );
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.replace(/^#/, "");
  if (![3, 6].includes(m.length)) return null;
  if (m.length === 3)
    return {
      r: parseInt(m[0] + m[0], 16),
      g: parseInt(m[1] + m[1], 16),
      b: parseInt(m[2] + m[2], 16),
    };
  return {
    r: parseInt(m.slice(0, 2), 16),
    g: parseInt(m.slice(2, 4), 16),
    b: parseInt(m.slice(4, 6), 16),
  };
}

function rgbToHsv(
  r: number,
  g: number,
  b: number
): { h: number; s: number; v: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const v = max;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (d === 0) h = 0;
  else if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  return { h, s, v };
}

interface ColorPickerProps {
  value?: string;
  onChange?: (color: string) => void;
}

export default function ColorPickerNoEyedropper({
  value = "#FF0000",
  onChange,
}: ColorPickerProps) {
  // Internal HSV representation to drive the UI
  const rgb = hexToRgb(value) || { r: 255, g: 0, b: 0 };
  const initialHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);

  const [hue, setHue] = useState(initialHsv.h); // 0-360
  const [sat, setSat] = useState(initialHsv.s); // 0-1
  const [val, setVal] = useState(initialHsv.v); // 0-1
  const [hex, setHex] = useState(value.toUpperCase());

  const svRef = useRef<HTMLCanvasElement>(null);
  const hueRef = useRef<HTMLCanvasElement>(null);
  const svPointerRef = useRef<HTMLDivElement>(null);
  const huePointerRef = useRef<HTMLDivElement>(null);

  // Draw SV square (color square) and hue slider
  useEffect(() => {
    drawSV();
  }, [hue, sat, val]);

  useEffect(() => {
    drawHue();
  }, [hue]);

  useEffect(() => {
    const h = clamp(hue, 0, 360);
    const s = clamp(sat, 0, 1);
    const v = clamp(val, 0, 1);
    const rgb = hsvToRgb(h, s, v);
    const newHex = rgbToHex(rgb);
    setHex(newHex);
    if (onChange) onChange(newHex);
  }, [hue, sat, val]);

  function drawSV() {
    const canvas = svRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width, height } = canvas;

    // base: pure hue
    const hueRgb = hsvToRgb(hue, 1, 1);
    ctx.fillStyle = `rgb(${hueRgb.r}, ${hueRgb.g}, ${hueRgb.b})`;
    ctx.fillRect(0, 0, width, height);

    // saturation gradient (white -> transparent)
    const satGrad = ctx.createLinearGradient(0, 0, width, 0);
    satGrad.addColorStop(0, "rgba(255,255,255,1)");
    satGrad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = satGrad;
    ctx.fillRect(0, 0, width, height);

    // value gradient (transparent -> black)
    const valGrad = ctx.createLinearGradient(0, 0, 0, height);
    valGrad.addColorStop(0, "rgba(0,0,0,0)");
    valGrad.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = valGrad;
    ctx.fillRect(0, 0, width, height);

    // draw pointer
    const x = sat * width;
    const y = (1 - val) * height;
    if (svPointerRef.current) {
      svPointerRef.current.style.transform = `translate(${x - 8}px, ${y - 8}px)`;
    }
  }

  function drawHue() {
    const canvas = hueRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width, height } = canvas;

    const grad = ctx.createLinearGradient(0, 0, width, 0);
    // add stops for hue spectrum
    const stops = [
      [0, "#FF0000"],
      [0.17, "#FFFF00"],
      [0.33, "#00FF00"],
      [0.5, "#00FFFF"],
      [0.67, "#0000FF"],
      [0.83, "#FF00FF"],
      [1, "#FF0000"],
    ];
    stops.forEach(([pos, col]) =>
      grad.addColorStop(pos as number, col as string)
    );
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // pointer position
    const x = (hue / 360) * width;
    if (huePointerRef.current) {
      huePointerRef.current.style.transform = `translate(${x - 8}px, -6px)`;
    }
  }

  // Mouse / touch handlers for SV square
  function handleSvPointerDown(
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) {
    e.preventDefault();
    if (!svRef.current) return;
    const rect = svRef.current.getBoundingClientRect();
    const move = (evt: MouseEvent | TouchEvent) => {
      const clientX = (evt as TouchEvent).touches
        ? (evt as TouchEvent).touches[0].clientX
        : (evt as MouseEvent).clientX;
      const clientY = (evt as TouchEvent).touches
        ? (evt as TouchEvent).touches[0].clientY
        : (evt as MouseEvent).clientY;
      const x = clamp(clientX - rect.left, 0, rect.width);
      const y = clamp(clientY - rect.top, 0, rect.height);
      const newSat = x / rect.width;
      const newVal = 1 - y / rect.height;

      setSat(newSat);
      setVal(newVal);

      // Update pointer position immediately
      if (svPointerRef.current) {
        svPointerRef.current.style.transform = `translate(${x - 8}px, ${y - 8}px)`;
      }
    };
    move(e.nativeEvent);
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", up);
  }

  // Mouse / touch handlers for Hue slider
  function handleHuePointerDown(
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) {
    e.preventDefault();
    if (!hueRef.current) return;
    const rect = hueRef.current.getBoundingClientRect();
    const move = (evt: MouseEvent | TouchEvent) => {
      const clientX = (evt as TouchEvent).touches
        ? (evt as TouchEvent).touches[0].clientX
        : (evt as MouseEvent).clientX;
      const x = clamp(clientX - rect.left, 0, rect.width);
      const newHue = (x / rect.width) * 360;

      setHue(newHue);

      // Update pointer position immediately
      if (huePointerRef.current) {
        huePointerRef.current.style.transform = `translate(${x - 8}px, -6px)`;
      }
    };
    move(e.nativeEvent);
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", up);
  }

  return (
    <div className="">
      <div className="flex items-center justify-between mb-3"></div>

      <div className="flex flex-col gap-4">
        <div className="relative">
          <canvas
            ref={svRef}
            width={200}
            height={200}
            className="w-48 h-48 rounded-md cursor-crosshair border"
            onMouseDown={handleSvPointerDown}
            onTouchStart={handleSvPointerDown}
            aria-label="Saturation and value"
            role="slider"
          />
          <div
            ref={svPointerRef}
            className="absolute w-4 h-4 rounded-full ring-2 ring-white border top-0 left-0 pointer-events-none"
            style={{ transform: "translate(-8px, -8px)" }}
          />
        </div>

        <div className="flex flex-col items-center">
          <div className="relative">
            <canvas
              ref={hueRef}
              width={180}
              height={16}
              className="w-44 h-4 rounded-md border"
              onMouseDown={handleHuePointerDown}
              onTouchStart={handleHuePointerDown}
              aria-label="Hue"
              role="slider"
            />
            <div
              ref={huePointerRef}
              className="absolute w-4 h-6 rounded-sm ring-2 ring-white border -top-1 pointer-events-none"
              style={{ left: 0, transform: "translate(-8px, -6px)" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
