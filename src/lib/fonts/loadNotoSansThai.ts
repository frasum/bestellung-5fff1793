// Dynamic font loader for Noto Sans Thai
// This loads the font file and converts it to base64 for jsPDF

export const loadNotoSansThaiFont = async (): Promise<string> => {
  try {
    const response = await fetch('/fonts/NotoSansThai-Regular.ttf');
    if (!response.ok) {
      throw new Error('Failed to load font');
    }
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  } catch (error) {
    console.error('Error loading Noto Sans Thai font:', error);
    throw error;
  }
};
