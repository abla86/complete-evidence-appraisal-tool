import '@testing-library/jest-dom/vitest';

// jsdom can expose an unusable localStorage in some CI environments.
// Provide a deterministic in-memory implementation for component tests.
const createMemoryStorage = () => {
  let store = {};

  return {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
};

Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: createMemoryStorage(),
});
