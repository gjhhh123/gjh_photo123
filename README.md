# 摄影作品个人网站

一个极简风格的摄影作品静态站点：原生 HTML + CSS + JS，零后端、零数据库、零第三方追踪脚本，运行时零依赖。所有页面由零依赖的 Node 构建脚本 `scripts/build.mjs` 从 `src/data/photos.json` 与 `src/data/site.json` 生成到 `dist/`。

## 技术栈

- 原生 HTML + CSS + JS（无 UI 组件库、无 CSS 框架、无 Bootstrap）
- 构建期脚本：Node（仅 `npm run build`，无第三方 npm 依赖）
- 运行时 JS 仅 `assets/lightbox.js`（灯箱交互），不加载任何外部 JS/CSS/字体

## 目录结构

```
photo/
├─ src/
│  ├─ data/
│  │  ├─ site.json          # 站点文案：名称、标语、邮箱、社交链接、站点文案
│  │  └─ photos.json        # 系列 + 照片数据（新增/替换照片只需改这个文件）
│  ├─ assets/
│  │  └─ photos/            # 网页图片（按系列分文件夹，构建时复制到 dist/assets）
│  ├─ styles/               # 手写 CSS，构建时按顺序合并为 dist/assets/styles.css
│  │  ├─ reset.css
│  │  ├─ tokens.css
│  │  ├─ base.css
│  │  ├─ components.css
│  │  └─ lightbox.css
│  └─ js/
│     └─ lightbox.js        # 灯箱交互（运行时唯一 JS）
├─ scripts/
│  └─ build.mjs             # 零依赖构建脚本
├─ photo_file/              # 你的原始照片（不进网站、已被 .gitignore 忽略）
├─ dist/                    # 构建产物（可静态托管）
├─ package.json
└─ README.md
```

## 本地启动

```bash
# 1. 生成静态页面（Node 18+，无需 npm install）
npm run build

# 2. 在 dist 目录起一个静态服务器
python -m http.server 8080 --directory dist
# 或
npx serve dist
```

浏览器打开 `http://localhost:8080`。页面使用相对路径，也可直接双击 `dist/index.html` 预览（推荐用本地服务器）。

## 替换照片与文案

1. 照片：编辑 `src/data/photos.json`，每张照片字段：
   - `src`：图片地址（相对站点根目录，如 `assets/photos/xxx/name-2048w.jpg`）
   - `srcset`：多尺寸列表（如 `assets/photos/xxx/name-640w.jpg 640w, ...-2048w.jpg 2048w`）
   - `alt`：语义化替代文本
   - `title`：照片标题
   - `year`：年份
   - `series`：所属系列 `slug`
   - `width` / `height`：图片像素宽高（写死尺寸、避免布局偏移）
2. 文案与联系方式：编辑 `src/data/site.json`（站点名、标语、邮箱、小红书链接）。
3. 把图片文件放到 `src/assets/photos/` 下对应目录。
4. 重新构建：`npm run build`。

> 建议图片先压缩成网页尺寸（长边约 2048px、JPEG 质量 80 左右）并生成多尺寸 `srcset`，避免直接上传原始大图拖慢加载。

## 新增一个摄影系列

1. 在 `src/data/photos.json` 的 `series` 数组新增一项：
   ```json
   { "slug": "new-series", "title": "New Series", "year": "2026", "description": "……" }
   ```
2. 把图片放到 `src/assets/photos/new-series/`，并在 `photos` 数组中新增照片记录（`series` 填 `"new-series"`）。
3. 运行 `npm run build`。首页会自动多出一张系列卡片，并生成 `dist/work/new-series.html`。

## 设计与可访问性要点

- 内容区最大宽度 1200px，作品网格间距 24px，背景 `#FAFAF8`、正文近黑 `#1A1A1A`，仅中性色。
- 系统字体栈，无外部字体请求；正文 16px、行高 1.7。
- 灯箱支持 Esc 关闭、左右方向键切换、点击遮罩关闭、打开时锁定滚动、焦点圈定、关闭后焦点回到触发元素。
- 所有图片带 `alt`，装饰元素 `aria-hidden`，全站可键盘操作并有 `:focus-visible` 焦点样式。
- 所有动效 ≤ 300ms，并响应 `prefers-reduced-motion`（关闭动效）。

## 自检清单

- [x] 纯静态站点，无 UI 组件库、无 Bootstrap、无后端、无数据库、无追踪脚本
- [x] 运行时零外部依赖（仅构建期 Node 脚本）
- [x] 首页：全屏主视觉 + 等宽三列作品网格，hover 淡入标题与年份
- [x] 系列详情页：标题、简介、逐张垂直流式排列，点击进入灯箱
- [x] 联系页：邮箱 / 小红书，无表单
- [x] 内容区最大宽度 1200px，网格间距 24px
- [x] 配色仅中性色（#FAFAF8 / #1A1A1A），无强调色
- [x] 系统字体栈，正文 16px、行高 1.7，标题小字距/轻字重，无渐变/阴影/圆角/发光
- [x] 动效 ≤ 300ms，响应 prefers-reduced-motion
- [x] 照片数据集中在 src/data/photos.json，含 src/alt/title/year/series/width/height
- [x] 写死 width/height，首屏 eager，其余 lazy + decoding async，并提供 srcset
- [x] 灯箱支持 Esc / 方向键 / 遮罩关闭 / 滚动锁定 / 焦点圈定 / 焦点返回
- [x] 图片语义化 alt，装饰元素 aria-hidden，:focus-visible 可见焦点
- [x] 语义化 header/main/nav/figure/figcaption，标题层级不跳级
- [x] 不使用 !important，每个文件顶部有用途注释
- [x] 无虚假评价/奖项/社交证明，无轮播/视差/粒子等花哨效果

> 站点文案（姓名「JUN」、自我介绍、器材与经历、邮箱与社交链接）均为占位示例，请替换为你的真实信息。
