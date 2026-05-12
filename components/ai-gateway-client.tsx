'use client';

import { FormEvent, useState } from 'react';

type ClientStatus = 'idle' | 'streaming' | 'done' | 'error';

const DEFAULT_PROMPT = 'Why is the sky blue?';

export function AiGatewayClient() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState<ClientStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      setStatus('error');
      setError('A prompt is required.');
      return;
    }

    setAnswer('');
    setError(null);
    setStatus('streaming');

    try {
      const response = await fetch('/api/ai-gateway', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai/gpt-5.5',
          messages: [{ role: 'user', content: trimmedPrompt }],
        }),
      });

      if (!response.ok || !response.body) {
        const body = await safeReadJson(response);
        throw new Error(body?.error?.code ?? `Request failed with status ${response.status}`);
      }

      await readStream(response.body, (chunk) => {
        setAnswer((current) => current + chunk);
      });
      setStatus('done');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'AI Gateway request failed.');
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-sm border border-gold/10 bg-[#071425] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.26)] sm:p-6">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-[#F5F1E8]">Prompt</span>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={5}
          className="w-full resize-y rounded-sm border border-gold/10 bg-[#01050d] px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-gold/60"
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={status === 'streaming'}
          className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-[#061120] transition hover:bg-gold-pale disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'streaming' ? 'Streaming…' : 'Send protected request'}
        </button>
        <p className="text-xs leading-5 text-white/48">
          The browser calls only the protected server route. Supabase session validation and the server-owned prompt stay server-side.
        </p>
      </div>

      {error ? (
        <div role="alert" className="rounded-sm border border-red-300/30 bg-red-950/40 p-4 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <output className="block min-h-32 whitespace-pre-wrap rounded-sm border border-gold/10 bg-[#01050d] p-4 text-sm leading-6 text-white/76">
        {answer || 'Streaming output will appear here.'}
      </output>
    </form>
  );
}

async function readStream(body: ReadableStream<Uint8Array>, onDelta: (delta: string) => void): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';

    for (const event of events) {
      const delta = parseSseDelta(event);
      if (delta) onDelta(delta);
    }
  }

  const finalDelta = parseSseDelta(buffer);
  if (finalDelta) onDelta(finalDelta);
}

function parseSseDelta(event: string): string {
  const lines = event.split('\n').filter((line) => line.startsWith('data:'));
  let output = '';

  for (const line of lines) {
    const data = line.slice('data:'.length).trim();
    if (!data || data === '[DONE]') continue;

    try {
      const parsed = JSON.parse(data) as {
        choices?: Array<{
          delta?: { content?: string };
          message?: { content?: string };
        }>;
      };
      output += parsed.choices?.[0]?.delta?.content ?? parsed.choices?.[0]?.message?.content ?? '';
    } catch {
      output += data;
    }
  }

  return output;
}

async function safeReadJson(response: Response): Promise<{ error?: { code?: string } } | null> {
  try {
    return await response.json() as { error?: { code?: string } };
  } catch {
    return null;
  }
}
