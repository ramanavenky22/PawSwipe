import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  deleteVote,
  fetchItems,
  fetchResults,
  fetchSessionVotes,
  submitVote,
} from './api.js';
import SwipeCard from './components/SwipeCard.jsx';
import ResultsView from './components/ResultsView.jsx';
import EndState from './components/EndState.jsx';

const RESULTS_POLL_MS = 5000;
const TABS = { swipe: 'swipe', results: 'results' };

export default function App() {
  const [tab, setTab] = useState(TABS.swipe);
  const [items, setItems] = useState([]);
  const [votedIds, setVotedIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [voting, setVoting] = useState(false);
  const [sessionChoices, setSessionChoices] = useState(() => new Map());
  const [lastUndo, setLastUndo] = useState(null);
  const [replayItemId, setReplayItemId] = useState(null);
  const [undoing, setUndoing] = useState(false);

  const [results, setResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState(null);
  const [resultsUpdatedAt, setResultsUpdatedAt] = useState(null);

  const totalCount = items.length;
  const votedCount = votedIds.size;

  const remaining = useMemo(
    () => items.filter((item) => !votedIds.has(item.id)),
    [items, votedIds]
  );

  const currentItem = useMemo(() => {
    if (replayItemId) {
      const replay = items.find((item) => item.id === replayItemId);
      if (replay && !votedIds.has(replayItemId)) return replay;
    }
    return remaining[0] ?? null;
  }, [replayItemId, items, votedIds, remaining]);
  const deckFinished = !loading && !error && totalCount > 0 && remaining.length === 0;
  const progressCurrent = deckFinished ? totalCount : votedCount + 1;
  const progressPct = totalCount > 0 ? Math.round((votedCount / totalCount) * 100) : 0;

  const loadDeck = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allItems, sessionVotes] = await Promise.all([
        fetchItems(),
        fetchSessionVotes(),
      ]);
      const voted = new Set(sessionVotes.map((v) => v.itemId));
      const choices = new Map(sessionVotes.map((v) => [v.itemId, v.choice]));
      setItems(allItems);
      setVotedIds(voted);
      setSessionChoices(choices);
      setLastUndo(null);
      setReplayItemId(null);
    } catch (err) {
      setError(err.message || 'Could not load pets');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadResults = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setResultsLoading(true);
    }
    setResultsError(null);
    try {
      const data = await fetchResults();
      setResults(data);
      setResultsUpdatedAt(Date.now());
    } catch (err) {
      setResultsError(err.message || 'Could not load results');
    } finally {
      if (!silent) {
        setResultsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadDeck();
  }, [loadDeck]);

  useEffect(() => {
    if (tab !== TABS.results) return;

    loadResults({ silent: false });
    const intervalId = setInterval(() => {
      loadResults({ silent: true });
    }, RESULTS_POLL_MS);

    return () => clearInterval(intervalId);
  }, [tab, loadResults]);

  const handleVote = async (choice) => {
    if (!currentItem || voting) return;

    const itemId = currentItem.id;
    const previousChoice = sessionChoices.get(itemId) ?? null;

    setVoting(true);
    try {
      await submitVote(itemId, choice);
      setVotedIds((prev) => new Set(prev).add(itemId));
      setSessionChoices((prev) => new Map(prev).set(itemId, choice));
      setLastUndo({ itemId, previousChoice });
      setReplayItemId(null);
    } catch (err) {
      setError(err.message || 'Vote failed. Please try again.');
    } finally {
      setVoting(false);
    }
  };

  const handleUndo = async () => {
    if (!lastUndo || undoing || voting) return;

    const { itemId, previousChoice } = lastUndo;
    setUndoing(true);
    try {
      if (previousChoice === null) {
        await deleteVote(itemId);
        setSessionChoices((prev) => {
          const next = new Map(prev);
          next.delete(itemId);
          return next;
        });
      } else {
        await submitVote(itemId, previousChoice);
        setSessionChoices((prev) => new Map(prev).set(itemId, previousChoice));
      }

      setVotedIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
      setReplayItemId(itemId);
      setLastUndo(null);
      setError(null);
    } catch (err) {
      setError(err.message || 'Could not undo vote. Please try again.');
    } finally {
      setUndoing(false);
    }
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-[390px] flex-col overflow-x-hidden bg-cream shadow-2xl ring-1 ring-stone-200/60">
      <header className="shrink-0 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[1.65rem] font-bold leading-none tracking-tight">
              PawSwipe
            </h1>
            {!loading && totalCount > 0 && (
              <p className="mt-1.5 text-sm font-semibold tabular-nums text-ink">
                {deckFinished ? (
                  <span className="text-mint">Complete · {totalCount} / {totalCount}</span>
                ) : (
                  <>
                    <span className="text-ink">{progressCurrent}</span>
                    <span className="text-stone-400"> / {totalCount}</span>
                  </>
                )}
              </p>
            )}
          </div>
          <nav
            className="flex shrink-0 rounded-full bg-white p-0.5 shadow-sm ring-1 ring-stone-200"
            aria-label="Main navigation"
          >
            <button
              type="button"
              onClick={() => setTab(TABS.swipe)}
              className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                tab === TABS.swipe ? 'bg-ink text-cream' : 'text-stone-600'
              }`}
            >
              Swipe
            </button>
            <button
              type="button"
              onClick={() => setTab(TABS.results)}
              className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                tab === TABS.results ? 'bg-ink text-cream' : 'text-stone-600'
              }`}
            >
              Results
            </button>
          </nav>
        </div>

        {tab === TABS.swipe && lastUndo && !loading && (
          <button
            type="button"
            onClick={handleUndo}
            disabled={undoing || voting}
            className="mt-2 text-xs font-semibold text-stone-600 underline-offset-2 hover:underline hover:text-ink disabled:opacity-50"
          >
            {undoing ? 'Undoing…' : 'Undo last vote'}
          </button>
        )}

        {!loading && totalCount > 0 && tab === TABS.swipe && (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand">
            <div
              className="h-full rounded-full bg-mint transition-[width] duration-300 ease-out"
              style={{ width: `${deckFinished ? 100 : progressPct}%` }}
            />
          </div>
        )}
      </header>

      <main className="relative min-h-0 flex-1 overflow-hidden px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {tab === TABS.swipe && (
          <div className="flex h-full min-h-0 flex-col">
            {loading && (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-stone-500">Loading adoptable friends…</p>
              </div>
            )}

            {!loading && error && (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
                <p className="text-sm text-coral">{error}</p>
                <button
                  type="button"
                  onClick={loadDeck}
                  className="rounded-full border border-ink/20 bg-white px-5 py-2 text-sm font-medium shadow-sm"
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && deckFinished && (
              <EndState
                totalCount={totalCount}
                onViewResults={() => setTab(TABS.results)}
              />
            )}

            {!loading && !error && !deckFinished && currentItem && (
              <div className="relative min-h-0 flex-1">
                <SwipeCard
                  key={currentItem.id}
                  item={currentItem}
                  onVote={handleVote}
                  disabled={voting}
                />

                <div
                  className="pointer-events-none absolute -bottom-0.5 left-1/2 -z-10 h-[98%] w-[94%] max-w-full -translate-x-1/2 rounded-3xl bg-white/50 shadow-md"
                  aria-hidden
                />
              </div>
            )}
          </div>
        )}

        {tab === TABS.results && (
          <ResultsView
            results={results}
            loading={resultsLoading}
            error={resultsError}
            onRetry={() => loadResults({ silent: false })}
            lastUpdated={resultsUpdatedAt}
          />
        )}
      </main>
    </div>
  );
}
