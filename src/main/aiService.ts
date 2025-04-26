/**
 * Service for AI-related operations (Main Process)
 * This simulates using an LLM API (like OpenAI) via fetch
 */
import fs from 'node:fs/promises'; // To read screenshot file for sending
import path from 'node:path';

// Define the structure for AI prompts, consistent with ExcelHandler
export interface AiPrompt {
  columnName: string;
  prompt: string;
}

// Interface for the expected JSON structure from the LLM API
interface LlmResponse {
  // Define based on the actual LLM API response structure
  // Example:
  result?: string;
  error?: string;
}

interface BackendApiResponse {
  result?: any; // Expecting structured data now
  error?: string;
}

export class AiService {
  // Removed apiKey, using authToken for backend API
  private apiUrl: string | undefined;
  private authToken: string | undefined; // Added for backend authentication

  constructor(authToken?: string, apiUrl?: string) {
    // Assuming authToken is retrieved from secure storage or main process state
    this.authToken = authToken || process.env.BACKEND_AUTH_TOKEN;
    // Renamed env var for clarity
    this.apiUrl = apiUrl || process.env.BACKEND_API_URL || 'http://localhost:3000/api/ai/parse-screenshot'; // Default backend URL

    if (!this.authToken) {
      console.warn('BACKEND_AUTH_TOKEN not set. AI Service calls will likely fail.');
    }
    if (!this.apiUrl) {
      // This case should ideally not happen with the default
      console.warn('Backend API URL not set and no default provided.');
    }
  }

  /**
   * Process a screenshot by sending it to the Glintify backend API (Main Process)
   */
  async processScreenshot(
    screenshotPath: string,
    url: string, // Include URL context
    prompt: string
  ): Promise<string> { // Keep returning string for now to fit into Excel cell easily
    // Use authToken and the backend apiUrl
    if (!this.authToken || !this.apiUrl) {
      return 'Error: AI Service not configured (Auth Token or Backend URL missing)';
    }

    try {
      console.log(`Sending screenshot ${screenshotPath} for ${url} to backend for prompt: "${prompt}"`);

      // Read screenshot as base64
      const imageBuffer = await fs.readFile(screenshotPath);
      const imageBase64 = imageBuffer.toString('base64');
      const imageMediaType = 'image/png'; // Assuming PNG format from webService

      // Construct the request body for the backend API
      const requestBody = {
        prompt: prompt,
        website_url: url,
        image_data: imageBase64,
        image_media_type: imageMediaType,
        // Add any other relevant context if needed by the backend
      };

      console.log(`Sending request to Backend API: ${this.apiUrl}`);
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}` // Use the backend auth token
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        let errorBody = 'Could not read error body';
        try {
           errorBody = await response.text();
        } catch (e) {
          // Ignore if reading text fails
        }
        throw new Error(`Backend API request failed with status ${response.status}: ${errorBody}`);
      }

      const result = await response.json() as BackendApiResponse;
      console.log('Received response from Backend API.');

      // Extract the relevant information from the JSON response
      if (result.error) {
        return `AI Error: ${result.error}`;
      }
      if (result.result) {
        // The backend should return the structured data.
        // For simplicity in placing into an Excel cell, stringify it.
        // Ideally, the backend might return pre-formatted strings,
        // or ExcelHandler could be updated to handle structured objects.
        if (typeof result.result === 'object') {
            return JSON.stringify(result.result);
        }
        return String(result.result);
      }

      // Fallback if the expected fields aren't present
      return JSON.stringify(result); // Return the whole JSON as a string

    } catch (error: unknown) {
      console.error('Error processing screenshot via backend API:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      // Return a specific error message to be placed in the Excel cell
      return `Error processing: ${errorMessage}`;
    }
  }
  
  // --- Placeholder/Simulation methods from original file (can be removed) ---
  // These are no longer needed if using a real API call
  /*
  private static enhanceResponse(baseResponse: string, prompt: string, url: string): string {
      // ... (simulation logic)
  }
  private static guessTopicFromUrl(url: string): string {
      // ... (simulation logic)
  }
  // ... other simulation helpers ...
  */
} 