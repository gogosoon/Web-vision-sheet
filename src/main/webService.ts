/**
 * Service for web-related operations (Main Process)
 * This implementation needs actual Puppeteer logic
 */
import { app, dialog } from 'electron' // <-- Add dialog import
import { Browser, Page } from 'puppeteer' // <-- Import Browser and Page types
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth' // <-- Import stealth plugin
import fs from 'node:fs' // <-- Use fs directly
import path from 'node:path' // <-- Add path import
const findChrome = require('chrome-finder')

puppeteer.use(StealthPlugin()) // <-- Use stealth plugin
export class WebService {
  private browser: Browser | null = null
  private profilePath: string // <-- Store profile path

  constructor() {
    // <-- Add constructor
    this.profilePath = path.join(app.getPath('userData'), 'default_browser_profile')
    // Ensure the profile directory exists
    try {
      fs.mkdirSync(this.profilePath, { recursive: true })
      console.log(`Ensured Puppeteer profile directory exists: ${this.profilePath}`)
    } catch (error) {
      console.error(`Failed to create Puppeteer profile directory: ${this.profilePath}`, error)
      // Handle error appropriately, maybe throw or log
    }
  }

  // Ensure browser is launched
  private async ensureBrowser(headedMode = false): Promise<Browser> {
    // <-- Accept headedMode flag
    if (!this.browser || !this.browser.isConnected()) {
      console.log(`Launching Puppeteer browser (Headed: ${headedMode})...`)
      try {
        let chromePath;
        try {
          chromePath = findChrome()
        } catch (error) {
          console.error('Failed to find Chrome installation:', error)
          dialog.showErrorBox(
            'Chrome Not Found',
            'Google Chrome is not installed in your system. Please install Google Chrome and try again.'
          )
          throw new Error('Google Chrome is not installed in your system. Please install Google Chrome and try again.')
        }
        
        this.browser = await puppeteer.launch({
          headless: !headedMode, // <-- Use headedMode flag
          userDataDir: this.profilePath, // <-- Use the profile path
          executablePath: chromePath
        })
        console.log(`Puppeteer browser launched with profile: ${this.profilePath}`)
      } catch (error) {
        console.error('Failed to launch Puppeteer browser:', error)
        throw error // Re-throw the error to be handled upstream
      }
    }
    return this.browser
  }

  // Method to explicitly launch a headed browser (or focus if already open)
  async launchHeadedBrowser(): Promise<Browser> {
    console.log('launchHeadedBrowser called. Ensuring headed browser instance...')
    // Always ensure it's headed when called via this method
    return this.ensureBrowser(true)
  }

  // Close the browser when done
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      console.log('Closing Puppeteer browser...')
      await this.browser.close()
      this.browser = null
    }
  }

  /**
   * Take a screenshot of a website using Puppeteer (Main Process)
   */
  async takeScreenshot(url: string, outputPath: string): Promise<string> {
    let page: Page | null = null
    try {
      // Ensure URL has a protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url
      }

      // Use ensureBrowser(false) for headless screenshots
      // for now hardcoded to not use headless
      const browser = await this.ensureBrowser(false)
      page = await browser.newPage()

      // Set viewport for full page screenshot if needed, or default
      await page.setViewport({ width: 1920, height: 1080 }) // Example viewport

      console.log(`Navigating to ${url}...`)
      await page.goto(url, { waitUntil: 'load' }) // Wait for network idle, 20s timeout
      try {
        await page.waitForNetworkIdle({ timeout: 10000 })
      } catch (error) {
        console.error(`Error waiting for network idle:`, error)
      }
      console.log(`Taking screenshot of ${url}...`)
      await page.screenshot({ path: outputPath, fullPage: true }) // Take full page screenshot

      console.log(`Screenshot saved to ${outputPath}`)
      return outputPath
    } catch (error) {
      console.error(`Error taking screenshot of ${url}:`, error)
      // Try to save error info or return a specific error code/message
      // For now, re-throw the error to be caught by the Excel handler
      throw error
    } finally {
      if (page) {
        await page.close()
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
    console.log(`(Placeholder) Extracting content from ${url}...`)
    await new Promise((resolve) => setTimeout(resolve, 100)) // Simulate some delay
    return `Mock content for ${url}. Implement actual extraction if required.`
  }

  /**
   * Check if a URL is valid and reachable (Main Process) - Placeholder
   * Implement actual check using Puppeteer or Node's http/https module if needed
   */
  async isValidUrl(url: string): Promise<boolean> {
    // Placeholder - Implement actual check if required
    console.log(`(Placeholder) Validating URL: ${url}`)
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/
    return urlPattern.test(url)
  }
}
