// Minimal structural types shared across the pure lib modules. They are
// deliberately structural — no `astro:content` import — so the Node test
// suite can import these modules without a build step.

// An entry carrying the three dates the timeline helpers read. All four
// content collections satisfy this shape (research omits `updatedAt`).
export interface DatedEntry {
  data: {
    createdAt: Date;
    publishedAt?: Date;
    updatedAt?: Date;
  };
}

// An entry that can carry tags and/or a column assignment.
export interface ColumnableEntry {
  id: string;
  collection: string;
  data: {
    tags?: string[];
    column?: { slug: string; order: number };
  };
}

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
}
