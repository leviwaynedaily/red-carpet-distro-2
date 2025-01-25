export const convertToWebP = async (file: File): Promise<{ webpBlob: Blob, originalFile: File }> => {
  // Create a canvas element
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Create an image element and load the file
  const img = new Image();
  const imageLoadPromise = new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });

  await imageLoadPromise;

  // Set canvas dimensions to match image
  canvas.width = img.width;
  canvas.height = img.height;

  // Draw image onto canvas
  ctx.drawImage(img, 0, 0);

  // Convert to WebP
  const webpBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert to WebP'));
        }
      },
      'image/webp',
      0.8 // quality
    );
  });

  // Clean up
  URL.revokeObjectURL(img.src);

  return {
    webpBlob,
    originalFile: file
  };
};

export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};