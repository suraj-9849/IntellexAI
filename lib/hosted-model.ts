const DEFAULT_ENDPOINT =
  'https://galen-rayless-nongracefully.ngrok-free.dev/api/generate';
const DEFAULT_MODEL = 'gemma3:4b';

type HostedModelRequest = {
  base64Image: string;
  prompt: string;
  model?: string;
};

type HostedModelResponse = {
  text: string;
  raw: unknown;
};

export function normalizeBase64Image(base64Image: string): string {
  if (!base64Image) {
    throw new Error('No image data provided');
  }

  if (!base64Image.includes(',')) {
    return base64Image;
  }

  const data = base64Image.split(',')[1];
  if (!data) {
    throw new Error('Invalid image data format');
  }

  return data;
}

export async function callHostedVisionModel({
  base64Image,
  prompt,
  model,
}: HostedModelRequest): Promise<HostedModelResponse> {
  const endpoint = process.env.HOSTED_MODEL_ENDPOINT || DEFAULT_ENDPOINT;
  const modelName = process.env.HOSTED_MODEL_NAME || model || DEFAULT_MODEL;
  // Auth is bypassed for now; do not send Authorization header
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  };

  const payload = {
    model: modelName,
    prompt,
    images: [normalizeBase64Image(base64Image)],
    stream: false,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Hosted model request failed (${response.status}): ${errorText}`
    );
  }

  const raw = await response.json();
  const typedRaw = raw as Record<string, unknown>;

  const text =
    (typeof typedRaw.response === 'string' && typedRaw.response) ||
    (typeof typedRaw.text === 'string' && typedRaw.text) ||
    (typeof typedRaw.content === 'string' && typedRaw.content) ||
    JSON.stringify(raw);

  return { text, raw };
}

export function parseJsonFromText<T>(text: string): T | null {
  if (!text) return null;

  let jsonStr = text;

  const codeBlockMatch = text.match(/```(?:json)?\s*({[\s\S]*?})\s*```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1];
  } else {
    const jsonMatch = text.match(/\{[^]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
  }

  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}
