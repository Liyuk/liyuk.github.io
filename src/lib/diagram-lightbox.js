// A small, native dialog viewer for article diagrams. The source SVG remains
// available as a fallback link inside the viewer.
(function () {
  'use strict';

  const dialog = document.querySelector('[data-diagram-viewer]');
  if (!(dialog instanceof HTMLDialogElement)) return;

  const image = dialog.querySelector('[data-diagram-viewer-image]');
  const title = dialog.querySelector('[data-diagram-viewer-title]');
  const original = dialog.querySelector('[data-diagram-viewer-original]');
  const close = dialog.querySelector('[data-diagram-viewer-close]');
  const zoomOut = dialog.querySelector('[data-diagram-zoom-out]');
  const zoomIn = dialog.querySelector('[data-diagram-zoom-in]');
  const zoomReset = dialog.querySelector('[data-diagram-zoom-reset]');
  const zoomValue = dialog.querySelector('[data-diagram-zoom-value]');
  if (!(image instanceof HTMLImageElement) || !(title instanceof HTMLElement) || !(original instanceof HTMLAnchorElement) || !(close instanceof HTMLButtonElement) || !(zoomOut instanceof HTMLButtonElement) || !(zoomIn instanceof HTMLButtonElement) || !(zoomReset instanceof HTMLButtonElement) || !(zoomValue instanceof HTMLElement)) return;

  let zoom = 100;
  const updateZoom = () => {
    image.style.width = `${zoom}%`;
    zoomValue.textContent = `${zoom}%`;
    zoomOut.disabled = zoom <= 100;
    zoomIn.disabled = zoom >= 250;
  };

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest('figure.comment-diagram a[href]');
    if (!(link instanceof HTMLAnchorElement)) return;

    const sourceImage = link.querySelector('img');
    if (!(sourceImage instanceof HTMLImageElement)) return;

    event.preventDefault();
    image.src = link.href;
    image.alt = sourceImage.alt;
    const caption = link.closest('figure')?.querySelector('figcaption')?.firstChild?.textContent?.trim();
    title.textContent = caption || sourceImage.alt || document.title;
    original.href = link.href;
    zoom = 100;
    updateZoom();
    dialog.showModal();
    close.focus();
  });

  close.addEventListener('click', () => dialog.close());
  zoomOut.addEventListener('click', () => { zoom = Math.max(100, zoom - 25); updateZoom(); });
  zoomIn.addEventListener('click', () => { zoom = Math.min(250, zoom + 25); updateZoom(); });
  zoomReset.addEventListener('click', () => { zoom = 100; updateZoom(); });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    image.removeAttribute('src');
    image.alt = '';
  });
})();
