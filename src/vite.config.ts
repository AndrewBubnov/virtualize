import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],

	build: {
		target: 'es2020',
		outDir: 'lib',
		lib: {
			entry: 'src/index.ts',
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
