// 分享/收藏行客户端逻辑。作为静态资源（public/）经 <script src defer> 引入，
// 全站只下载并缓存一次，不再在每个详情页内联重复。二维码已在服务端预渲染进
// 弹窗 DOM，因此本脚本不需要任何页面级变量，可以安全地作为静态文件共享。
(function () {
  'use strict';
  const row = document.querySelector('[data-share-row]');
  if (!row) return;

  const copyUrlValue = row.dataset.copyUrl || location.href;
  const nativeUrlValue = row.dataset.nativeUrl || row.dataset.copyUrl || location.href;
  const copyLabel = row.dataset.copyLabel || 'Copy link';
  const copiedLabel = row.dataset.copiedLabel || 'Copied';
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;
  const toggleBtn = row.querySelector('[data-share-toggle]');
  const popover = row.querySelector('[data-share-popover]');
  const toast = row.querySelector('.share-toast');
  let toastTimer = 0;

  const showToast = (text) => {
    if (!toast) return;
    toast.textContent = text;
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 3200);
  };

  // --- 复制链接 ---
  const copyBtn = row.querySelector('[data-share-copy]');
  const copyText = copyBtn && copyBtn.querySelector('[data-copy-text]');
  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(copyUrlValue);
      return true;
    } catch {
      const input = document.createElement('textarea');
      input.value = copyUrlValue;
      document.body.appendChild(input);
      input.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(input);
      return ok;
    }
  };
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      await copyUrl();
      if (copyText) copyText.textContent = copiedLabel;
      window.setTimeout(() => { if (copyText) copyText.textContent = copyLabel; }, 1500);
      showToast(copiedLabel);
    });
  }

  // --- 收藏：站内收藏（localStorage 切换，所有端可见） ---
  const FAV_KEY = 'liyuk-favorites';
  const readFavorites = () => {
    try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); }
    catch { return []; }
  };
  const writeFavorites = (list) => { localStorage.setItem(FAV_KEY, JSON.stringify(list)); };
  const favBtn = row.querySelector('[data-share-favorite]');
  if (favBtn) {
    const favLabelOn = favBtn.dataset.favLabelOn || 'Saved';
    const favLabelOff = favBtn.dataset.favLabel || 'Save';
    const favAdded = favBtn.dataset.favAdded || '';
    const favRemoved = favBtn.dataset.favRemoved || '';
    // 用当前页路径（相对）做收藏键，站内跳转稳定。
    const favUrl = location.pathname;
    const isFav = () => readFavorites().some((f) => f.url === favUrl);
    const favText = favBtn.querySelector('[data-fav-text]');
    const renderFav = () => {
      const on = isFav();
      if (favText) favText.textContent = on ? favLabelOn : favLabelOff;
      favBtn.setAttribute('aria-pressed', String(on));
      favBtn.classList.toggle('is-favorited', on);
    };
    favBtn.addEventListener('click', () => {
      const list = readFavorites();
      const idx = list.findIndex((f) => f.url === favUrl);
      if (idx >= 0) {
        list.splice(idx, 1);
        writeFavorites(list);
        showToast(favRemoved);
      } else {
        list.push({
          title: favBtn.dataset.favTitle || document.title,
          url: favUrl,
          type: favBtn.dataset.type || 'writing',
          savedAt: Date.now(),
        });
        writeFavorites(list);
        showToast(favAdded);
      }
      renderFav();
    });
    renderFav();
  }

  // --- 微信二维码弹窗：二维码已预渲染在 DOM，这里只做显隐与焦点 ---
  const wechatBtn = row.querySelector('[data-share-wechat]');
  const modal = document.querySelector('[data-share-modal]');
  const closeModal = () => {
    if (!modal) return;
    modal.hidden = true;
    if (toggleBtn) toggleBtn.focus();
  };
  const openWechatModal = () => {
    if (!modal) return;
    modal.hidden = false;
    const close = modal.querySelector('[data-share-modal-close]');
    if (close) close.focus();
  };
  if (wechatBtn) wechatBtn.addEventListener('click', openWechatModal);
  if (modal) {
    const close = modal.querySelector('[data-share-modal-close]');
    if (close) close.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  }

  // --- 系统分享（原生面板）：仅移动端显示 ---
  const nativeBtn = row.querySelector('[data-share-native]');
  if (nativeBtn) {
    if (canShare) {
      nativeBtn.addEventListener('click', () => {
        navigator.share({ title: document.title, url: nativeUrlValue }).catch(() => {});
      });
    } else {
      nativeBtn.hidden = true;
    }
  }

  // --- 分享面板：菜单语义 + 键盘导航 + 焦点管理 ---
  const menuItems = () => Array.from(popover ? popover.querySelectorAll('.share-popover-item') : []).filter((el) => !el.hidden);
  let activeIndex = -1;
  const openPopover = () => {
    if (!popover) return;
    popover.hidden = false;
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
    const items = menuItems();
    activeIndex = 0;
    if (items[0]) items[0].focus();
  };
  const closePopover = () => {
    if (!popover) return;
    const hadFocus = popover.contains(document.activeElement);
    popover.hidden = true;
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
    if (hadFocus && toggleBtn) toggleBtn.focus();
  };
  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (popover && popover.hidden) openPopover();
      else closePopover();
    });
  }
  document.addEventListener('click', (e) => {
    if (row && !row.contains(e.target)) closePopover();
  });
  if (popover) {
    popover.addEventListener('keydown', (e) => {
      const items = menuItems();
      if (!items.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIndex = (activeIndex + 1) % items.length;
        items[activeIndex].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = (activeIndex - 1 + items.length) % items.length;
        items[activeIndex].focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        activeIndex = 0;
        items[0].focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        activeIndex = items.length - 1;
        items[items.length - 1].focus();
      }
    });
    popover.addEventListener('click', (e) => {
      const target = e.target;
      if (target && target.closest('[data-share-wechat]')) {
        closePopover();
        openWechatModal();
      } else if (target && target.closest('[data-share-native]')) {
        closePopover();
      } else if (target && target.closest('a')) {
        closePopover();
      }
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeModal(); closePopover(); }
  });
})();
