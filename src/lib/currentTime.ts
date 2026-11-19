/** قرارة الوقت في مكان منفصل عن مكوّنات React عشان Prerender ما يقرأش وقت متغيّر */
export function currentTime(): number {
  return Date.now();
}
