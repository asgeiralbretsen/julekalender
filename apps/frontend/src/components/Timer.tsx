import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type TimerProps = {
  mode: "up" | "down";
  durationMs?: number;
  startFromMs?: number;
  running?: boolean;
  isFinished?: boolean;
  onFinished?: () => void;
  onTick?: (ms: number) => void;
  className?: string;
  format?: (ms: number) => string;
};

const defaultFormat = (ms: number) => {
  const sign = ms < 0 ? "-" : "";
  const abs = Math.max(0, Math.abs(ms));
  const totalSeconds = Math.floor(abs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${sign}${hours}:${mm}:${ss}` : `${sign}${mm}:${ss}`;
};

export const Timer: React.FC<TimerProps> = ({
  mode,
  durationMs,
  startFromMs = 0,
  running = true,
  isFinished,
  onFinished,
  onTick,
  className,
  format = defaultFormat,
}) => {
  const [now, setNow] = useState<number>(() => Date.now());
  const startRef = useRef<number | null>(null);
  const accRef = useRef<number>(0);
  const finishedRef = useRef<boolean>(false);
  const intervalRef = useRef<number | null>(null);
  const lastTickSecRef = useRef<number>(-1);

  const currentMs = useMemo(() => {
    const t0 = startRef.current;
    if (t0 == null) return mode === "down" ? (durationMs ?? 0) - accRef.current : startFromMs + accRef.current;
    const elapsed = now - t0 + accRef.current;
    return mode === "down" ? Math.max(0, (durationMs ?? 0) - elapsed) : Math.max(0, startFromMs + elapsed);
  }, [now, mode, durationMs, startFromMs]);

  useEffect(() => {
    if (running && !finishedRef.current) {
      if (startRef.current == null) startRef.current = Date.now();
      if (intervalRef.current == null) {
        intervalRef.current = window.setInterval(() => setNow(Date.now()), 100);
      }
    } else {
      if (startRef.current != null) {
        accRef.current += Date.now() - startRef.current;
        startRef.current = null;
      }
      if (intervalRef.current != null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current != null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running]);

  useEffect(() => {
    onTick?.(currentMs);
    const s = Math.floor(currentMs / 1000);
    if (s !== lastTickSecRef.current) lastTickSecRef.current = s;
  }, [currentMs, onTick]);

  useEffect(() => {
    if (finishedRef.current) return;
    const internallyDone = mode === "down" && currentMs <= 0;
    if (internallyDone || isFinished) {
      finishedRef.current = true;
      if (intervalRef.current != null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      startRef.current = null;
      onFinished?.();
    }
  }, [currentMs, isFinished, mode, onFinished]);

  const label = useMemo(() => format(currentMs), [currentMs, format]);

  return (
    <div className={className}>
      <div className="font-mono text-2xl">{label}</div>
    </div>
  );
};

const TimerPlayground: React.FC = () => {
  const [downRunning, setDownRunning] = useState(true);
  const [upRunning, setUpRunning] = useState(true);
  const [downFinished, setDownFinished] = useState(false);

  const handleFinished = useCallback(() => {
    alert("Timer finished!");
  }, []);

  return (
    <div className="p-6 grid gap-8 md:grid-cols-2">
      <div className="p-4 rounded-2xl shadow bg-white/50 dark:bg-neutral-900/40">
        <h2 className="text-xl font-semibold mb-2">Nedtelling (25s)</h2>
        <Timer
          mode="down"
          durationMs={25_000}
          running={downRunning}
          isFinished={downFinished}
          onFinished={handleFinished}
        />
        <div className="mt-4 flex gap-2">
          <button className="px-3 py-1 rounded-xl shadow" onClick={() => setDownRunning(r => !r)}>{downRunning ? "Pause" : "Fortsett"}</button>
          <button className="px-3 py-1 rounded-xl shadow" onClick={() => setDownFinished(true)}>Tving ferdig</button>
          <button className="px-3 py-1 rounded-xl shadow" onClick={() => { setDownFinished(false); setDownRunning(true); }}>Tilbakestill</button>
        </div>
      </div>

      <div className="p-4 rounded-2xl shadow bg-white/50 dark:bg-neutral-900/40">
        <h2 className="text-xl font-semibold mb-2">Tell opp</h2>
        <Timer
          mode="up"
          startFromMs={0}
          running={upRunning}
          onFinished={() => console.log("Up finished (by prop)")}
        />
        <div className="mt-4 flex gap-2">
          <button className="px-3 py-1 rounded-xl shadow" onClick={() => setUpRunning(r => !r)}>{upRunning ? "Pause" : "Fortsett"}</button>
        </div>
      </div>
    </div>
  );
};

export default TimerPlayground;
