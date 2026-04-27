'use client';
// app/marketplace/wanted/page.tsx — public wanted request form

import { useState } from 'react';
import Link from 'next/link';

const CATEGORIES = ['Equipment', 'Inventory', 'Services', 'Real Estate', 'Licensing', 'Partnerships', 'Other'];

export default function WantedPage() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({ title: '', description: '', category: '', budget_range: '' });
  const update = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  async function handleSubmit() {
    setStatus('submitting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/marketplace/wanted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Request Submitted</h2>
        <p className="text-sm text-gray-500 mb-6">Your wanted request will be reviewed and published once approved.</p>
        <Link href="/marketplace" className="text-sm text-green-700 hover:underline">← Back to marketplace</Link>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <Link href="/marketplace" className="text-sm text-gray-500 hover:text-green-700">← Marketplace</Link>
          <h1 className="text-2xl font-semibold text-gray-900 mt-2">Post a Wanted Request</h1>
          <p className="text-sm text-gray-500">Tell the market what you need.</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">What are you looking for? *</label>
            <input value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g. Used trim machine, BC location preferred" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={form.category} onChange={e => update('category', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={4} placeholder="Describe what you need..." className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget range (optional)</label>
            <input value={form.budget_range} onChange={e => update('budget_range', e.target.value)} placeholder="e.g. $5,000–$15,000 CAD" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          {status === 'error' && <p className="text-xs text-red-600">{errorMsg}</p>}
          <button
            onClick={handleSubmit}
            disabled={!form.title || form.title.length < 3 || !form.description || form.description.length < 10 || status === 'submitting'}
            className="w-full px-5 py-2.5 bg-green-700 text-white text-sm font-medium rounded-md disabled:opacity-40 hover:bg-green-800"
          >
            {status === 'submitting' ? 'Submitting…' : 'Submit Request'}
          </button>
          <p className="text-xs text-gray-400 text-center">Requests are reviewed before publishing.</p>
        </div>
      </div>
    </main>
  );
}
