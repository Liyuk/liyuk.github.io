import type { GalleryImage } from './types.ts';

export function getGalleryCover<T extends { data: { cover: string; images: GalleryImage[] } }>(
  gallery: T,
): GalleryImage {
  return (
    gallery.data.images.find((image) => image.id === gallery.data.cover) ??
    gallery.data.images[0]
  );
}
