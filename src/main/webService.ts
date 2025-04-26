/**
 * Service for web-related operations (Main Process)
 * This implementation needs actual Puppeteer logic
 */
import puppeteer, { Browser, Page } from 'puppeteer'; // Import puppeteer
import fs from 'node:fs/promises'; // For checking if screenshot exists

export class WebService {
  private browser: Browser | null = null;

  // Ensure browser is launched
  private async ensureBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      console.log('Launching Puppeteer browser...');
      this.browser = await puppeteer.launch({ headless: true }); // Launch headless
    }
    return this.browser;
  }

  // Close the browser when done
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      console.log('Closing Puppeteer browser...');
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Take a screenshot of a website using Puppeteer (Main Process)
   */
  async takeScreenshot(url: string, outputPath: string): Promise<string> {
    let page: Page | null = null;
    try {
      // Ensure URL has a protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const browser = await this.ensureBrowser();
      page = await browser.newPage();
      
      // Set viewport for full page screenshot if needed, or default
      await page.setViewport({ width: 1920, height: 1080 }); // Example viewport

      console.log(`Navigating to ${url}...`);
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 }); // Wait for network idle, 60s timeout

      console.log(`Taking screenshot of ${url}...`);
      await page.screenshot({ path: outputPath, fullPage: true }); // Take full page screenshot

      console.log(`Screenshot saved to ${outputPath}`);
      return outputPath;

    } catch (error) {
      console.error(`Error taking screenshot of ${url}:`, error);
      // Try to save error info or return a specific error code/message
      // For now, re-throw the error to be caught by the Excel handler
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
      // Optional: Close browser after each screenshot or keep it open?
      // await this.closeBrowser(); // Close if you want a fresh browser per screenshot
    }
  }

  /**
   * Extract content from a website (Main Process) - Placeholder
   * Implement actual content extraction using Puppeteer if needed
   */
  async extractContent(url: string): Promise<string> {
     // Placeholder - This was not explicitly requested to be functional
     // If needed, implement using page.evaluate(() => document.body.innerText)
    console.log(`(Placeholder) Extracting content from ${url}...`);
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate some delay
    return `Mock content for ${url}. Implement actual extraction if required.`;
  }

  /**
   * Check if a URL is valid and reachable (Main Process) - Placeholder
   * Implement actual check using Puppeteer or Node's http/https module if needed
   */
  async isValidUrl(url: string): Promise<boolean> {
    // Placeholder - Implement actual check if required
    console.log(`(Placeholder) Validating URL: ${url}`);
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/
    return urlPattern.test(url);
  }
} 