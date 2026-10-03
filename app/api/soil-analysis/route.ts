import { spawn } from "node:child_process";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const projectPath = process.env.MITTI_PROJECT_PATH ?? "D:\\mitti_v3\\mitti_v3";
  const pythonPath = process.env.MITTI_PYTHON_PATH ?? "python";

  return await new Promise<Response>((resolve) => {
    const child = spawn(pythonPath, ["web_analysis.py"], {
      cwd: projectPath,
      env: {
        ...process.env,
        SUPABASE_URL: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_KEY: process.env.SUPABASE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      },
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", (error) => resolve(NextResponse.json({ error: error.message }, { status: 503 })));
    child.on("close", (code) => {
      if (code !== 0) {
        resolve(NextResponse.json({ error: stderr || stdout || "Soil analysis process failed." }, { status: 502 }));
        return;
      }
      try {
        resolve(NextResponse.json(JSON.parse(stdout)));
      } catch {
        resolve(NextResponse.json({ error: "Soil analysis returned invalid JSON." }, { status: 502 }));
      }
    });
  });
}
