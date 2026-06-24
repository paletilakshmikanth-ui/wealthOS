'use client';

import { useSyncExternalStore } from 'react';

/**
 * Returns false on the server and during the initial hydration render,
 * then returns true on the next client render. Use this to gate rendering
 * of client-only state (localStorage, persisted Zustand, etc.) to avoid
 * hydration mismatches.
 */
function subscribe() {
  return () => {};
}

function getSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
