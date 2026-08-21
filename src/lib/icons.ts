export type IconName =
  | 'arrowLeft'
  | 'arrowRight'
  | 'arrowUpRight'
  | 'bookmark'
  | 'check'
  | 'chevronDown'
  | 'close'
  | 'copy'
  | 'heart'
  | 'menu'
  | 'nativeShare'
  | 'rss'
  | 'search'
  | 'share'
  | 'star'
  | 'theme';

export const iconPaths: Record<IconName, string> = {
  arrowLeft: '<path d="M20 12H5M11 6l-6 6 6 6"/>',
  arrowRight: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  arrowUpRight: '<path d="M5 19 19 5M9 5h10v10"/>',
  bookmark: '<path d="M6.5 4.5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v17l-5.5-3.2-5.5 3.2z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  chevronDown: '<path d="m5 9 7 7 7-7"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  copy: '<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  heart: '<path d="M20.8 8.7c0 5.3-8.8 10.1-8.8 10.1S3.2 14 3.2 8.7A4.7 4.7 0 0 1 12 6.3a4.7 4.7 0 0 1 8.8 2.4Z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  nativeShare: '<path d="M5 14.5h14V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-4.5Z"/><path d="M12 2.2 16.6 7.6h-2.8v7.4h-3.6V7.6H7.4Z"/>',
  rss: '<path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.2 4.2"/>',
  share: '<path d="M12 15V4M7.5 8 12 4l4.5 4M5 12v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>',
  star: '<path d="M12 3.5l2.6 5.27 5.82.85-4.21 4.1.99 5.79L12 16.9l-5.2 2.61.99-5.79-4.21-4.1 5.82-.85z"/>',
  theme: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/>',
};
