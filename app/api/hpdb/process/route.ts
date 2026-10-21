import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function runPython(
  scriptPath: string,
  args: string[],
  cwd: string,
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const python =
      process.env.PYTHON_BIN ||
      (process.platform === "win32" ? "python" : "python3");

    const child = spawn(python, [scriptPath, ...args], {
      cwd,
      windowsHide: true,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: "1",
      },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.once("error", reject);
    child.once("close", (code) => {
      resolve({
        code: code ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

function jsonField(formData: FormData, name: string) {
  const value = formData.get(name);
  if (!value) return {};

  try {
    return JSON.parse(String(value));
  } catch {
    throw new Error(`Field ${name} bukan JSON yang valid.`);
  }
}

async function firstExisting(paths: string[]) {
  for (const candidate of paths) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Lanjutkan ke kandidat berikutnya.
    }
  }
  return null;
}

export async function POST(request: Request) {
  const projectRoot = process.cwd();
  const scriptsDirectory = path.join(projectRoot, "scripts");
  const temporaryDirectory = await fs.mkdtemp(
    path.join(os.tmpdir(), "hpdb-process-"),
  );

  try {
    const formData = await request.formData();
    const kmz = formData.get("kmz");

    if (!(kmz instanceof File)) {
      return NextResponse.json(
        { error: "File KMZ wajib diunggah." },
        { status: 400 },
      );
    }

    const scriptPath = path.join(scriptsDirectory, "run_hpdb.py");
    const templatePath = await firstExisting([
      path.join(scriptsDirectory, "HPDB.xlsx"),
      path.join(projectRoot, "HPDB.xlsx"),
      path.join(projectRoot, "public", "HPDB.xlsx"),
    ]);

    if (!templatePath) {
      return NextResponse.json(
        {
          error:
            "Template HPDB.xlsx tidak ditemukan. Letakkan di folder scripts/HPDB.xlsx.",
        },
        { status: 500 },
      );
    }

    try {
      await fs.access(scriptPath);
    } catch {
      return NextResponse.json(
        {
          error:
            "scripts/run_hpdb.py tidak ditemukan. Letakkan HPDB.py dan run_hpdb.py di folder scripts/.",
        },
        { status: 500 },
      );
    }

    const inputPath = path.join(temporaryDirectory, "input.kmz");
    const outputPath = path.join(temporaryDirectory, "HPDB_output.xlsx");

    await fs.writeFile(inputPath, Buffer.from(await kmz.arrayBuffer()));

    const manual = {
      region: String(formData.get("region") || ""),
      olt: String(formData.get("olt") || ""),
      cluster_name: String(formData.get("cluster_name") || ""),
      cluster_id: String(formData.get("cluster_id") || ""),
      olt_code: String(formData.get("olt_code") || ""),
      location: jsonField(formData, "location"),
      roads: {},
      fdt_mapping: jsonField(formData, "fdt_mapping"),
    };

    const result = await runPython(
      scriptPath,
      [
        "--kmz",
        inputPath,
        "--template",
        templatePath,
        "--output",
        outputPath,
        "--manual",
        JSON.stringify(manual),
      ],
      scriptsDirectory,
    );

    if (result.code !== 0) {
      const detail = (result.stderr || result.stdout || "Python gagal memproses HPDB.").trim();
      return NextResponse.json(
        { error: detail },
        { status: 422 },
      );
    }

    let generatedOutputPath = outputPath;
    try {
      await fs.access(generatedOutputPath);
    } catch {
      const temporaryFiles = await fs.readdir(temporaryDirectory);
      const alternativeOutput = temporaryFiles.find((file) =>
        /\.xlsx$/i.test(file),
      );

      if (alternativeOutput) {
        generatedOutputPath = path.join(
          temporaryDirectory,
          alternativeOutput,
        );
      } else {
        const diagnostics = [
          "Python selesai tetapi HPDB_output.xlsx tidak dibuat.",
          result.stdout.trim() ? `stdout: ${result.stdout.trim()}` : "",
          result.stderr.trim() ? `stderr: ${result.stderr.trim()}` : "",
          `Script: ${scriptPath}`,
          `Template: ${templatePath}`,
          `Output yang diharapkan: ${outputPath}`,
        ].filter(Boolean).join("\n");

        return NextResponse.json(
          { error: diagnostics },
          { status: 500 },
        );
      }
    }

    const output = await fs.readFile(generatedOutputPath);

    return new Response(output, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="HPDB_output.xlsx"',
        "Content-Length": String(output.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("HPDB process error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server HPDB.",
      },
      { status: 500 },
    );
  } finally {
    await fs.rm(temporaryDirectory, {
      recursive: true,
      force: true,
    });
  }
}
