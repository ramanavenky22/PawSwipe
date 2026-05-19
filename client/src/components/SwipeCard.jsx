import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import PetImage from './PetImage.jsx';

const SWIPE_THRESHOLD = 120;
const EXIT_X = 420;

export default function SwipeCard({ item, onVote, disabled }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 0, 220], [-12, 0, 12]);
  const yesBadgeOpacity = useTransform(x, [0, 50, 140], [0, 0.7, 1]);
  const noBadgeOpacity = useTransform(x, [-140, -50, 0], [1, 0.7, 0]);
  const yesTint = useTransform(x, [0, 40, 180], [0, 0.12, 0.32]);
  const noTint = useTransform(x, [-180, -40, 0], [0.32, 0.12, 0]);
  const yesScale = useTransform(x, [0, 140], [0.85, 1]);
  const noScale = useTransform(x, [-140, 0], [1, 0.85]);

  const commitVote = async (choice) => {
    if (disabled) return;
    const exitX = choice === 'yes' ? EXIT_X : -EXIT_X;
    await animate(x, exitX, { duration: 0.28, ease: [0.32, 0.72, 0, 1] });
    await onVote(choice);
    x.set(0);
  };

  const handleDragEnd = (_e, info) => {
    if (disabled) return;
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset > SWIPE_THRESHOLD || velocity > 600) {
      commitVote('yes');
    } else if (offset < -SWIPE_THRESHOLD || velocity < -600) {
      commitVote('no');
    } else {
      animate(x, 0, { type: 'spring', stiffness: 420, damping: 32 });
    }
  };

  return (
    <motion.article
      className="absolute inset-0 touch-none select-none"
      style={{ x, rotate, zIndex: 10 }}
      drag={disabled ? false : 'x'}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.85}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: 'grabbing' }}
    >
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-3xl bg-white shadow-card">
        <motion.div
          className="pointer-events-none absolute inset-0 z-30 bg-mint/50"
          style={{ opacity: yesTint }}
        />
        <motion.div
          className="pointer-events-none absolute inset-0 z-30 bg-coral/50"
          style={{ opacity: noTint }}
        />

        <motion.div
          className="pointer-events-none absolute left-1/2 top-8 z-40 -translate-x-1/2 rounded-2xl border-[3px] border-mint bg-white/95 px-6 py-2 font-display text-2xl font-bold tracking-widest text-mint shadow-lg"
          style={{ opacity: yesBadgeOpacity, scale: yesScale }}
        >
          YES
        </motion.div>
        <motion.div
          className="pointer-events-none absolute left-1/2 top-8 z-40 -translate-x-1/2 rounded-2xl border-[3px] border-coral bg-white/95 px-6 py-2 font-display text-2xl font-bold tracking-widest text-coral shadow-lg"
          style={{ opacity: noBadgeOpacity, scale: noScale }}
        >
          NO
        </motion.div>

        <div className="relative min-h-0 flex-[1.15] w-full">
          <PetImage item={item} className="h-full w-full" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
        </div>

        <div className="flex shrink-0 flex-col justify-between gap-3 px-4 pb-3 pt-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">
              {item.species}
            </p>
            <h2 className="truncate font-display text-2xl font-bold leading-tight text-ink">
              {item.name}
            </h2>
            <p className="mt-1 line-clamp-2 text-sm leading-snug text-stone-600">
              {item.description}
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 pb-1">
            <button
              type="button"
              disabled={disabled}
              onClick={() => commitVote('no')}
              className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border-2 border-coral/40 bg-white text-xl text-coral shadow-md transition active:scale-95 hover:bg-coral/10 disabled:opacity-40"
              aria-label="Vote no"
            >
              ✕
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => commitVote('yes')}
              className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full border-2 border-mint/40 bg-white text-2xl text-mint shadow-md transition active:scale-95 hover:bg-mint/10 disabled:opacity-40"
              aria-label="Vote yes"
            >
              ♥
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
