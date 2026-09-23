import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    server: {
        host: '127.0.0.1', // Avoid IPv6 [::1] so CSP script-src matches without parsing issues
    },
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
    build: {
        chunkSizeWarningLimit: 1200,
        rollupOptions: {
            maxParallelFileOps: 20,
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('handsontable')) {
                            return 'vendor-handsontable';
                        }
                        if (id.includes('exceljs')) {
                            return 'vendor-exceljs';
                        }
                        if (id.includes('@xyflow')) {
                            return 'vendor-flow';
                        }
                        if (id.includes('recharts') || id.includes('d3-')) {
                            return 'vendor-charts';
                        }
                        if (id.includes('firebase')) {
                            return 'vendor-firebase';
                        }
                        if (id.includes('lucide-react')) {
                            return 'vendor-icons';
                        }
                        if (id.includes('react') || id.includes('react-dom') || id.includes('@inertiajs')) {
                            return 'vendor-core';
                        }
                    }
                },
            },
        },
    },
});
