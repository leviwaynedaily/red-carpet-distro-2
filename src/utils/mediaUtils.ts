// Add timestamp to URLs to prevent caching
export const addVersionToUrl = (url: string) => {
  if (!url) return url;
  const timestamp = new Date().getTime();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${timestamp}`;
}; 