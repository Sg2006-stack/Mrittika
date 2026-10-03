"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Navigation } from "@/components/landing/navigation";
import { FooterSection } from "@/components/landing/footer-section";
import { useSoilData } from "@/hooks/use-soil-data";

type PageKind = "analytics" | "sensors" | "alerts";
type AnalysisResponse = {
  analysis: { severity: string; actions: Array<{ code: string }> };
  findings: Array<{ label: string; value: number | null; unit: string; status: string; message: string; severity: string }>;
  row_id: number | string | null;
};

const value = (reading: number | null, suffix = "") => reading === null ? "—" : `${reading}${suffix}`;

export function FocusedAnalysisPage({ kind }: { kind: PageKind }) {
  const { data, lastUpdated } = useSoilData();
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const title = kind === "analytics" ? "Read the pattern." : kind === "sensors" ? "Know the network." : "See what needs attention.";
  const eyebrow = kind === "analytics" ? "Analytics" : kind === "sensors" ? "Sensors" : "Alerts";
  const description = kind === "analytics"
    ? "Historical sensor readings from Supabase, organized for comparison over time."
    : kind === "sensors"
      ? "Current sensor values and connection state from the latest Supabase row."
      : "Live MITTI findings from the latest sensor snapshot. No motor or irrigation controls are shown.";

  useEffect(() => {
    if (kind !== "alerts") return;
    fetch("/api/soil-analysis", { cache: "no-store" })
      .then((response) => response.json())
      .then(setAnalysis)
      .catch(() => setAnalysis(null));
  }, [kind, lastUpdated]);

  const chartData = useMemo(() => [...data.readings].reverse(), [data.readings]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navigation />
      <section className="pt-40 pb-24 lg:pt-48">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-12 h-px bg-foreground/20" />{eyebrow}
          </div>
          <div className="grid lg:grid-cols-12 gap-8 items-end">
            <h1 className="lg:col-span-8 text-6xl md:text-7xl lg:text-[110px] font-display tracking-tight leading-[0.9]">
              {title.split(" ")[0]}<br /><span className="text-muted-foreground">{title.split(" ").slice(1).join(" ")}</span>
            </h1>
            <p className="lg:col-span-4 text-lg text-muted-foreground leading-relaxed">{description}</p>
          </div>

          {kind === "analytics" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-20">
                {[
                  ["Samples", `${data.readings.length}`],
                  ["Moisture", value(data.soil.moisture, "%")],
                  ["pH", value(data.soil.ph)],
                  ["Updated", lastUpdated?.toLocaleTimeString("en-GB") ?? "—"],
                ].map(([label, reading]) => <Metric key={label} label={label} value={reading} />)}
              </div>
              <div className="grid lg:grid-cols-2 gap-6 mt-6">
                <TrendChart title="Nutrients" data={chartData} lines={[
                  ["nitrogen", "#eca8d6"], ["phosphorus", "#9f8cff"], ["potassium", "#7dd3fc"],
                ]} />
                <TrendChart title="Environment" data={chartData} lines={[
                  ["moisture", "#f8d477"], ["temperature", "#7dd3fc"], ["humidity", "#eca8d6"],
                ]} />
              </div>
            </>
          )}

          {kind === "sensors" && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-20">
              {[
                ["Nitrogen", value(data.soil.nitrogen, " mg/kg"), "NPK sensor"],
                ["Phosphorus", value(data.soil.phosphorus, " mg/kg"), "NPK sensor"],
                ["Potassium", value(data.soil.potassium, " mg/kg"), "NPK sensor"],
                ["Moisture", value(data.soil.moisture, "%"), "Soil sensor"],
                ["Temperature", value(data.environment.temperature, "°C"), "ESP32"],
                ["Humidity", value(data.environment.humidity, "%"), "ESP32"],
                ["Pressure", value(data.environment.pressure, " hPa"), "ESP32"],
                ["Air quality", value(data.environment.airQuality), "ESP32"],
                ["NPK connection", data.devices.npkSensor, "Device status"],
              ].map(([label, reading, source]) => (
                <div key={label} className="border border-foreground/10 bg-foreground/[0.02] p-6">
                  <div className="text-xs font-mono text-muted-foreground uppercase mb-4">{source}</div>
                  <div className="text-4xl font-display">{reading}</div>
                  <div className="text-sm text-muted-foreground mt-2">{label}</div>
                </div>
              ))}
            </div>
          )}

          {kind === "alerts" && (
            <div className="mt-20 border border-foreground/10 bg-foreground/[0.02]">
              {analysis ? (
                <>
                  <div className="p-6 lg:p-8 border-b border-foreground/10 flex justify-between gap-4">
                    <div className="text-5xl font-display uppercase">{analysis.analysis.severity}</div>
                    <div className="text-xs font-mono text-muted-foreground">ROW {analysis.row_id ?? "—"}</div>
                  </div>
                  <div className="p-6 lg:p-8 grid md:grid-cols-2 gap-4">
                    {analysis.findings.map((finding) => (
                      <div key={finding.label} className="border border-foreground/10 p-5">
                        <div className="text-xs font-mono text-muted-foreground mb-2">{finding.label}</div>
                        <div className="mb-2">{finding.status}</div>
                        <div className="text-sm text-muted-foreground">{finding.message}</div>
                      </div>
                    ))}
                    <div className="md:col-span-2 border-t border-foreground/10 pt-5">
                      <div className="text-xs font-mono text-muted-foreground mb-3">MITTI ACTION CODES</div>
                      <div className="flex flex-wrap gap-2">{analysis.analysis.actions.map((action) => <span key={action.code} className="border border-foreground/15 px-3 py-2 text-xs font-mono">{action.code}</span>)}</div>
                    </div>
                  </div>
                </>
              ) : <div className="p-8 text-sm font-mono text-muted-foreground">Loading live findings…</div>}
            </div>
          )}
        </div>
      </section>
      <FooterSection />
    </main>
  );
}

function Metric({ label, value: reading }: { label: string; value: string }) {
  return <div className="border border-foreground/10 bg-foreground/[0.02] p-6"><div className="text-3xl font-display">{reading}</div><div className="text-xs font-mono text-muted-foreground mt-2 uppercase">{label}</div></div>;
}

function TrendChart({ title, data, lines }: { title: string; data: Array<Record<string, number | string | null>>; lines: Array<[string, string]> }) {
  return <div className="border border-foreground/10 bg-foreground/[0.02] p-6 lg:p-8"><div className="text-lg mb-6">{title}</div><div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={data}><CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} /><XAxis dataKey="timestamp" tick={{ fill: "rgba(255,255,255,.45)", fontSize: 11 }} tickLine={false} axisLine={false} /><YAxis tick={{ fill: "rgba(255,255,255,.45)", fontSize: 11 }} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid rgba(255,255,255,.16)" }} />{lines.map(([key, color]) => <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} connectNulls={false} />)}</LineChart></ResponsiveContainer></div></div>;
}
