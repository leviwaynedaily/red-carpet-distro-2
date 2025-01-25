export const captureVideoFrame = async (videoUrl: string): Promise<Blob> => {
  console.log('Capturing video frame from:', videoUrl);
  
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    
    video.onloadeddata = () => {
      // Create canvas and draw video frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Draw the first frame of the video
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to WebP
      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log('Successfully captured video frame');
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        'image/webp',
        0.95
      );
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video'));
    };
    
    video.src = videoUrl;
    video.load();
  });
};