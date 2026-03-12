const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

async function fetchWithBackoff(
  url: string,
  options: RequestInit,
  retries = 5
): Promise<Response> {
  const delays = [1000, 2000, 4000, 8000, 16000];
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (i === retries - 1) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }
    } catch (error) {
      if (i === retries - 1) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, delays[i]));
  }
  throw new Error('Max retries exceeded');
}

export async function callGeminiAPI(
  promptText: string,
  systemInstruction: string
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`;
  const options: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
    }),
  };

  const response = await fetchWithBackoff(url, options);
  const data = await response.json();
  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    'エラーが発生しました。'
  );
}
