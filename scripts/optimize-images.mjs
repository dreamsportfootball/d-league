import { cp, mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const OPTIMIZED_PUBLIC_DIR = path.join(ROOT_DIR, '.optimized-public');
const REPORT_PATH = path.join(ROOT_DIR, 'image-optimization-report.json');
const RASTER_PATTERN = /\.(png|jpe?g)$/i;

const toPosixPath = (value) => value.split(path.sep).join('/');

const getProfile = (relativePath) => {
  const normalized = toPosixPath(relativePath).toLowerCase();

  if (normalized.includes('/teams/')) {
    return {
      maxWidth: 512,
      originalQuality: 96,
      webp: { lossless: true, effort: 6 },
    };
  }

  if (normalized.includes('/players/')) {
    return {
      maxWidth: 640,
      originalQuality: 92,
      webp: { quality: 84, alphaQuality: 96, effort: 5 },
    };
  }

  if (normalized.includes('mobile')) {
    return {
      maxWidth: 960,
      originalQuality: 90,
      webp: { quality: 86, alphaQuality: 96, effort: 5 },
    };
  }

  if (
    normalized.includes('/cup/') ||
    normalized.includes('/aboutpage/') ||
    normalized.includes('/news/') ||
    normalized.includes('/media/') ||
    normalized.includes('/albums/')
  ) {
    return {
      maxWidth: 1600,
      originalQuality: 84,
      webp: { quality: 80, alphaQuality: 96, effort: 5 },
    };
  }

  if (normalized.includes('poster') || normalized.includes('banner')) {
    return {
      maxWidth: 1920,
      originalQuality: 92,
      webp: { quality: 88, alphaQuality: 98, effort: 5 },
    };
  }

  return {
    maxWidth: 1920,
    originalQuality: 88,
    webp: { quality: 82, alphaQuality: 96, effort: 5 },
  };
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

const getWebpSourcePriority = (sourcePath) => {
  const extension = path.extname(sourcePath).toLowerCase();
  if (extension === '.png') return 0;
  if (extension === '.jpeg') return 1;
  return 2;
};

const getWebpOutputPath = (sourcePath) => sourcePath.replace(RASTER_PATTERN, '.webp');

const selectWebpOwners = (files) => {
  const owners = new Map();

  for (const sourcePath of files) {
    const outputPath = getWebpOutputPath(sourcePath);
    const current = owners.get(outputPath);
    if (!current || getWebpSourcePriority(sourcePath) < getWebpSourcePriority(current)) {
      owners.set(outputPath, sourcePath);
    }
  }

  return owners;
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

  await rm(OPTIMIZED_PUBLIC_DIR, { recursive: true, force: true });
  await cp(PUBLIC_DIR, OPTIMIZED_PUBLIC_DIR, { recursive: true });

  const files = await collectImages(OPTIMIZED_PUBLIC_DIR);
  const webpOwners = selectWebpOwners(files);

  const results = await processWithConcurrency(files, 4, async (sourcePath) => {
    const relativePath = path.relative(OPTIMIZED_PUBLIC_DIR, sourcePath);
    const originalSourcePath = path.join(PUBLIC_DIR, relativePath);
    const outputPath = getWebpOutputPath(sourcePath);
    const isWebpOwner = webpOwners.get(outputPath) === sourcePath;
    const temporaryOriginalPath = `${sourcePath}.tmp`;
    const temporaryWebpPath = `${outputPath}.tmp`;
    const profile = getProfile(relativePath);
    const extension = path.extname(sourcePath).toLowerCase();
    const originalStats = await stat(originalSourcePath);
    const sourceBuffer = await readFile(originalSourcePath);

    const basePipeline = sharp(sourceBuffer, { failOn: 'none', sequentialRead: true })
      .rotate()
      .resize({
        width: profile.maxWidth,
        withoutEnlargement: true,
        fit: 'inside',
      });

    if (extension === '.jpg' || extension === '.jpeg') {
      await basePipeline
        .clone()
        .jpeg({ quality: profile.originalQuality, progressive: true, mozjpeg: true })
        .toFile(temporaryOriginalPath);
    } else {
      await basePipeline
        .clone()
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toFile(temporaryOriginalPath);
    }

    if (isWebpOwner) {
      await basePipeline.clone().webp(profile.webp).toFile(temporaryWebpPath);
    }
    await rename(temporaryOriginalPath, sourcePath);
    if (isWebpOwner) {
      await rename(temporaryWebpPath, outputPath);
    }

    const deployedOriginalStats = await stat(sourcePath);
    const outputStats = isWebpOwner ? await stat(outputPath) : null;
    const optimizedWebpBytes = outputStats?.size ?? 0;

    return {
      source: toPosixPath(relativePath),
      webp: toPosixPath(path.relative(OPTIMIZED_PUBLIC_DIR, outputPath)),
      webpOwner: isWebpOwner,
      originalBytes: originalStats.size,
      deployedOriginalBytes: deployedOriginalStats.size,
      webpBytes: optimizedWebpBytes,
      webpSavedBytes: isWebpOwner ? originalStats.size - optimizedWebpBytes : 0,
      webpSavedPercent: isWebpOwner && originalStats.size > 0
        ? Number((((originalStats.size - optimizedWebpBytes) / originalStats.size) * 100).toFixed(1))
        : 0,
    };
  });

  const originalBytes = results.reduce((sum, item) => sum + item.originalBytes, 0);
  const deployedOriginalBytes = results.reduce((sum, item) => sum + item.deployedOriginalBytes, 0);
  const webpBytes = results.reduce((sum, item) => sum + item.webpBytes, 0);
  const savedBytes = originalBytes - webpBytes;
  const report = {
    optimized: true,
    generatedAt: new Date().toISOString(),
    publicDirectory: '.optimized-public',
    fileCount: results.length,
    webpFileCount: webpOwners.size,
    originalBytes,
    deployedOriginalBytes,
    webpBytes,
    savedBytes,
    savedPercent: originalBytes > 0
      ? Number(((savedBytes / originalBytes) * 100).toFixed(1))
      : 0,
    files: results.sort((a, b) => b.webpSavedBytes - a.webpSavedBytes),
  };

  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(
    `[images] optimized ${results.length} raster files into ${webpOwners.size} WebP outputs, saving ${(savedBytes / 1024 / 1024).toFixed(2)} MB (${report.savedPercent}%)`,
  );
  return true;
};

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectRun) {
  await optimizeImages();
}