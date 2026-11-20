module.exports = {
  apps: [
    {
      name: 'botifyai-whatsapp-gateway',
      script: 'whatsapp-gateway/server.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3100,
        LARAVEL_API_URL: 'https://botifyai.cloud',
      },
    },
  ],
};
