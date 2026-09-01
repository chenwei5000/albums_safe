# Album Safe

一个用于本地联调的响应式图片数据管理台。前端基于 React/Vinext，服务端 API 运行在 Cloudflare Workers 兼容的 Edge Runtime；分类和数据记录写入 KV，图片写入 R2 Blob。

## 本地运行

```bash
npm install
npm run dev
```

打开终端给出的本地地址（默认 `http://localhost:3000`）。Wrangler/Miniflare 会把 KV 与 Blob 数据保存在项目内的 `.wrangler` 目录，重启后仍可继续联调。

## 联调流程

1. 首页以瀑布流卡片展示全部影集，可按标题搜索或切换分类筛选。
2. 从顶部“上传图片”进入独立表单；选中图片后会自动上传 PNG、JPG、WebP 或 GIF（最大 8MB）。
3. 填写必填标题，从下拉框选择分类，也可以在表单内直接创建新分类。
4. 点击底部“添加到影集”，成功后自动返回首页。
5. 点击首页卡片进入详情；点击详情图片可打开窗口级大图预览，详情底部可确认删除数据及其图片。

## API

- `GET /api/categories`：读取分类
- `POST /api/categories`：添加分类
- `GET /api/entries`：读取数据列表
- `POST /api/entries`：添加数据
- `GET /api/entries/:id`：读取单条详情
- `DELETE /api/entries/:id`：删除单条数据及对应 Blob 图片
- `POST /api/upload`：上传图片
- `GET /api/images/:key`：读取 Blob 图片

## 检查

```bash
npm run lint
npm run build
```
