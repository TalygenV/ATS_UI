// import { defineConfig } from 'vite';
// import vue from '@vitejs/plugin-vue';

// export default defineConfig({
//   plugins: [vue()],
//   server: {
//     port: 8080,
//     proxy: {
//       '/api': {
//         //target: 'https://resumeparserats.netlify.app/',
//         target: 'http://localhost:3000',
//         changeOrigin: true
//       },
//       '/talygen': {
//         target: 'https://stagefilemedia.talygen.com',
//         changeOrigin: true,
//         secure: true,
//         rewrite: (path) => path.replace(/^\/talygen/, '')
//       }
//     }
//   }
// });

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [vue()],
    server: {
        port: 8080,
        proxy: {
            '/api': {
                // Your existing API proxy configuration
                //target: 'https://resumeparserats.netlify.app/',
                // target: 'https://resumeatsapi.netlify.app/',
                // target: 'http://localhost:3000',
                target: 'http://174.127.114.194:3536/',
                changeOrigin: true
            },
            // Proxy configuration for the Talygen file download
            '/talygen': {
                target: 'https://appfilemedia.talygen.com',
                changeOrigin: true,
                secure: true,
                rewrite: (path) => path.replace(/^\/talygen/, '')
            }
        }
    }
});