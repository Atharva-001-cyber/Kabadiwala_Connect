// Local-only diagnostic review. Supplied photos are NOT added to training.
import { pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const [playwrightPath, ...photos] = process.argv.slice(2);
if (!playwrightPath || !photos.length) throw new Error('Provide Playwright module path and photo paths');
const { chromium } = await import(pathToFileURL(playwrightPath).href);
const origin = 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const context = await browser.newContext();
  await context.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
  const page = await context.newPage();
  await page.goto(origin + '/login');
  for (const path of photos) {
    const bytes = await readFile(path);
    const result = await page.evaluate(async source => {
      const { analyzeDevice } = await import('/src/services/vision/deviceOnnx.ts');
      const { analyzeScrapVision } = await import('/src/utils/visionClassifier.ts');
      const image = new Image(); image.src = source; await image.decode();
      const started = performance.now();
      const device = await analyzeDevice(image);
      const integrated = await analyzeScrapVision(source);
      return { width: image.width, height: image.height, device,
        materialCategory: integrated.category, materialStatus: integrated.status,
        elapsedMs: Math.round(performance.now() - started) };
    }, 'data:image/png;base64,' + bytes.toString('base64'));
    console.log(JSON.stringify({ path, sha256: createHash('sha256').update(bytes).digest('hex'), ...result }));
  }
} finally { await browser.close(); }
