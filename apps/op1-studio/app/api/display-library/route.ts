import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

type DisplayFile = { file: string; contents: string };

async function collect(directory: string, files: DisplayFile[]) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await collect(entryPath, files);
      continue;
    }
    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== ".svg") continue;
    const contents = await readFile(entryPath, "utf8");
    if (contents.length > 2_000_000) continue;
    files.push({ file: entry.name, contents });
  }
}

export async function GET(request: Request) {
  const root = new URL(request.url).searchParams.get("root");
  if (!root || root.trim().length === 0) return NextResponse.json([]);
  const directory = path.resolve(root, "images", "original");
  const files: DisplayFile[] = [];
  try {
    await collect(directory, files);
    files.sort((left, right) => left.file.localeCompare(right.file));
    return NextResponse.json(files);
  } catch {
    return NextResponse.json([]);
  }
}
