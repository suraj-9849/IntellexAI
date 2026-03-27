'use server';
import { callHostedVisionModel, parseJsonFromText } from '@/lib/hosted-model';

// The ML model now only returns description and isDangerous
export interface VideoEvent {
  description: string;
  isDangerous: boolean;
  timestamp?: string; // Will be added locally
}

export async function detectEvents(
  base64Image: string
): Promise<{ events: VideoEvent[]; rawResponse: string }> {
  console.log('Starting frame analysis...');
  try {
    if (!base64Image) {
      throw new Error('No image data provided');
    }
    
    const prompt = `You are an expert safety event detector. Only detect and describe truly harmful or dangerous events (such as medical emergencies, violence, weapons, severe injuries, or criminal acts). Ignore and do NOT report simple, silly, or non-harmful events (like eating, playing, or minor messes).\n\nReturn your answer as a JSON object in this exact format:\n{\n  \"description\": \"Brief description of the real harmful event in this frame, or 'No harmful event detected.'\",\n  \"isDangerous\": true/false\n}\nSTRICT RULES:\n- Output ONLY valid JSON, no markdown, no code fences, no explanation, no extra text.\n- If no real harmful event is detected, set description to 'No harmful event detected.' and isDangerous to false.\n- Do NOT include silly, playful, or non-dangerous events.`;

    // Only send the image and prompt to the hosted model API
    try {
      const { text } = await callHostedVisionModel({
        base64Image,
        prompt,
      });
      console.log('Raw API Response:', text);

      // Parse the response for description and isDangerous (expects JSON in response text)
      const parsed = parseJsonFromText<{ description: string; isDangerous: boolean }>(text);
      if (!parsed) {
        throw new Error('Failed to parse API response');
      }

      // Add timestamp locally (should be passed in as an argument in real usage)
      const now = new Date();
      const timestamp = `${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      return {
        events: [
          {
            description: parsed.description,
            isDangerous: parsed.isDangerous,
            timestamp,
          },
        ],
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