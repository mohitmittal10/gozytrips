export const DEFAULT_FALLBACK_PHOTOS = [
  'photo-1476514525535-07fb3b4ae5f1', // aerial landscape
  'photo-1506748686214-e9df14d4d9d0', // nature lake
  'photo-1469854523086-cc02fe5d8800', // road trip
  'photo-1436491865332-7a61a109cc05', // clouds over water
  'photo-1530789253388-582c481c54b0', // travel
  'photo-1501854140801-50d01698950b', // mountains
  'photo-1488085061387-422e29b40080', // night city
  'photo-1548013146-72479768bada', // taj mahal
];

export const getActivityFallbackUrl = (index: number, fallbackPhotos: string[] = DEFAULT_FALLBACK_PHOTOS) => {
  if (!fallbackPhotos || fallbackPhotos.length === 0) {
    fallbackPhotos = DEFAULT_FALLBACK_PHOTOS;
  }
  const slug = fallbackPhotos[index % fallbackPhotos.length];
  // If the string is already a full URL, return it directly
  if (slug.startsWith('http')) return slug;
  return `https://images.unsplash.com/${slug}?q=60&w=120&auto=format&fit=crop`;
};

