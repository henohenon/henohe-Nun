import devServer from '@hono/vite-dev-server';
import UnoCSS from 'unocss/vite';
import { type Plugin, defineConfig } from 'vite';
import { BASE, SITE } from './src/site';
import { ssgPlugin } from './src/ssg';

/** Watch external files (outside module graph) and trigger full-reload on change. */
function watchExternalFiles(paths: string[]): Plugin {
  return {
    name: 'watch-external',
    configureServer(server) {
      for (const p of paths) server.watcher.add(p);
      server.watcher.on('change', (file) => {
        if (paths.some((p) => file.startsWith(p))) {
          server.hot.send({ type: 'full-reload' });
        }
      });
    },
  };
}


export default defineConfig({
  base: BASE,
  plugins: [
    watchExternalFiles(['benben']),
    UnoCSS(),
    devServer({
      entry: 'src/app.ts',
      exclude: [
        /\/@.+$/, // Vite internals (@vite/client, @fs, etc.)
        /\.\w+$/, // Files with extensions (static assets, client .ts)
      ],
    }),
    ssgPlugin({ base: BASE, site: SITE, benbenDir: 'benben' }),
  ],
  build: {
    rollupOptions: {
      input: 'index.html',
    },
  },
});
