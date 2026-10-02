import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    clearMocks: true,
    env: { JWT_SECRET: 'secreto_de_tests_solo_para_vitest_0123456789' },
  },
})
