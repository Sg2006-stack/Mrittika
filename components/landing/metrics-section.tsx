"use client";

import { useEffect, useState, useRef } from "react";
import { useSoilData } from "@/hooks/use-soil-data";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const metrics = [
  { 
    value: null, 
    suffix: "%", 
    prefix: "",
    label: "Soil moisture",
    sublabel: "live field reading",
  },
  { 
    value: null, 
    suffix: "%", 
    prefix: "",
    label: "Air humidity",
    sublabel: "current environment",
  },
  { 
    value: null,
    suffix: "°C", 
    prefix: "",
    label: "Soil temperature",
    sublabel: "current sensor reading",
  },
];

function AnimatedNumber({ end, suffix = "", prefix = "" }: { end: number | null; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const [isScrambling, setIsScrambling] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 2500;
          const startTime = performance.now();
          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            if (end !== null) setCount(Math.floor(eased * end));
            setIsScrambling(progress < 0.8);
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, hasAnimated]);

  const displayValue = count.toLocaleString();

  return (
    <div ref={ref} className="inline-flex items-baseline">
      <span className="text-muted-foreground mr-1">{prefix}</span>
      <span className="tabular-nums">
        {end === null ? "—" : displayValue.split("").map((char, i) => (
          <span
            key={i}
            className={`inline-block transition-all duration-150 ${
              isScrambling && char !== "," ? "blur-[1px]" : ""
            }`}
          >
            {char}
          </span>
        ))}
      </span>
      <span className="text-muted-foreground">{suffix}</span>
    </div>
  );
}

function GridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      ctx.clearRect(0, 0, width, height);
      const gridSize = 60;
      const time = timeRef.current;
      for (let x = 0; x < width; x += gridSize) {
        for (let y = 0; y < height; y += gridSize) {
          const wave = Math.sin(x * 0.01 + y * 0.01 + time) * 0.5 + 0.5;
          const size = 1 + wave * 2;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
          ctx.fill();
        }
      }
      const pulseY = (time * 30) % height;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, pulseY);
      ctx.lineTo(width, pulseY);
      ctx.stroke();
      timeRef.current += 0.02;
      frameRef.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

