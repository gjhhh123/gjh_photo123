// build.mjs —— 零依赖构建脚本：读取站点与照片数据，生成静态 HTML 页面，并打包 CSS/JS/图片到 dist/
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const dist = join(root, 'dist');

const site = JSON.parse(readFileSync(join(src, 'data', 'site.json'), 'utf8'));
const { series, photos } = JSON.parse(readFileSync(join(src, 'data', 'photos.json'), 'utf8'));

const esc = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const bySeries = (slug) => photos.filter((photo) => photo.series === slug);
const coverOf = (slug) => {
  const item = series.find((seriesItem) => seriesItem.slug === slug);
  const coverPhoto = item && item.cover
    ? photos.find((photo) => photo.series === slug && photo.id === item.cover)
    : null;
  return coverPhoto || bySeries(slug)[0];
};

const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%231A1A1A'/%3E%3Crect x='7' y='7' width='18' height='18' fill='%23FAFAF8'/%3E%3C/svg%3E";

const xiaohongshuUrl = `https://www.xiaohongshu.com/user/profile/${site.xiaohongshu}`;

function resolveUrl(url, base) {
  if (/^(https?:)?\/\//.test(url) || url.startsWith('/')) { return url; }
  return base + url;
}

function resolveSrcset(srcset, base) {
  return srcset
    .split(', ')
    .map((entry) => {
      const [url, ...rest] = entry.split(' ');
      return `${resolveUrl(url, base)} ${rest.join(' ')}`;
    })
    .join(', ');
}

function picsumSrcset(src, width, height) {
  const match = /^https:\/\/picsum\.photos\/seed\/([^/]+)\//.exec(src);
  if (!match) { return ''; }
  const seed = match[1];
  const widths = [...new Set([480, 768, 1080, 1440].filter((w) => w < width).concat(width))]
    .sort((a, b) => a - b);
  return widths
    .map((w) => `https://picsum.photos/seed/${seed}/${w}/${Math.round((w * height) / width)} ${w}w`)
    .join(', ');
}

function imgTag(photo, { loading, decoding, sizes, fetchpriority, style } = {}, base = './') {
  const srcset = photo.srcset || picsumSrcset(photo.src, photo.width, photo.height);
  const attrs = [
    `src="${resolveUrl(photo.src, base)}"`,
    srcset ? `srcset="${resolveSrcset(srcset, base)}"` : '',
    sizes ? `sizes="${sizes}"` : '',
    `alt="${esc(photo.alt)}"`,
    `width="${photo.width}"`,
    `height="${photo.height}"`,
    loading ? `loading="${loading}"` : '',
    decoding ? `decoding="${decoding}"` : '',
    fetchpriority ? `fetchpriority="${fetchpriority}"` : '',
    style ? `style="${style}"` : ''
  ].filter(Boolean);
  return `<img ${attrs.join(' ')}>`;
}

function navMarkup(base, active) {
  const links = [
    ['index.html', '作品', 'work'],
    ['contact.html', '联系', 'contact']
  ];
  const items = links.map(([href, label, key]) => {
    const current = active === key ? ' aria-current="page"' : '';
    return `<a href="${base}${href}"${current}>${label}</a>`;
  }).join('\n');
  return `<header class="site-header">
    <a class="site-name" href="${base}index.html">${esc(site.name)}</a>
    <nav class="site-nav" aria-label="主导航">${items}</nav>
  </header>`;
}

function footerMarkup(base) {
  const year = new Date().getFullYear();
  return `<footer class="site-footer">
    <div class="footer-inner">
      <p class="footer-name">${esc(site.name)}</p>
      <nav class="footer-nav" aria-label="页脚导航">
        <a href="${base}index.html">作品</a>
        <a href="${base}contact.html">联系</a>
      </nav>
      <ul class="footer-links">
        <li><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></li>
        <li><a href="${esc(xiaohongshuUrl)}" target="_blank" rel="noopener noreferrer">小红书</a></li>
      </ul>
      <p class="footer-copy">© ${year} ${esc(site.name)} · 保留所有权利</p>
    </div>
  </footer>`;
}

function lightboxMarkup() {
  return `<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="图片灯箱" hidden>
    <div class="lightbox-backdrop" data-lightbox-close></div>
    <span class="lightbox-counter" aria-hidden="true"></span>
    <button class="lightbox-close" type="button" data-lightbox-close aria-label="关闭灯箱"><span aria-hidden="true">×</span></button>
    <button class="lightbox-prev" type="button" aria-label="上一张"><span aria-hidden="true">←</span></button>
    <figure class="lightbox-stage">
      <img class="lightbox-img" src="" alt="">
      <figcaption class="lightbox-caption">
        <span class="lightbox-title"></span>
        <span class="lightbox-meta"></span>
      </figcaption>
    </figure>
    <button class="lightbox-next" type="button" aria-label="下一张"><span aria-hidden="true">→</span></button>
  </div>`;
}

function pageShell({ title, description, base, active, content }) {
  return `<!doctype html>
<html lang="${site.lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="color-scheme" content="light">
  <link rel="icon" href="${FAVICON}">
  <link rel="stylesheet" href="${base}assets/styles.css">
</head>
<body>
  <a class="skip-link" href="#main">跳到主要内容</a>
  ${navMarkup(base, active)}
  ${content}
  ${footerMarkup(base)}
  <script src="${base}assets/lightbox.js" defer></script>
</body>
</html>`;
}

function indexPage(base) {
  const cards = series.map((item) => {
    const cover = coverOf(item.slug);
    return `<li>
      <a class="work-card-link" href="${base}work/${item.slug}.html">
        <figure class="work-card">
          <span class="work-card-media">${imgTag(cover, { loading: 'lazy', decoding: 'async', sizes: '(min-width: 900px) 33vw, (min-width: 600px) 50vw, 100vw', style: item.coverPosition ? `object-position: ${item.coverPosition}` : '' }, base)}</span>
          <figcaption class="work-card-caption">
            <span class="work-card-title">${esc(item.title)}</span>
            <span class="work-card-year">${esc(item.year)}</span>
          </figcaption>
        </figure>
      </a>
    </li>`;
  }).join('\n');

  const hero = site.hero;
  return `<main id="main">
    <section class="hero" aria-label="首页主视觉">
      ${imgTag(hero, { loading: 'eager', decoding: 'async', fetchpriority: 'high', sizes: '100vw' }, base)}
      <div class="hero-scrim" aria-hidden="true"></div>
      <div class="hero-copy">
        <p class="hero-kicker">摄影作品集</p>
        <h1 class="hero-title">${esc(site.name)}</h1>
        <p class="hero-tagline">${esc(site.tagline)}</p>
      </div>
    </section>
    <section class="work-section" aria-labelledby="work-heading">
      <div class="container">
        <h2 class="section-title" id="work-heading">作品</h2>
        <ul class="work-grid">${cards}</ul>
      </div>
    </section>
  </main>`;
}

function workPage(seriesItem, base) {
  const list = bySeries(seriesItem.slug);
  const items = list.map((photo, index) => `<figure class="photo">
      <button class="photo-open" type="button" data-photo-index="${index}" aria-haspopup="dialog">
        ${imgTag(photo, { loading: index === 0 ? 'eager' : 'lazy', decoding: 'async', sizes: '(min-width: 900px) 33vw, (min-width: 600px) 50vw, 100vw' }, base)}
      </button>
      <figcaption class="photo-caption">
        <span>${esc(photo.title)}</span>
        <span>${esc(photo.year)}</span>
      </figcaption>
    </figure>`).join('\n');

  return `<main id="main" class="container">
    <header class="page-header">
      <h1>${esc(seriesItem.title)}</h1>
      <p class="page-meta">${esc(seriesItem.year)}</p>
      <p class="page-desc">${esc(seriesItem.description)}</p>
    </header>
    <div class="series-list">${items}</div>
  </main>`;
}

function contactPage(base) {
  return `<main id="main" class="container">
    <div class="contact-page">
      <h1>联系</h1>
      <p class="contact-intro">如果你喜欢我的作品，或想聊聊合作，欢迎通过以下方式找到我。</p>
      <ul class="contact-list">
        <li><span>邮箱</span><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></li>
        <li><span>小红书</span><a href="${esc(xiaohongshuUrl)}" target="_blank" rel="noopener noreferrer">小红书号 ${esc(site.xiaohongshu)}</a></li>
      </ul>
    </div>
  </main>`;
}

function build() {
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(join(dist, 'assets'), { recursive: true });
  mkdirSync(join(dist, 'work'), { recursive: true });

  const cssOrder = ['reset.css', 'tokens.css', 'base.css', 'components.css', 'lightbox.css'];
  const css = cssOrder.map((file) => readFileSync(join(src, 'styles', file), 'utf8')).join('\n');
  writeFileSync(join(dist, 'assets', 'styles.css'), css, 'utf8');
  writeFileSync(join(dist, 'assets', 'lightbox.js'), readFileSync(join(src, 'js', 'lightbox.js'), 'utf8'), 'utf8');
  cpSync(join(src, 'assets'), join(dist, 'assets'), { recursive: true });

  writeFileSync(join(dist, 'index.html'), pageShell({
    title: `${site.name} · 摄影作品集`,
    description: site.description,
    base: './',
    active: 'work',
    content: indexPage('./')
  }), 'utf8');

  writeFileSync(join(dist, 'contact.html'), pageShell({
    title: `联系 · ${site.name}`,
    description: `联系 ${site.name} 的方式：邮箱与社交媒体。`,
    base: './',
    active: 'contact',
    content: contactPage('./')
  }), 'utf8');

  for (const seriesItem of series) {
    const content = workPage(seriesItem, '../') + lightboxMarkup();
    writeFileSync(join(dist, 'work', `${seriesItem.slug}.html`), pageShell({
      title: `${seriesItem.title} · ${site.name}`,
      description: seriesItem.description,
      base: '../',
      active: 'work',
      content
    }), 'utf8');
  }

  console.log(`构建完成：${series.length} 个系列 / ${photos.length} 张照片 → dist/`);
}

build();
