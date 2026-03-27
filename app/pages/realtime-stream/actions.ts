'use server';

import { callHostedVisionModel, parseJsonFromText } from '@/lib/hosted-model';

export interface VideoEvent {
  timestamp: string;
  description: string;
  isDangerous: boolean;
}

export async function detectEvents(
  base64Image: string,
  transcript: string = ''
): Promise<{ events: VideoEvent[]; rawResponse: string }> {
  console.log('Starting frame analysis...');
  try {
    if (!base64Image) {
      throw new Error('No image data provided');
    }

    const prompt = `Analyze this frame and determine if any of these specific dangerous situations are occurring:

1. Medical Emergencies:
- Person unconscious or lying motionless
- Person clutching chest/showing signs of heart problems
- Seizures or convulsions
- Difficulty breathing or choking

2. Falls and Injuries:
- Person falling or about to fall
- Person on the ground after a fall
- Signs of injury or bleeding
- Limping or showing signs of physical trauma

3. Distress Signals:
- Person calling for help or showing distress
- Panic attacks or severe anxiety symptoms
- Signs of fainting or dizziness
- Headache or unease
- Signs of unconsciousness

4. Violence or Threats:
- Physical altercations
- Threatening behavior
- Weapons visible

5. Suspicious Activities:
- Shoplifting
- Vandalism
- Trespassing
${
  transcript
    ? `Consider this audio transcript from the scene: "${transcript}"
`
    : ''
}
Return a JSON object in this exact format:

{
    "events": [
        {
            "timestamp": "mm:ss",
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
