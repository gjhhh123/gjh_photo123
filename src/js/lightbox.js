// lightbox.js —— 图片灯箱交互：打开/关闭、键盘导航、焦点圈定与滚动锁定（运行时唯一 JS）
(function () {
  'use strict';

  var lightbox = document.getElementById('lightbox');
  if (!lightbox) { return; }

  var img = lightbox.querySelector('.lightbox-img');
  var titleEl = lightbox.querySelector('.lightbox-title');
  var metaEl = lightbox.querySelector('.lightbox-meta');
  var counterEl = lightbox.querySelector('.lightbox-counter');
  var closeBtn = lightbox.querySelector('.lightbox-close');
  var prevBtn = lightbox.querySelector('.lightbox-prev');
  var nextBtn = lightbox.querySelector('.lightbox-next');
  var closeTargets = lightbox.querySelectorAll('[data-lightbox-close]');

  var openers = Array.prototype.slice.call(document.querySelectorAll('.photo-open[data-photo-index]'));
  if (openers.length === 0) { return; }

  var current = -1;
  var lastFocused = null;

  var items = openers.map(function (btn) {
    var figure = btn.closest('figure');
    var image = btn.querySelector('img');
    var captionSpans = figure ? figure.querySelectorAll('.photo-caption span') : [];
    return {
      src: image.getAttribute('src'),
      alt: image.getAttribute('alt') || '',
      title: captionSpans[0] ? captionSpans[0].textContent : '',
      year: captionSpans[1] ? captionSpans[1].textContent : ''
    };
  });

  function show(index) {
    var item = items[index];
    img.src = item.src;
    img.alt = item.alt;
    titleEl.textContent = item.title;
    metaEl.textContent = item.year;
    counterEl.textContent = (index + 1) + ' / ' + items.length;
    prevBtn.disabled = items.length < 2;
    nextBtn.disabled = items.length < 2;
  }

  function open(index) {
    current = index;
    lastFocused = document.activeElement;
    show(index);
    lightbox.hidden = false;
    document.body.classList.add('no-scroll');
    document.addEventListener('keydown', onKeydown);
    closeBtn.focus();
  }

  function close() {
    lightbox.hidden = true;
    document.body.classList.remove('no-scroll');
    document.removeEventListener('keydown', onKeydown);
    current = -1;
    if (lastFocused && document.contains(lastFocused)) {
      lastFocused.focus();
    }
    lastFocused = null;
  }

  function navigate(delta) {
    if (items.length < 2) { return; }
    current = (current + delta + items.length) % items.length;
    show(current);
  }

  function focusables() {
    return [closeBtn, prevBtn, nextBtn].filter(function (el) { return !el.disabled; });
  }

  function trapFocus(event) {
    var els = focusables();
    if (els.length === 0) {
      event.preventDefault();
      return;
    }
    var first = els[0];
    var last = els[els.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (!lightbox.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    }
  }

  function onKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      navigate(1);
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      navigate(-1);
      return;
    }
    if (event.key === 'Tab') {
      trapFocus(event);
    }
  }

  openers.forEach(function (btn, index) {
    btn.addEventListener('click', function (event) {
      event.preventDefault();
      open(index);
    });
  });

  closeTargets.forEach(function (el) {
    el.addEventListener('click', close);
  });

  prevBtn.addEventListener('click', function () { navigate(-1); });
  nextBtn.addEventListener('click', function () { navigate(1); });
})();
