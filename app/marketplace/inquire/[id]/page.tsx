'use client';
// app/marketplace/inquire/[id]/page.tsx — public inquiry form

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function InquiryPage() {
  const params = useParams();
  const listingId = params.id as string;
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({ buyer_name: '', buyer_email: '', buyer_phone: '', buyer_company: '', message: '' });
  const update = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  async function handleSubmit() {
    setStatus('submitting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/marketplace/inquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error ?? 'Submission failed.'); setStatus('error'); return; }
      setStatus('success');
    } catch { setErrorMsg('Network error.'); setStatus('error'); }
  }

  if (status === 'success') return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-md w-full text-center">
        <div className="text-4xl mb-4">✓</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Inquiry Sent</h2>
        <p className="text-sm text-gray-500 mb-6">Your inquiry has been submitted and will be forwarded to the listing contact.</p>
        <Link href="/marketplace" className="text-sm text-green-700 hover:underline">← Back to marketplace</Link>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <Link href="/marketplace" className="text-sm text-gray-500 hover:text-green-700">← Marketplace</Link>
          <h1 className="text-2xl font-semibold text-gray-900 mt-2">Send an Inquiry</h1>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input value={form.buyer_name} onChange={e => update('buyer_name', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" value={form.buyer_email} onChange={e => update('buyer_email', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company (optional)</label>
            <input value={form.buyer_company} onChange={e => update('buyer_company', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
            <input value={form.buyer_phone} onChange={e => update('buyer_phone', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
            <textarea value={form.message} onChange={e => update('message', e.target.value)} rows={5} placeholder="Describe what you're looking for..." className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          {status === 'error' && <p className="text-xs text-red-600">{errorMsg}</p>}
          <button
            onClick={handleSubmit}
            disabled={!form.buyer_name || !form.buyer_email || !form.message || form.message.length < 10 || status === 'submitting'}
            className="w-full px-5 py-2.5 bg-green-700 text-white text-sm font-medium rounded-md disabled:opacity-40 hover:bg-green-800"
          >
            {status === 'submitting' ? 'Sending…' : 'Send Inquiry'}
          </button>
        </div>
      </div>
    </main>
  );
}
