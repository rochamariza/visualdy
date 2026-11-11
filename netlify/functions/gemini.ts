import { GoogleGenAI } from '@google/genai';

export default async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido. Utilize POST.' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          'GEMINI_API_KEY não configurada no Netlify. Configure a chave em Site configuration > Environment variables.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  try {
    const body = await req.json();
    const prompt = body?.prompt || body?.concept;

    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Informe um campo "prompt" ou "concept" no corpo da requisição.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'Você é o assistente didático do Visualdy. Explique conceitos de computação e algoritmos de forma direta, visual, passo a passo e intuitiva, usando analogias claras de memória, ponteiros e execução.',
      },
    });

    return new Response(
      JSON.stringify({
        text: response.text ?? '',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  } catch (err: any) {
    console.error('[Gemini Netlify Function Error]', err);
    return new Response(
      JSON.stringify({
        error: err?.message || 'Falha ao processar solicitação com a API do Gemini.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};
