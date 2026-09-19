import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Absolute paths anchored at this file, so the lib build works
// regardless of the working directory it is started from.
const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [react()],
	root: resolve(__dirname, '..'),

	build: {
		target: 'es2020',
		outDir: 'lib',

		lib: {
			entry: resolve(__dirname, 'index.ts'),
			formats: ['es', 'cjs'],
			fileName: format => (format === 'es' ? 'index.js' : 'index.cjs'),
		},
		rollupOptions: {
			external: ['react', 'react-dom'],
		},

		minify: false,
		sourcemap: false,
	},

	define: {
		'process.env.NODE_ENV': '"production"',
	},
	optimizeDeps: {
		exclude: ['react', 'react-dom'],
	},
	ssr: {
		noExternal: ['react', 'react-dom'],
	},
});
