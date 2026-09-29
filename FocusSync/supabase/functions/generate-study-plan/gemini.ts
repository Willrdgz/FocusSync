export const AI_BUSY_MESSAGE = 'La IA está ocupada en este momento. Espera un momento y vuelve a intentarlo.';

export async function fetchGemini(url: string, options: RequestInit): Promise<Response> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { ...options, signal: AbortSignal.timeout(25000) });
      const retryable = [408, 429, 500, 502, 503, 504].includes(response.status);
      if (!retryable || attempt === 2) return response;
      await response.body?.cancel();
    } catch {
      if (attempt === 2) throw new Error(AI_BUSY_MESSAGE);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt + Math.random() * 300));
  }
  throw new Error(AI_BUSY_MESSAGE);
}
