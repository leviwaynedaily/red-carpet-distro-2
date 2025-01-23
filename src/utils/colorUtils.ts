export const updateRootColors = (colors: {
  primary?: string;
  secondary?: string;
  background?: string;
  foreground?: string;
  muted?: string;
  accent?: string;
}) => {
  const root = document.documentElement;
  
  // Convert hex to HSL for better Tailwind compatibility
  const hexToHSL = (hex: string) => {
    // Remove the hash if it exists
    hex = hex.replace('#', '');
    
    // Convert hex to RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      
      h /= 6;
    }

    // Convert to degrees and percentages
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  if (colors.primary) {
    root.style.setProperty('--primary', hexToHSL(colors.primary));
  }
  if (colors.secondary) {
    root.style.setProperty('--secondary', hexToHSL(colors.secondary));
  }
  if (colors.background) {
    root.style.setProperty('--background', hexToHSL(colors.background));
  }
  if (colors.foreground) {
    root.style.setProperty('--foreground', hexToHSL(colors.foreground));
  }
  if (colors.muted) {
    root.style.setProperty('--muted', hexToHSL(colors.muted));
  }
  if (colors.accent) {
    root.style.setProperty('--accent', hexToHSL(colors.accent));
  }

  console.log('Updated theme colors:', colors);
};