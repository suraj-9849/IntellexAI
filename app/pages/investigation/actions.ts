'use server';

import { callHostedVisionModel, parseJsonFromText } from '@/lib/hosted-model';

export interface VideoEvent {
  isDangerous: boolean;
  description: string;
}

export async function detectEvents(
  base64Image: string,
  investigationPrompt: string
): Promise<{ events: VideoEvent[]; rawResponse: string }> {
  console.log('Starting frame analysis...');
  try {
    if (!base64Image) {
      throw new Error('No image data provided');
    }

    const prompt = `Carefully analyze this image frame based on the following investigation prompt: "${investigationPrompt}".

Evaluate the frame for:
- Direct evidence related to the prompt
- Potential suspicious or concerning activities
- Context and details that might be relevant to the investigation tto the prompt 
- not more than 10-15 words

Return a JSON object in this exact format:

{
    "events": [
        {
            "description": "Detailed description of what's observed",
            "isDangerous": true/false // Set to true if the observation is potentially serious or concerning
        }
    ]
}

If no relevant observations are found, return an empty events array.`;

    // Only send the image and prompt to the hosted model API
    try {
      const { text } = await callHostedVisionModel({
        base64Image,
        prompt: `${prompt}\n\nImportant:\n- Return ONLY raw JSON.\n- Do not include markdown, code fences, or any explanation text.`,
      });
      console.log('Raw API Response:', text);

      // Parse the response for events (expects JSON in response text)
      const parsed = parseJsonFromText<{ events?: VideoEvent[] }>(text);
      if (!parsed) {
        console.error('Error parsing JSON from hosted model response');
        return { events: [], rawResponse: text };
      }

      return {
        events: parsed.events || [],
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
