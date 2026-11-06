import { fileURLToPath } from "node:url";

import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // O Next cuida do "server-only" no build. Os testes rodam fora do Next,
      // então ele vira um módulo vazio (como no guia de testes do Next).
      "server-only": fileURLToPath(new URL("./test/server-only.ts", import.meta.url)),
    },
  },
  test: {
    // e2e/ é do Playwright (npm run test:e2e), que roda num navegador de verdade.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