function DotGraph({
  color = "white",
  height = 32,
  freq1 = 0.35,
  freq2 = 0.12,
  freqT = 0.7,
  speed = 0.025,
  baseline = 0.3,
  amplitude = 0.5,
}: {
  color?: string;
  height?: number;
  freq1?: number;
  freq2?: number;
  freqT?: number;
  speed?: number;
  baseline?: number;
  amplitude?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const timeRef = useRef(Math.random() * 100);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = canvas.offsetWidth || 300;
    const H = height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const render = () => {
      ctx.clearRect(0, 0, W, H);
      const t = timeRef.current;
      const cols = Math.floor(W / 8);

      for (let i = 0; i < cols; i++) {
        const raw = baseline + amplitude * Math.sin(i * freq1 + t) * Math.cos(i * freq2 + t * freqT);
        const v = Math.max(0, Math.min(1, raw));
        const dotY = H - 4 - v * (H - 8);
        const x = i * 8 + 4;
        const alpha = 0.15 + v * 0.55;
        const r = 1.5 + v * 1.2;

        ctx.beginPath();
        ctx.arc(x, dotY, r, 0, Math.PI * 2);
        ctx.fillStyle = color === "green"
          ? `rgba(236, 168, 214, ${alpha})`
          : `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      }

      timeRef.current += speed;
      frameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameRef.current);
  }, [color, height, freq1, freq2, freqT, speed, baseline, amplitude]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: `${height}px`, display: "block" }}
    />
  );
}

function HistoryChart({
  data,
  lines,
  unit,
}: {
  data: Array<Record<string, number | string | null>>;
  lines: Array<{ key: string; label: string; color: string }>;
  unit: string;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={[...data].reverse()} margin={{ top: 12, right: 12, left: -24, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis
            dataKey="timestamp"
            tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={42}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--background))",
              border: "1px solid rgba(255,255,255,0.16)",
              borderRadius: 0,
              color: "hsl(var(--foreground))",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
            }}
            formatter={(value, name) => [
              value === null || value === undefined ? "—" : `${value} ${unit}`,
              lines.find((line) => line.key === name)?.label ?? name,
            ]}
          />
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.key}
              stroke={line.color}
              strokeWidth={2}
              dot={{ r: 2, fill: line.color, strokeWidth: 0 }}
              activeDot={{ r: 4 }}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function readingValue(value: number | null, suffix = "") {
  return value === null ? "—" : `${value}${suffix}`;
}

export function MetricsSection() {
  const { data } = useSoilData();
  const [time, setTime] = useState<Date | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const liveMetrics = [
    { value: data.soil.moisture, suffix: "%", prefix: "", label: "Soil moisture", sublabel: "live field reading" },
    { value: data.environment.humidity, suffix: "%", prefix: "", label: "Air humidity", sublabel: "current environment" },
    { value: data.soil.temperature, suffix: "°C", prefix: "", label: "Soil temperature", sublabel: "current sensor reading" },
  ];

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="metrics" ref={sectionRef} className="relative py-32 lg:py-40 overflow-hidden">
      <GridBackground />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="grid lg:grid-cols-12 gap-8 mb-20 lg:mb-32">
          <div className="lg:col-span-8 lg:col-start-1">
            <div className="flex items-center gap-4 mb-6">
              <span className="flex items-center gap-2 px-3 py-1 bg-[#eca8d6]/10 text-[#eca8d6] text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-[#eca8d6] animate-pulse" />
                LIVE
              </span>
              <span className="text-sm font-mono text-muted-foreground">
                {time ? `${time.toLocaleTimeString("en-GB")} UTC` : ""}
              </span>
            </div>

            <h2 className={`text-6xl md:text-7xl lg:text-[140px] font-display tracking-tight leading-[0.95] transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}>
              Real-time
              <br />
              <span className="text-muted-foreground">soil metrics.</span>
            </h2>
          </div>
        </div>

        {/* Organic graph image */}
        <div className={`w-full mb-0 transition-all duration-1000 delay-200 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}>
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/real-time-graph-INFmn3u0MlUwvNPynoIhwxtPaPjxM5.png"
            alt=""
            aria-hidden="true"
            className="w-full h-auto object-cover"
          />
        </div>

        <div className={`grid lg:grid-cols-2 gap-6 mt-6 transition-all duration-1000 delay-300 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          <div className="border border-foreground/10 bg-foreground/[0.02] p-6 lg:p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="text-lg text-foreground mb-1">Recent soil history</div>
                <div className="text-xs text-muted-foreground font-mono">last {data.readings.length} recorded samples</div>
              </div>
              <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-[10px] font-mono text-muted-foreground">
                <span className="text-[#eca8d6]">N</span>
                <span className="text-[#9f8cff]">P</span>
                <span className="text-[#7dd3fc]">K</span>
                <span className="text-[#f8d477]">Moisture</span>
              </div>
            </div>
            {data.readings.length > 0 ? (
              <HistoryChart
                data={data.readings}
                unit="mg/kg"
                lines={[
                  { key: "nitrogen", label: "Nitrogen", color: "#eca8d6" },
                  { key: "phosphorus", label: "Phosphorus", color: "#9f8cff" },
                  { key: "potassium", label: "Potassium", color: "#7dd3fc" },
                  { key: "moisture", label: "Moisture", color: "#f8d477" },
                ]}
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground font-mono">
                Waiting for recent soil samples
              </div>
            )}
          </div>

          <div className="border border-foreground/10 bg-foreground/[0.02] p-6 lg:p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="text-lg text-foreground mb-1">Recent environment history</div>
                <div className="text-xs text-muted-foreground font-mono">sensor records from Supabase</div>
              </div>
              <div className="flex gap-3 text-[10px] font-mono text-muted-foreground">
                <span className="text-[#eca8d6]">Humidity</span>
                <span className="text-[#7dd3fc]">Temperature</span>
              </div>
            </div>
            {data.readings.length > 0 ? (
              <HistoryChart
                data={data.readings}
                unit=""
                lines={[
                  { key: "humidity", label: "Humidity", color: "#eca8d6" },
                  { key: "temperature", label: "Temperature", color: "#7dd3fc" },
                ]}
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground font-mono">
                Waiting for recent environment samples
              </div>
            )}
          </div>
        </div>

        <div className={`mt-6 border border-foreground/10 bg-foreground/[0.02] transition-all duration-1000 delay-400 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          <div className="p-6 lg:p-8 border-b border-foreground/10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-lg text-foreground mb-1">Recent sensor data</div>
              <div className="text-xs text-muted-foreground font-mono">
                Latest readings received from the connected field sensors
              </div>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {data.readings.length} samples
            </span>
          </div>

          {data.readings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="border-b border-foreground/10 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-6 lg:px-8 py-4 font-normal">Timestamp</th>
                    <th className="px-4 py-4 font-normal">N</th>
                    <th className="px-4 py-4 font-normal">P</th>
                    <th className="px-4 py-4 font-normal">K</th>
                    <th className="px-4 py-4 font-normal">Moisture</th>
                    <th className="px-4 py-4 font-normal">Soil temp.</th>
                    <th className="px-6 lg:px-8 py-4 font-normal">Humidity</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-mono">
                  {data.readings.map((reading, index) => (
                    <tr
                      key={`${reading.timestamp}-${index}`}
                      className="border-b border-foreground/10 last:border-b-0 hover:bg-foreground/[0.04] transition-colors"
                    >
                      <td className="px-6 lg:px-8 py-5 text-foreground">{reading.timestamp}</td>
                      <td className="px-4 py-5 text-muted-foreground">{readingValue(reading.nitrogen, " mg/kg")}</td>
                      <td className="px-4 py-5 text-muted-foreground">{readingValue(reading.phosphorus, " mg/kg")}</td>
                      <td className="px-4 py-5 text-muted-foreground">{readingValue(reading.potassium, " mg/kg")}</td>
                      <td className="px-4 py-5 text-muted-foreground">{readingValue(reading.moisture, "%")}</td>
                      <td className="px-4 py-5 text-muted-foreground">{readingValue(reading.temperature, "°C")}</td>
                      <td className="px-6 lg:px-8 py-5 text-muted-foreground">{readingValue(reading.humidity, "%")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-sm text-muted-foreground font-mono">
              Waiting for sensor data from Supabase
            </div>
          )}
        </div>

        {/* Metrics grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Large metric */}
          <div className={`lg:col-span-1 bg-foreground/[0.02] border border-foreground/10 p-10 lg:p-14 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          }`}>
            <div className="text-4xl md:text-5xl lg:text-6xl font-display tracking-tight mb-4 whitespace-nowrap overflow-hidden">
              <AnimatedNumber end={liveMetrics[0].value} suffix={liveMetrics[0].suffix} prefix={liveMetrics[0].prefix} />
            </div>
            <div className="mb-6">
              <DotGraph color="white" height={36} freq1={0.28} freq2={0.09} freqT={0.5} speed={0.018} baseline={0.35} amplitude={0.55} />
            </div>
            <div className="text-lg text-foreground mb-2">{liveMetrics[0].label}</div>
            <div className="text-sm text-muted-foreground font-mono">{liveMetrics[0].sublabel}</div>
          </div>

          {/* Metrics */}
          {liveMetrics.slice(1).map((metric, index) => (
            <div
              key={metric.label}
              className={`bg-foreground/[0.02] border border-foreground/10 p-8 flex flex-col items-start justify-between gap-6 transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
              style={{ transitionDelay: `${(index + 1) * 100}ms` }}
            >
              <div className="w-full">
                <div className="text-sm text-muted-foreground font-mono mb-2">{metric.sublabel}</div>
                <div className="text-base text-foreground mb-3">{metric.label}</div>
                <DotGraph
                  color={index === 0 ? "green" : "white"}
                  height={24}
                  freq1={index === 0 ? 0.45 : 0.22}
                  freq2={index === 0 ? 0.18 : 0.07}
                  freqT={index === 0 ? 1.1 : 0.4}
                  speed={index === 0 ? 0.032 : 0.015}
                  baseline={index === 0 ? 0.4 : 0.25}
                  amplitude={index === 0 ? 0.45 : 0.6}
                />
              </div>
              <div className="text-3xl md:text-4xl lg:text-5xl font-display tracking-tight w-full">
                <AnimatedNumber end={metric.value} suffix={metric.suffix} prefix={metric.prefix} />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom ticker */}
        <div className={`mt-16 pt-8 border-t border-foreground/10 flex flex-wrap items-center gap-x-12 gap-y-4 text-sm font-mono text-muted-foreground transition-all duration-1000 delay-500 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}>
          <span>N {data.soil.nitrogen === null ? "—" : `${data.soil.nitrogen} mg/kg`}</span>
          <span>P {data.soil.phosphorus === null ? "—" : `${data.soil.phosphorus} mg/kg`}</span>
          <span>K {data.soil.potassium === null ? "—" : `${data.soil.potassium} mg/kg`}</span>
          <span>pH {data.soil.ph === null ? "—" : data.soil.ph}</span>
          <span className="text-foreground">NORMAL field status</span>
        </div>
      </div>
    </section>
  );
}
