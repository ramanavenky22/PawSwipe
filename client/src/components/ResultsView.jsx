import { useMemo, useState } from 'react';
import PetImage from './PetImage.jsx';

const SORT_OPTIONS = [
  { id: 'loved', label: 'Most loved' },
  { id: 'voted', label: 'Most voted' },
  { id: 'divisive', label: 'Most divisive' },
];

function sortResults(items, sortBy) {
  const copy = [...items];
  switch (sortBy) {
    case 'loved':
      return copy.sort((a, b) => {
        if (b.yesPercent !== a.yesPercent) return b.yesPercent - a.yesPercent;
        return b.totalVotes - a.totalVotes;
      });
    case 'voted':
      return copy.sort((a, b) => b.totalVotes - a.totalVotes);
    case 'divisive':
      return copy.sort((a, b) => {
        if (b.divisiveness !== a.divisiveness) return b.divisiveness - a.divisiveness;
        return b.totalVotes - a.totalVotes;
      });
    default:
      return copy;
  }
}

function formatLastUpdated(ts) {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 8) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.floor(seconds / 60)}m ago`;
}

export default function ResultsView({ results, loading, error, onRetry, lastUpdated }) {
  const [sortBy, setSortBy] = useState('loved');

  const sorted = useMemo(() => sortResults(results, sortBy), [results, sortBy]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-stone-500">Loading results…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm text-coral">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full border border-ink/20 bg-white px-5 py-2 text-sm font-medium shadow-sm"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-sand/80 pb-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">
          Community picks
        </p>
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-bold">Leaderboard</h2>
          {lastUpdated && (
            <p className="shrink-0 text-[10px] text-stone-400" title="Auto-refreshes every 5 seconds">
              Updated {formatLastUpdated(lastUpdated)}
            </p>
          )}
        </div>
        <div className="mt-2.5 -mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSortBy(opt.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                sortBy === opt.id
                  ? 'bg-ink text-cream'
                  : 'bg-white text-stone-600 ring-1 ring-stone-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-2 [-webkit-overflow-scrolling:touch]">
        {sorted.length === 0 ? (
          <li className="py-8 text-center text-sm text-stone-500">No votes yet — start swiping!</li>
        ) : (
          sorted.map((row) => (
            <li
              key={row.id}
              className="mb-2.5 flex gap-2.5 overflow-hidden rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-stone-100"
            >
              <PetImage item={row} className="h-14 w-14 shrink-0 rounded-xl" compact />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{row.name}</p>
                    <p className="truncate text-[11px] text-stone-500">{row.species}</p>
                  </div>
                  <p className="shrink-0 font-display text-base font-bold tabular-nums text-mint">
                    {row.yesPercent}%
                  </p>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-stone-600">
                  <span className="text-mint">♥ {row.yesCount}</span>
                  <span className="text-coral">✕ {row.noCount}</span>
                  <span className="text-stone-400">{row.totalVotes} votes</span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-sand">
                  <div
                    className="h-full rounded-full bg-mint"
                    style={{ width: `${row.yesPercent}%` }}
                  />
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
