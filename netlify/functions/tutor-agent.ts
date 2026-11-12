import { runTutorAgent } from '../../src/server/tutorAgent';

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
    return new Response(JSON.stringify({ detail: 'Método não permitido. Utilize POST.' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const topic = String(body?.topic || body?.concept || body?.tema || '').trim();

    if (topic.length < 2) {
      return new Response(
        JSON.stringify({ detail: 'Informe um tema válido com pelo menos 2 caracteres.' }),
        { status: 422, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const result = await runTutorAgent(topic);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    console.error('[Tutor Agent Netlify Error]', err);
    return new Response(
      JSON.stringify({
        detail: err?.message || 'Erro ao gerar explicação visual pelo Agente Tutor.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};
