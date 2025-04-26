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

export class AiService {
  private apiKey: string | undefined;
  private apiUrl: string | undefined;

  constructor(apiKey?: string, apiUrl?: string) {
    this.apiKey = apiKey || process.env.LLM_API_KEY; // Use provided key or environment variable
    this.apiUrl = apiUrl || process.env.LLM_API_URL; // Use provided URL or environment variable

    if (!this.apiKey) {
      console.warn('LLM_API_KEY not set. AI Service calls will likely fail.');
    }
    if (!this.apiUrl) {
      console.warn('LLM_API_URL not set. AI Service calls will likely fail.');
    }
  }

  /**
   * Process a screenshot with AI using fetch (Main Process)
   * Sends screenshot (optional, based on API) and prompt to an LLM API.
   */
  async processScreenshot(
    screenshotPath: string,
    url: string, // Include URL context
    prompt: string
  ): Promise<string> {
    if (!this.apiKey || !this.apiUrl) {
      return 'Error: AI Service not configured (API Key or URL missing)';
    }

    try {
      console.log(`Processing screenshot at ${screenshotPath} for ${url} with prompt: "${prompt}"`);

      // Option 1: Send screenshot as base64 data (Common for multimodal models)
      // const imageBuffer = await fs.readFile(screenshotPath);
      // const imageBase64 = imageBuffer.toString('base64');

      // Option 2: Send screenshot path/URL (If API can access it - less common)
      // const screenshotUrl = `file://${screenshotPath}`; // Might not work depending on API/server setup

      // Construct the request body according to your specific LLM API
      // This is a GENERIC example, replace with actual API requirements
      const requestBody = {
        model: "your-llm-model-name", // Replace with your model
        prompt: prompt,
        context: { // Provide context
          website_url: url,
          // If sending image data:
          // image_data: imageBase64,
          // image_media_type: 'image/png',
          // If sending image path/URL (less likely to work):
          // screenshot_location: screenshotPath 
        },
        response_format: { type: "json_object" }, // Request JSON if supported
        max_tokens: 150 // Example parameter
      };

      console.log(`Sending request to LLM API: ${this.apiUrl}`);
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`LLM API request failed with status ${response.status}: ${errorBody}`);
      }

      const result = await response.json() as LlmResponse;
      console.log('Received response from LLM API.');

      // Extract the relevant information from the JSON response
      // Adjust based on your actual LlmResponse interface and API output
      if (result.error) {
        return `AI Error: ${result.error}`;
      }
      if (result.result) {
        return result.result; // Assuming the main text is in a 'result' field
      }
      
      // Fallback if the expected fields aren't present
      return JSON.stringify(result); // Return the whole JSON as a string

    } catch (error: unknown) {
      console.error('Error processing screenshot with AI:', error);
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