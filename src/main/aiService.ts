/**
 * Service for AI-related operations (Main Process)
 * This simulates using an LLM API (like OpenAI) via fetch
 */
import { GoogleGenAI, Type } from '@google/genai'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import { CONST_ELECTON_APP } from './const'
import { CreditTransaction, TransactionType } from './database/entities/CreditTransaction'
import { DesktopToken } from './database/entities/DesktopToken'
import { User } from './database/entities/User'
import { tokenStorage } from './tokenStorage'

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
  private authToken: string | undefined // Added for backend authentication

  constructor(authToken?: string) {
    // Use provided token or fallback to env
    this.authToken = authToken

    if (!this.authToken) {
      console.warn(
        'Auth token not provided and BACKEND_AUTH_TOKEN not set. Will attempt to use stored token.'
      )
    }
  }

  /**
   * Get a valid token, either from instance or from storage
   */
  private async getToken(): Promise<string | null> {
    // Use token provided in constructor if available
    if (this.authToken) {
      return this.authToken
    }

    // Otherwise try to get from storage
    try {
      return await tokenStorage.getToken()
    } catch (error) {
      console.error('Error retrieving token from storage:', error)
      return null
    }
  }

  /**
   * Process a screenshot by sending it to the backend API (Main Process)
   */
  async processScreenshot(
    screenshotPath: string,
    url: string, // Include URL context
    prompts: AiPrompt[]
  ): Promise<string> {
    // Prefer local Gemini if API key is present; otherwise fall back to web API
    const geminiKey = process.env.GEMINI_API_KEY || ''
    if (geminiKey) {
      try {
        const imageBuffer = await fs.readFile(screenshotPath)
        const imageBase64 = imageBuffer.toString('base64')
        const genAI = new GoogleGenAI({ apiKey: geminiKey })
        const responseSchema: any = { type: Type.OBJECT, properties: {}, required: [] }
        for (const p of prompts) {
          responseSchema.properties[p.columnName] = { type: Type.STRING, description: `Result for prompt: ${p.prompt}` }
          responseSchema.required.push(p.columnName)
        }
        const result = await genAI.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [
            { inlineData: { mimeType: 'image/png', data: imageBase64 } },
            { text: `Extract data for prompts: ${JSON.stringify(prompts)} from screenshot of ${url}` }
          ],
          config: { responseMimeType: 'application/json', responseSchema }
        })
        const text: string = (result as any)?.text || '{}'
        let parsed: any = {}
        try { parsed = JSON.parse(text) } catch {}

        // Decrement one credit locally if user exists
        const token = await this.getToken()
        if (token) {
          const tokenRow = await DesktopToken.findOne({ where: { token } })
          if (tokenRow) {
            const user = await User.findOne({ where: { id: tokenRow.userId } })
            if (user && user.credits > 0) {
              user.credits = user.credits - 1
              await User.save(user)
              await CreditTransaction.save({
                id: cryptoRandomId(),
                userId: user.id,
                creditAmount: 1,
                type: TransactionType.DEBIT,
                usageDetailsComments: `Used 1 credit for AI screenshot parsing of ${url || 'unknown URL'}`,
                usageDetailsJsonDump: JSON.stringify({ prompts, website_url: url, timestamp: new Date().toISOString() }),
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null
              })
            }
          }
        }
        return parsed || text
      } catch (error: any) {
        // Fall through to web API
        console.warn('Local Gemini processing failed, falling back to web API:', error?.message || error)
      }
    }

    // Fallback to the web API
    const token = await this.getToken()
    if (!token) {
      return 'Error: AI Service not configured (Auth Token missing)'
    }
    try {
      const imageBuffer = await fs.readFile(screenshotPath)
      const imageBase64 = imageBuffer.toString('base64')
      const requestBody = { prompts, website_url: url, image_data: imageBase64, image_media_type: 'image/png' }
      const response = await fetch(CONST_ELECTON_APP.API_URL + '/ai/parse-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(requestBody)
      })
      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'Could not read error body')
        throw new Error(`Backend API request failed with status ${response.status}: ${errorBody}. Credits won't be deducted for failed rows.`)
      }
      const result = (await response.json()) as BackendApiResponse
      if (result.error) return `AI Error: ${result.error}. Credits won't be deducted for failed rows`
      if (result.result) return result.result
      return JSON.stringify(result)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return `Error processing: ${errorMessage}. Credits won't be deducted for failed rows`
    }
  }
}

function cryptoRandomId(): string {
  // simple 32-char hex using Node crypto
  return crypto.randomBytes(16).toString('hex')
}
