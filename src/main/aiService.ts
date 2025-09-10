/**
 * Service for AI-related operations (Main Process)
 * This simulates using an LLM API (like OpenAI) via fetch
 */
import { GoogleGenAI, Type } from '@google/genai'
import fs from 'node:fs/promises'

// Define the structure for AI prompts, consistent with ExcelHandler
export interface AiPrompt {
  columnName: string
  prompt: string
}

interface BackendApiResponse {
  result?: any // Expecting structured data now
  error?: string
}

export class AiService {
  // Removed apiKey, using authToken for backend API

  /**
   * Process a screenshot by sending it to the backend API (Main Process)
   */
  async processScreenshot(
    screenshotPath: string,
    url: string, // Include URL context
    prompts: AiPrompt[],
    apiKey?: string
  ) {
    // Prefer local Gemini if API key is present; otherwise fall back to web API
    const geminiKey = apiKey || process.env.GEMINI_API_KEY || ''
    
    if (geminiKey) {
      try {
        const imageBuffer = await fs.readFile(screenshotPath)
        const imageBase64 = imageBuffer.toString('base64')
        const genAI = new GoogleGenAI({ apiKey: geminiKey })
        const responseSchema: any = { type: Type.OBJECT, properties: {}, required: [] }
        for (const p of prompts) {
          responseSchema.properties[p.columnName] = {
            type: Type.STRING,
            description: `Result for prompt: ${p.prompt}`
          }
          responseSchema.required.push(p.columnName)
        }
        const result = await genAI.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [
            { inlineData: { mimeType: 'image/png', data: imageBase64 } },
            {
              text: `Extract data for prompts: ${JSON.stringify(prompts)} from screenshot of ${url}`
            }
          ],
          config: { responseMimeType: 'application/json', responseSchema }
        })
        
        const text: string = (result as any)?.text || '{}'
        let parsed: any = {}
        try {
          parsed = JSON.parse(text)
        } catch {
          throw new Error('Failed to parse JSON')
        }
        return parsed || text
      } catch (error: any) {
        // Fall through to web API
        console.warn(
          'Local Gemini processing failed, falling back to web API:',
          error?.message || error
        )
        throw error
      }
    }
  }
}
