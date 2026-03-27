import { NextResponse } from 'next/server';
import { callHostedVisionModel } from '@/lib/hosted-model';

export async function POST(req: Request) {
  try {
    console.log('Received request at /api/analyze');

    const { imageData } = await req.json();
    if (!imageData) {
      return NextResponse.json(
        { error: 'Missing image data' },
        { status: 400 }
      );
    }

    console.log('Extracted imageData:', imageData.substring(0, 100) + '...');

    console.log('Sending request to hosted model API...');
    const result = await callHostedVisionModel({
      base64Image: imageData,
      prompt:
        'You are an expert image analyst. Provide a concise, one-line, objective description of what is visible in the image (people, objects, actions, setting, etc.) in the description field. Then, set isDangerous to true only if a real harmful or dangerous event is present (such as medical emergencies, violence, weapons, severe injuries, or criminal acts); otherwise, set isDangerous to false. Do NOT mention harmfulness in the description.\n\nReturn your answer as a JSON object in this exact format:\n{\n  "description": "One-line description of the image scene, people, objects, and actions.",\n  "isDangerous": true/false\n}\nSTRICT RULES:\n- Output ONLY valid JSON, no markdown, no code fences, no explanation, no extra text.\n- The description must always describe the image, not the harmfulness.'
    });

    // Try to extract JSON from the model's response, even if extra text is present
    let parsed = null;
    try {
      // Try direct parse
      parsed = typeof result.text === 'string' ? JSON.parse(result.text) : result.text;
    } catch {
      // Try to extract JSON substring
      const match = result.text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {}
      }
    }

    if (!parsed || typeof parsed.description !== 'string' || typeof parsed.isDangerous !== 'boolean') {
      return NextResponse.json({
        error: 'ML model did not return valid JSON with description and isDangerous',
        raw: result.text,
      }, { status: 500 });
    }

    return NextResponse.json({
      events: [
        {
          description: parsed.description,
          isDangerous: parsed.isDangerous,
        }
      ],
      rawResponse: result.text,
    });
  } catch (error: any) {
    console.error(
      'Error in hosted model API:',
      error.response?.data || error.message
    );
    return NextResponse.json(
      {
        error: 'Failed to analyze image',
        details: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}
