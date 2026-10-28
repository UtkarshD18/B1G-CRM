import { useEffect, useRef } from 'react';
import './inbox.css';

const filters = [
  { key: 'all', label: 'All' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'website', label: 'Website' },
];

export default function ChannelFilters({ value, onChange }) {
  const ref = useRef(null);
  useEffect(() => {
    const element = ref.current;
    const wheel = (event) => {
      if (element.scrollWidth <= element.clientWidth || event.ctrlKey) return;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      const canScroll =
        delta > 0
          ? element.scrollLeft < element.scrollWidth - element.clientWidth
          : element.scrollLeft > 0;
      if (canScroll) {
        event.preventDefault();
        element.scrollLeft +=
          delta * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientWidth : 1);
      }
    };
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, []);
  const reveal = (element) => element.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  function navigate(event) {
    const index = filters.findIndex((filter) => filter.key === event.target.dataset.channel);
    if (index < 0) return;
    const next = {
      ArrowRight: (index + 1) % filters.length,
      ArrowLeft: (index - 1 + filters.length) % filters.length,
      Home: 0,
      End: filters.length - 1,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const button = ref.current.querySelectorAll('button')[next];
    button.focus();
    reveal(button);
    onChange(filters[next].key);
  }
  return (
    <div
      className="channel-tabs"
      aria-label="Channel filter"
      role="group"
      ref={ref}
      onKeyDown={navigate}
    >
      {filters.map((filter) => (
        <button
          key={filter.key}
          data-channel={filter.key}
          type="button"
          className={`channel-tab${value === filter.key ? ' active' : ''}`}
          aria-pressed={value === filter.key}
          onFocus={(event) => reveal(event.currentTarget)}
          onClick={() => onChange(filter.key)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
