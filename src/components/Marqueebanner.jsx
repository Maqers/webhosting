import { useEffect, useRef } from 'react';
import './Marqueebanner.css';

const Diamond = () => (
  <svg width="8" height="8" viewBox="0 0 10 10" fill="#1a1714" style={{ flexShrink: 0, opacity: 0.5 }}>
    <path d="M5 0L10 5L5 10L0 5Z" />
  </svg>
);

const items = [
  "Handcrafted with love",
  "Straight from artisan hands",
  "Find your class",
  "Ships across India",
  "Curated from Instagram's best",
  "One-of-a-kind pieces",
  "Support local artisans",
  "Ethnic elegance, modern edge",
];

export default function MarqueeBanner() {
  const trackRef = useRef(null);
  const posRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const start = () => {
      const halfWidth = track.scrollWidth / 2;
      const step = () => {
        posRef.current += 0.5;
        if (posRef.current >= halfWidth) posRef.current = 0;
        track.style.transform = `translateX(-${posRef.current}px)`;
        rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    };

    const timer = setTimeout(start, 100);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const allItems = [...items, ...items];

  return (
    <div className="marquee-banner">
      <div className="marquee-track" ref={trackRef}>
        {allItems.map((item, i) => (
          <span key={i} className="marquee-item">
            <Diamond />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}