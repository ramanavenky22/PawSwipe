import { useEffect, useRef, useState } from 'react';

function ImageUnavailable({ item, compact }) {
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-stone-200 via-sand to-amber-50 text-center ${
        compact ? 'gap-0.5 px-1 py-1' : 'gap-2 p-6'
      }`}
      role="img"
      aria-label={`${item.name}, ${item.species}, image unavailable`}
    >
      {!compact && (
        <p className="font-display text-xl font-bold leading-tight text-ink">{item.name}</p>
      )}
      <p
        className={`font-semibold uppercase tracking-widest text-stone-500 ${
          compact ? 'text-[9px]' : 'text-xs'
        }`}
      >
        {item.species}
      </p>
      <p className={`text-stone-400 ${compact ? 'text-[8px]' : 'text-sm'}`}>Image unavailable</p>
    </div>
  );
}

export default function PetImage({ item, className = '', imageClassName = '', compact = false }) {
  const imgRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const hasUrl = Boolean(item.imageUrl?.trim());
  const showUnavailable = failed || !hasUrl;

  const markLoadedIfReady = () => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  };

  useEffect(() => {
    if (!hasUrl) {
      setFailed(true);
      setLoaded(true);
      return;
    }

    setLoaded(false);
    setFailed(false);

    const probe = new Image();
    probe.onload = () => setLoaded(true);
    probe.onerror = () => {};
    probe.src = item.imageUrl;
    if (probe.complete && probe.naturalWidth > 0) {
      setLoaded(true);
    }

    return () => {
      probe.onload = null;
      probe.onerror = null;
    };
  }, [item.id, item.imageUrl, hasUrl]);

  useEffect(() => {
    if (!showUnavailable) {
      markLoadedIfReady();
    }
  }, [item.imageUrl, showUnavailable]);

  const handleError = () => {
    setFailed(true);
    setLoaded(true);
  };

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-stone-200 via-sand to-amber-100 ${className}`}
    >
      {!loaded && !showUnavailable && (
        <div className="absolute inset-0 z-10 animate-pulse bg-gradient-to-br from-stone-200/90 via-sand/80 to-amber-50" aria-hidden />
      )}

      {showUnavailable ? (
        <ImageUnavailable item={item} compact={compact} />
      ) : (
        <img
          ref={imgRef}
          src={item.imageUrl}
          alt={`${item.name}, ${item.species}`}
          draggable={false}
          loading="eager"
          onLoad={() => setLoaded(true)}
          onError={handleError}
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          } ${imageClassName}`}
        />
      )}
    </div>
  );
}
