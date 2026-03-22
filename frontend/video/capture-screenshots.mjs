import { chromium, devices } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function captureScreenshots() {
  const browser = await chromium.launch();

  // Usar iPhone 14 Pro Max para capturas móviles
  const context = await browser.newContext({
    ...devices['iPhone 14 Pro Max'],
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  // Captura de la página principal
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000); // Esperar animaciones

  // Captura completa de la home
  await page.screenshot({
    path: join(__dirname, 'public', 'web-screenshot-home.png'),
    fullPage: false,
  });

  // Hacer scroll para capturar más contenido
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(500);
  await page.screenshot({
    path: join(__dirname, 'public', 'web-screenshot-home-2.png'),
    fullPage: false,
  });

  // Captura de la página del club
  await page.goto('http://localhost:5173/club', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: join(__dirname, 'public', 'web-screenshot-club.png'),
    fullPage: false,
  });

  // Captura de la página de socio
  await page.goto('http://localhost:5173/socio', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: join(__dirname, 'public', 'web-screenshot-socio.png'),
    fullPage: false,
  });

  await browser.close();
  console.log('Capturas completadas en public/');
}

captureScreenshots().catch(console.error);
