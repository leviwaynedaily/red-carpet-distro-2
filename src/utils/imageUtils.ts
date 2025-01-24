export const convertToWebP = async (file: File): Promise<{ webpBlob: Blob }> => {
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
    webpBlob
  };
};

export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

export const extractVideoFrame = async (videoFile: File): Promise<{ webpBlob: Blob }> => {
  // Create video element
  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true; // Required for autoplay
  video.playsInline = true;
  
  // Create a promise that resolves when the video is ready
  const videoReady = new Promise<void>((resolve, reject) => {
    video.onloadeddata = () => resolve();
    video.onerror = () => reject(new Error('Failed to load video'));
    video.src = URL.createObjectURL(videoFile);
  });

  try {
    await videoReady;

    // Ensure we get the first frame
    video.currentTime = 0;
    await video.play();
    video.pause();

    // Wait a short moment to ensure the frame is rendered
    await new Promise(resolve => setTimeout(resolve, 100));

    // Create canvas and draw video frame
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Set canvas size to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get WebP blob with higher quality
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
        0.95 // Increased quality
      );
    });

    return { webpBlob };
  } finally {
    // Clean up
    URL.revokeObjectURL(video.src);
    video.remove();
  }
};