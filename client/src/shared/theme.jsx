import { createContext, useContext, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

const ThemeContext = createContext({
  isDarkMode: false,
  toggleTheme: () => {},
});

export function getInitialTheme() {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem('omnicrm-theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;

    const legacy = localStorage.getItem('darkMode');
    if (legacy === 'true') return true;
    if (legacy === 'false') return false;

    // Default to user's browser / OS preference
    if (window.matchMedia && typeof window.matchMedia === 'function') {
      return Boolean(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  } catch {
    // ignore
  }
  return false;
}

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);
  const [fallbackWave, setFallbackWave] = useState(null);

  // Sync dark theme class on documentElement and body with warm light colors
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;

    if (isDarkMode) {
      root.classList.add('dark-theme');
      body.classList.add('dark-theme');
      body.style.backgroundColor = '#0a0a0a';
      body.style.color = '#ededed';
    } else {
      root.classList.remove('dark-theme');
      body.classList.remove('dark-theme');
      body.style.backgroundColor = '#faf8f5';
      body.style.color = '#1c1917';
    }
  }, [isDarkMode]);

  // Listen for browser/system preference changes if user hasn't set explicit override
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !window.matchMedia ||
      typeof window.matchMedia !== 'function'
    )
      return;
    try {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e) => {
        try {
          const userExplicit = localStorage.getItem('omnicrm-theme-user-choice');
          if (!userExplicit) {
            setIsDarkMode(Boolean(e.matches));
          }
        } catch {
          // ignore
        }
      };

      if (mq.addEventListener) {
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
      } else if (mq.addListener) {
        mq.addListener(handler);
        return () => mq.removeListener(handler);
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleTheme = (e) => {
    const btn =
      e?.currentTarget ||
      (typeof document !== 'undefined'
        ? document.getElementById('theme-toggle-btn') ||
          document.getElementById('portal-theme-toggle-btn')
        : null);

    let x = typeof window !== 'undefined' ? window.innerWidth - 120 : 100;
    let y = 75;
    let startRadius = 16;

    if (btn && typeof btn.getBoundingClientRect === 'function') {
      const rect = btn.getBoundingClientRect();
      x = Math.round(rect.left + rect.width / 2);
      y = Math.round(rect.top + rect.height / 2);
      startRadius = Math.round(Math.min(rect.width, rect.height) / 2);

      if (btn.classList) {
        btn.classList.remove('liquid-ripple-active');
        void btn.offsetWidth;
        btn.classList.add('liquid-ripple-active');
      }
    }

    const endRadius =
      typeof window !== 'undefined'
        ? Math.ceil(
            Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)),
          )
        : 1000;

    if (typeof document !== 'undefined' && document.documentElement?.style) {
      document.documentElement.style.setProperty('--theme-x', `${x}px`);
      document.documentElement.style.setProperty('--theme-y', `${y}px`);
      document.documentElement.style.setProperty('--theme-start-r', `${startRadius}px`);
      document.documentElement.style.setProperty('--theme-end-r', `${endRadius}px`);
    }

    const nextMode = !isDarkMode;

    const commitTheme = () => {
      setIsDarkMode(nextMode);
      try {
        localStorage.setItem('omnicrm-theme', nextMode ? 'dark' : 'light');
        localStorage.setItem('darkMode', String(nextMode));
        localStorage.setItem('omnicrm-theme-user-choice', 'true');
      } catch {
        // ignore
      }
    };

    if (typeof document !== 'undefined' && document.startViewTransition) {
      const transition = document.startViewTransition(() => {
        flushSync(() => {
          commitTheme();
        });
      });

      transition.ready.then(() => {
        try {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(${startRadius}px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 850,
              easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
              pseudoElement: '::view-transition-new(root)',
            },
          );
        } catch {
          // Handled by CSS @keyframes
        }
      });
    } else {
      commitTheme();
      setFallbackWave({
        x,
        y,
        radius: startRadius,
        targetRadius: endRadius,
        bg: nextMode ? '#0a0a0a' : '#faf8f5',
      });
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => {
          setFallbackWave((prev) => (prev ? { ...prev, radius: endRadius } : null));
        });
      }
      setTimeout(() => {
        setFallbackWave(null);
      }, 850);
    }
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
      {fallbackWave && (
        <div
          className="theme-wipe-canvas"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            pointerEvents: 'none',
            background: fallbackWave.bg,
            clipPath: `circle(${fallbackWave.radius}px at ${fallbackWave.x}px ${fallbackWave.y}px)`,
            transition: 'clip-path 850ms cubic-bezier(0.25, 0.1, 0.25, 1)',
          }}
        />
      )}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
