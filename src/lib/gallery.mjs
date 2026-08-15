export function getGalleryCover(gallery) {
  return gallery.data.images.find((image) => image.id === gallery.data.cover) ?? gallery.data.images[0];
}
