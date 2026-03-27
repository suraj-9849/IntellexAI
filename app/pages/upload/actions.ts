'use server';

import { callHostedVisionModel, parseJsonFromText } from '@/lib/hosted-model';


// The ML model now only returns description and isDangerous
export interface VideoEvent {
  description: string;
  isDangerous: boolean;
}

export async function detectEvents(
  base64Image: string
): Promise<{ events: VideoEvent[]; rawResponse: string }> {
  console.log('Starting frame analysis...');
  try {
    if (!base64Image) {
      throw new Error('No image data provided');
    }

    const prompt = `Analyze this frame and determine if any dangerous or safety-relevant situation is occurring. Return a JSON object in this exact format:

{
  "events": [
    {
      "description": "Brief description of what's happening in this frame",
      "isDangerous": true/false
    }
  ]
}

Important:
- Return ONLY raw JSON.
- Do not include markdown, code fences, or any explanation text.`;

    // Only send the image and prompt to the hosted model API
    try {
      const { text } = await callHostedVisionModel({
        base64Image,
        prompt,
      });
      console.log('Raw API Response:', text);

      // Parse the response for events (expects JSON in response text)
      const parsed = parseJsonFromText<{ events?: VideoEvent[] }>(text);
      if (!parsed) {
        throw new Error('Failed to parse API response');
      }

      // Add timestamp locally if needed elsewhere
      return {
        events: (parsed.events || []).map((event) => ({
          description: event.description,
          isDangerous: event.isDangerous,
        })),
        rawResponse: text,
      };
    } catch (error) {
      console.error('Error calling hosted model API:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in detectEvents:', error);
    throw error;
  }
}
