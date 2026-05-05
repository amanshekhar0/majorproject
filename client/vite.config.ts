import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        react(),
        // Strip broken sourceMappingURL from MediaPipe (the .map file doesn't exist in the NPM package)
        {
            name: 'remove-mediapipe-sourcemap',
            enforce: 'pre',
            transform(code, id) {
                if (id.includes('@mediapipe/tasks-vision')) {
                    return {
                        code: code.replace(/\/\/# sourceMappingURL=.*\s*$/g, ''),
                        map: null,
                    };
                }
            },
        },
    ],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
            },
        },
    },
    optimizeDeps: {
        exclude: ['@mediapipe/tasks-vision'],
    },
});
