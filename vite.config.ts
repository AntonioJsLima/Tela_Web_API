import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/atendimento': {
          target: 'https://www.fieg.com.br',
          changeOrigin: true,
          rewrite: (path) => {
            const url = new URL(path, 'https://www.fieg.com.br')
            url.pathname = '/crm/api/1/atendimento'
            url.searchParams.set('api_token', env.FIEG_API_TOKEN ?? '')
            return `${url.pathname}${url.search}`
          },
        },
      },
    },
  }
})
