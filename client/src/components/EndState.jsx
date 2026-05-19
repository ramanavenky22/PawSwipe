export default function EndState({ onViewResults, totalCount }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <span className="mb-3 text-5xl" aria-hidden>
        🐾
      </span>
      <h2 className="font-display text-2xl font-bold text-ink">You&apos;re all caught up!</h2>
      <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-stone-600">
        You&apos;ve voted on all {totalCount} adoptable friends. See how the community ranks them.
      </p>
      <button
        type="button"
        onClick={onViewResults}
        className="mt-6 w-full max-w-[240px] rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-cream shadow-card transition active:scale-[0.98] hover:bg-stone-800"
      >
        View Results
      </button>
    </div>
  );
}
