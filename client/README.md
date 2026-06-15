# Client App

This directory contains the React + Vite SPA for the CRM admin, user, and agent portals.

## Commands

- `npm run dev`: start the Vite dev server.
- `npm run build`: create a production build.
- `npm run lint`: run the client ESLint config.
- `npm test`: run Jest once.
- `npm run test:watch`: run Jest in watch mode.
- `npm run test:coverage`: generate Jest coverage output.

## Testing Stack

- Jest runs the test environment with `jsdom`.
- React Testing Library is the baseline for rendering and interaction tests.
- Shared setup lives in `src/test/setupTests.js`.

## React Profiler

- Enable profiler logging with `VITE_ENABLE_REACT_PROFILER=true npm run dev`.
- The root app is wrapped by `src/profiler.jsx`.
- Timing metrics are printed with `console.table(...)` only when the env var is enabled.
