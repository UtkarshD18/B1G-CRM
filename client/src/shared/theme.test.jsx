import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThemeProvider, useTheme, getInitialTheme } from './theme';

function DummyConsumer() {
  const { isDarkMode, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-status">{isDarkMode ? 'dark' : 'light'}</span>
      <button data-testid="theme-toggle" onClick={toggleTheme}>
        Toggle
      </button>
    </div>
  );
}

describe('Theme System & Browser Preference', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.body.className = '';
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  test('defaults to browser preference when no localStorage is set (dark)', () => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query.includes('dark'),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    expect(getInitialTheme()).toBe(true);
  });

  test('defaults to browser preference when no localStorage is set (light)', () => {
    window.matchMedia = jest.fn().mockImplementation(() => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    expect(getInitialTheme()).toBe(false);
  });

  test('prioritizes omnicrm-theme in localStorage over system preference', () => {
    window.matchMedia = jest.fn().mockImplementation(() => ({
      matches: true,
      media: '',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    localStorage.setItem('omnicrm-theme', 'light');
    expect(getInitialTheme()).toBe(false);

    localStorage.setItem('omnicrm-theme', 'dark');
    expect(getInitialTheme()).toBe(true);
  });

  test('ThemeProvider toggles theme and synchronizes DOM classes and localStorage', async () => {
    window.matchMedia = jest.fn().mockImplementation(() => ({
      matches: false,
      media: '',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    render(
      <ThemeProvider>
        <DummyConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('theme-status')).toHaveTextContent('light');
    expect(document.documentElement.classList.contains('dark-theme')).toBe(false);

    await act(async () => {
      fireEvent.click(screen.getByTestId('theme-toggle'));
    });

    expect(screen.getByTestId('theme-status')).toHaveTextContent('dark');
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true);
    expect(localStorage.getItem('omnicrm-theme')).toBe('dark');
  });
});
