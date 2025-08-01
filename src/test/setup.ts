import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Electron API
Object.defineProperty(window, 'electronAPI', {
  value: {
    images: {
      save: vi.fn().mockResolvedValue('test-image.png'),
      get: vi.fn().mockResolvedValue('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')
    }
  },
  writable: true
})

// Mock CSS variables
const mockComputedStyle = {
  getPropertyValue: (prop: string) => {
    const mockValues: Record<string, string> = {
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#f5f5f5',
      '--text-primary': '#333333',
      '--text-secondary': '#666666',
      '--text-tertiary': '#999999',
      '--border-primary': '#e0e0e0',
      '--code-bg': '#f6f8fa',
      '--code-border': '#d0d7de',
      '--code-text': '#6e7781',
      '--primary-accent': '#0066cc',
      '--hover-light': '#f0f0f0'
    }
    return mockValues[prop] || ''
  }
}

Object.defineProperty(window, 'getComputedStyle', {
  value: () => mockComputedStyle,
  writable: true
})