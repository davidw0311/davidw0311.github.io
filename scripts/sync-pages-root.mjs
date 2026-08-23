import { copyFile, cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const exportRoot = path.join(projectRoot, "out");
const generatedAssets = path.join(projectRoot, "public", "assets", "generated");
const textExtensions = new Set([".css", ".html", ".js", ".txt", ".xml"]);

async function normalizeTextFile(filePath) {
  if (!textExtensions.has(path.extname(filePath))) return;

  const content = await readFile(filePath, "utf8");
  const normalized = content.replace(/[\t ]+$/gm, "");
  if (normalized !== content) await writeFile(filePath, normalized);
}

async function normalizeTextTree(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) await normalizeTextTree(entryPath);
    else await normalizeTextFile(entryPath);
  }
}

for (const entry of await readdir(exportRoot, { withFileTypes: true })) {
  const source = path.join(exportRoot, entry.name);
  const destination = path.join(projectRoot, entry.name);

  if (entry.isFile()) {
    await copyFile(source, destination);
    await normalizeTextFile(destination);
    continue;
  }

  if (entry.name === "assets" || entry.name === "web_dev_practice") continue;

  await rm(destination, { recursive: true, force: true });
  await cp(source, destination, { recursive: true });
  await normalizeTextTree(destination);
}

await mkdir(path.join(projectRoot, "assets"), { recursive: true });
await rm(path.join(projectRoot, "assets", "generated"), { recursive: true, force: true });
await cp(generatedAssets, path.join(projectRoot, "assets", "generated"), { recursive: true });
await writeFile(path.join(projectRoot, ".nojekyll"), "");

console.log("Synchronized the static export for branch-based GitHub Pages.");
