// Dynamic font loaders for jsPDF
// Loads font files and converts to base64

const loadFontAsBase64 = async (path: string): Promise<string> => {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load font: ${path}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
};

// Load Noto Sans (Latin, Vietnamese, etc.)
export const loadNotoSansFont = async (): Promise<string> => {
  return loadFontAsBase64('/fonts/NotoSans-Regular.ttf');
};

// Load Noto Sans Thai (Thai script)
export const loadNotoSansThaiFont = async (): Promise<string> => {
  return loadFontAsBase64('/fonts/NotoSansThai-Regular.ttf');
};
