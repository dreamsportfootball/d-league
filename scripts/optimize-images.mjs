import { mkdir, readFile, readdir, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const REPORT_PATH = path.join(ROOT_DIR, 'image-optimization-report.json');
const RASTER_PATTERN = /\.(png|jpe?g)$/i;

const toPosixPath = (value) => value.split(path.sep).join('/');

const getProfile = (relativePath) => {
  const normalized = toPosixPath(relativePath).toLowerCase();

  if (normalized.includes('/teams/')) {
    return { maxWidth: 512, webp: { lossless: true, effort: 6 } };
  }

  if (normalized.includes('/players/')) {
    return { maxWidth: 640, webp: { quality: 84, alphaQuality: 96, effort: 5 } };
  }

  if (normalized.includes('mobile')) {
    return { maxWidth: 960, webp: { quality: 86, alphaQuality: 96, effort: 5 } };
  }

  if (
    normalized.includes('/cup/') ||
    normalized.includes('/aboutpage/') ||
    normalized.includes('/news/') ||
    normalized.includes('/media/') ||
    normalized.includes('/albums/')
  ) {
    return { maxWidth: 1600, webp: { quality: 80, alphaQuality: 96, effort: 5 } };
  }

  if (normalized.includes('poster') || normalized.includes('banner')) {
    return { maxWidth: 1920, webp: { quality: 88, alphaQuality: 98, effort: 5 } };
  }

  return { maxWidth: 1920, webp: { quality: 82, alphaQuality: 96, effort: 5 } };
};

const collectImages = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectImages(absolutePath));
    } else if (entry.isFile() && RASTER_PATTERN.test(entry.name)) {
      files.push(absolutePath);
    }
  }

  return files;
};

const processWithConcurrency = async (items, concurrency, worker) => {
  const queue = items.slice();
  const results = [];

  const runners = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) return;
      results.push(await worker(item));
    }
  });

  await Promise.all(runners);
  return results;
};

export const optimizeImages = async () => {
  let sharp;
  try {
    ({ default: sharp } = await import('sharp'));
  } catch {
    const report = {
      optimized: false,
      reason: 'sharp is not installed',
      generatedAt: new Date().toISOString(),
      files: [],
    };
    await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.warn('[images] sharp is unavailable; original images will be used');
    return false;
  }

  const files = await collectImages(PUBLIC_DIR);
  let originalBytes = 0;
  let optimizedBytes = 0;

  const results = await processWithConcurrency(files, 4, async (sourcePath) => {
    const relativePath = path.relative(PUBLIC_DIR, sourcePath);
    const outputPath = sourcePath.replace(RASTER_PATTERN, '.webp');
    const temporaryPath = `${outputPath}.tmp`;
    const sourceStats = await stat(sourcePath);
    const profile = getProfile(relativePath);

    const sourceBuffer = await readFile(sourcePath);
    const pipeline = sharp(sourceBuffer, { failOn: 'none', sequentialRead: true })
      .rotate()
      .resize({
        width: profile.maxWidth,
        withoutEnlargement: true,
        fit: 'inside',
      });

    await mkdir(path.dirname(outputPath), { recursive: true });
    await pipeline.webp(profile.webp).toFile(temporaryPath);
    await rename(temporaryPath, outputPath);

    const outputStats = await stat(outputPath);
    originalBytes += sourceStats.size;
    optimizedBytes += outputStats.size;

    return {
      source: toPosixPath(relativePath),
      output: toPosixPath(path.relative(PUBLIC_DIR, outputPath)),
      originalBytes: sourceStats.size,
      optimizedBytes: outputStats.size,
      savedBytes: sourceStats.size - outputStats.size,
      savedPercent: sourceStats.size > 0
        ? Number((((sourceStats.size - outputStats.size) / sourceStats.size) * 100).toFixed(1))
        : 0,
    };
  });

  const savedBytes = originalBytes - optimizedBytes;
  const report = {
    optimized: true,
    generatedAt: new Date().toISOString(),
    fileCount: results.length,
    originalBytes,
    optimizedBytes,
    savedBytes,
    savedPercent: originalBytes > 0
      ? Number(((savedBytes / originalBytes) * 100).toFixed(1))
      : 0,
    files: results.sort((a, b) => b.savedBytes - a.savedBytes),
  };

  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(
    `[images] generated ${results.length} WebP files, saved ${(savedBytes / 1024 / 1024).toFixed(2)} MB (${report.savedPercent}%)`,
  );
  return true;
};

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectRun) {
  await optimizeImages();
}
