import '@testing-library/jest-dom'

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}

  disconnect() {
    return null;
  }

  observe() {
    return null;
  }

  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(cb) {
    this.cb = cb;
  }
  observe() {
    this.cb([{ borderBoxSize: { inlineSize: 0, blockSize: 0 } }], this);
  }
  unobserve() {}
  disconnect() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock AudioContext for audio processing tests
global.AudioContext = jest.fn().mockImplementation(() => ({
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    gain: {
      setValueAtTime: jest.fn(),
    },
  })),
  createOscillator: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  })),
  destination: {},
  close: jest.fn(),
}));

// Mock File API
global.File = class File {
  constructor(fileBits, fileName, options) {
    this.name = fileName;
    this.size = fileBits.reduce((acc, bit) => acc + bit.length, 0);
    this.type = options?.type || '';
    this.lastModified = Date.now();
  }
};

// Mock FileReader
global.FileReader = class FileReader {
  constructor() {
    this.readyState = 0;
    this.result = null;
  }
  
  readAsDataURL(file) {
    this.readyState = 2;
    this.result = `data:${file.type};base64,mock-base64-data`;
    if (this.onload) this.onload();
  }
  
  readAsArrayBuffer(file) {
    this.readyState = 2;
    this.result = new ArrayBuffer(8);
    if (this.onload) this.onload();
  }
};