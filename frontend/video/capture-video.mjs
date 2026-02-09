import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function captureScrollVideo() {
  const browser = await chromium.launch();

  const videoWidth = 390;
  const videoHeight = 844;

  const context = await browser.newContext({
    viewport: { width: videoWidth, height: videoHeight },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
    recordVideo: {
      dir: join(__dirname, 'public'),
      size: { width: videoWidth, height: videoHeight },
    },
  });

  const page = await context.newPage();

  console.log('Navegando a /club...');
  await page.goto('http://localhost:5173/club', { waitUntil: 'networkidle' });

  // 0.5 segundos de pausa inicial para apreciar la página
  console.log('Mostrando página fija 0.5 segundos...');
  await page.waitForTimeout(500);

  const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  const totalScroll = scrollHeight - viewportHeight;

  // Scroll de 5 segundos
  const scrollDuration = 5000;
  const fps = 30;
  const totalFrames = (scrollDuration / 1000) * fps;
  const scrollPerFrame = totalScroll / totalFrames;
  const frameDelay = 1000 / fps;

  console.log('Iniciando scroll...');
  for (let i = 0; i <= totalFrames; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.min(i * scrollPerFrame, totalScroll));
    await page.waitForTimeout(frameDelay);
  }

  // 0.5s al final
  await page.waitForTimeout(500);

  await page.close();
  await context.close();
  await browser.close();

  console.log('Video guardado: 1s pausa + 5s scroll');
}

captureScrollVideo().catch(console.error);
