import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Request, type Response } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const FASTAPI_PORT = Number(process.env.FASTAPI_PORT || 5050);
const FASTAPI_BASE = `http://127.0.0.1:${FASTAPI_PORT}`;

let pythonProc: ChildProcess | null = null;
let isPythonStarting = false;

function checkFastApiHealth(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(
      {
        hostname: '127.0.0.1',
        port: FASTAPI_PORT,
        path: '/api/health',
        timeout: 400,
      },
      (res) => {
        res.resume();
        resolve(res.statusCode === 200);
      },
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startPythonBackend(): Promise<void> {
  try {
    if (await checkFastApiHealth()) {
      return;
    }
    if (pythonProc && !pythonProc.killed) {
      return;
    }
    if (isPythonStarting) {
      return;
    }
    isPythonStarting = true;

    pythonProc = spawn(
      'python3',
      ['backend/server.py'],
      {
        cwd: __dirname,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1',
          FASTAPI_PORT: String(FASTAPI_PORT),
        },
      },
    );

    pythonProc.on('error', (err) => {
      console.warn(`[Python Backend Warning] Falha ao executar python3: ${err.message}`);
      pythonProc = null;
      isPythonStarting = false;
    });

    pythonProc.stdout?.on('data', (chunk: Buffer) => {
      const msg = chunk.toString().trim();
      if (msg) console.log(msg);
    });

    pythonProc.stderr?.on('data', (chunk: Buffer) => {
      const msg = chunk.toString().trim();
      if (
        msg &&
        !msg.includes('Application startup complete') &&
        !msg.includes('Uvicorn running on') &&
        !msg.includes('já em uso')
      ) {
        console.warn(`[Python Backend] ${msg}`);
      }
    });

    pythonProc.on('exit', () => {
      pythonProc = null;
      isPythonStarting = false;
    });

    // Give process a brief moment to bind without blocking the HTTP server
    for (let i = 0; i < 8; i += 1) {
      if (await checkFastApiHealth()) break;
      await new Promise((r) => setTimeout(r, 60));
    }
  } catch (err) {
    console.warn('[Python Backend Spawn Exception]', err);
  } finally {
    isPythonStarting = false;
  }
}

function cleanupPython(): void {
  if (pythonProc && !pythonProc.killed) {
    try {
      pythonProc.kill('SIGTERM');
    } catch {
      // ignore
    }
    pythonProc = null;
  }
}

process.on('SIGINT', () => {
  cleanupPython();
  process.exit(0);
});
process.on('SIGTERM', () => {
  cleanupPython();
  process.exit(0);
});
process.on('exit', cleanupPython);

async function startServer(): Promise<void> {
  const app = express();
  const httpServer = http.createServer(app);
  app.use(express.json({ limit: '1mb' }));

  // Non-blocking initiation of Python backend
  void startPythonBackend();

  // Immediate health check endpoints for Cloud Run and dev probes
  app.get(['/api/health', '/healthz'], async (_req: Request, res: Response) => {
    const pyUp = await checkFastApiHealth();
    res.status(200).json({
      status: 'ok',
      engine: 'visualdy-fullstack',
      python_ready: pyUp,
    });
  });

  // Endpoint local para Gemini AI (espelho da Netlify Function)
  app.post('/api/gemini', async (req: Request, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        error: 'GEMINI_API_KEY não configurada no ambiente.',
      });
      return;
    }

    try {
      const prompt = req.body?.prompt || req.body?.concept;
      if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({ error: 'Informe um campo "prompt" ou "concept".' });
        return;
      }

      const { GoogleGenAI } = await import('@google/genai');
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
            'Você é o assistente didático do Visualdy. Explique conceitos de computação e algoritmos de forma direta, visual, passo a passo e intuitiva.',
        },
      });

      res.status(200).json({ text: response.text ?? '' });
    } catch (err: any) {
      console.error('[Gemini Server Error]', err);
      res.status(500).json({ error: err?.message || 'Erro ao processar chamada com a API do Gemini' });
    }
  });

  // Proxy /api/* to the Python FastAPI backend with quick retry for cold starts
  app.use('/api', async (req: Request, res: Response) => {
    try {
      const targetUrl = `${FASTAPI_BASE}${req.originalUrl}`;
      const method = req.method.toUpperCase();
      const hasBody = method !== 'GET' && method !== 'HEAD';

      let lastError: unknown = null;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const upstream = await fetch(targetUrl, {
            method,
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: hasBody ? JSON.stringify(req.body ?? {}) : undefined,
          });

          const contentType = upstream.headers.get('content-type') || 'application/json';
          const payloadText = await upstream.text();
          res.status(upstream.status).type(contentType).send(payloadText);
          return;
        } catch (fetchErr) {
          lastError = fetchErr;
          if (attempt === 0) {
            void startPythonBackend();
          }
          await new Promise((r) => setTimeout(r, 120));
        }
      }

      console.error('[Proxy Error]', lastError);
      res.status(502).json({
        detail: 'Serviço visual Python temporariamente indisponível. Tentando novamente...',
      });
    } catch (err) {
      console.error('[Proxy Exception]', err);
      res.status(500).json({
        detail: 'Erro interno no proxy da API.',
      });
    }
  });

  const distPath = path.join(__dirname, 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));

  if (hasDist) {
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // In dev mode when dist has not been built yet, mount Vite middlewares
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.on('error', (err: any) => {
    console.error('[Visualdy Server Error]', err);
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[Visualdy] Servidor ativo em http://0.0.0.0:${PORT} (Python em ${FASTAPI_BASE})`);
  });
}

startServer().catch((err) => {
  console.error('[Visualdy Fatal Startup Error]', err);
  process.exit(1);
});
