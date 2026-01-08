/// <reference types="vitest/globals" />
import '@testing-library/jest-dom/vitest'

declare global {
  namespace Vi {
    interface Assertion<T> extends jest.Matchers<void, T> {}
    interface AsymmetricMatchersContaining extends jest.AsymmetricMatchers {}
  }
}
