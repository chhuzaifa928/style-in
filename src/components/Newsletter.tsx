'use client';

import { useState } from 'react';
import { IconCheck } from './icons';

/** Footer newsletter signup band. Posts to /api/newsletter. */
export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>(
    'idle',
  );
  const [msg, setMsg] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMsg('');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setStatus('error');
        setMsg(json.error || 'Something went wrong');
        return;
      }
      setStatus('done');
      setEmail('');
    } catch {
      setStatus('error');
      setMsg('Network error. Please try again.');
    }
  };

  return (
    <div className="border-b border-hairline bg-ink text-white">
      <div className="container-page flex flex-col items-center gap-5 py-12 text-center">
        <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/70">
          Join the StyleIn list
        </span>
        <h2 className="heading max-w-2xl text-3xl md:text-4xl">
          Early access to drops, private sales &amp; styling edits.
        </h2>

        {status === 'done' ? (
          <p className="flex items-center gap-2 text-sm font-semibold text-white">
            <IconCheck className="h-5 w-5 text-brand" />
            You&apos;re in. Watch your inbox for the next drop.
          </p>
        ) : (
          <form
            onSubmit={submit}
            className="flex w-full max-w-md flex-col gap-2 sm:flex-row"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full border border-white/25 bg-transparent px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/50 focus:border-white"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="btn-brand whitespace-nowrap"
            >
              {status === 'loading' ? 'Joining…' : 'Subscribe'}
            </button>
          </form>
        )}
        {status === 'error' && (
          <p className="text-sm font-medium text-brand">{msg}</p>
        )}
      </div>
    </div>
  );
}
