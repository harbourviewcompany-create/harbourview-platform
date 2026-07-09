import { PublicSignal } from '@/lib/dto/intelligence';

export default function SignalCard({ signal }: { signal: PublicSignal }) {
  return (
    <div className="bg-zinc-900 p-6 rounded-xl">
      <h3>{signal.title}</h3>
      <p>{signal.summary}</p>
      <div>
        {signal.sources?.map((s, i) => <a key={i} href={s.url}>{s.title}</a>)}
      </div>
    </div>
  );
}