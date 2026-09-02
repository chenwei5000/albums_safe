// Next.js 自动加载 postcss.config.mjs；Tailwind v4 通过 PostCSS 插件接入。
// Vinext 时期该配置写在 vite.config.ts 内，迁移 Next 后需要独立文件。
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;