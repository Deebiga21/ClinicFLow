import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newContext();
  const p = await page.newPage();
  
  // Go to homepage
  await p.goto('http://localhost:5173/');
  await p.screenshot({ path: 'home.png' });
  
  // Go to command center
  await p.goto('http://localhost:5173/#/command-center');
  await p.waitForTimeout(2000);
  await p.screenshot({ path: 'admin.png' });
  
  // Go to patient portal
  await p.goto('http://localhost:5173/#/patient-portal');
  await p.waitForTimeout(2000);
  await p.screenshot({ path: 'patient.png' });
  
  await browser.close();
  console.log("Screenshots taken.");
})();
