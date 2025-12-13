import { supabase } from '@/integrations/supabase/client';

export const useArticleImageUpload = () => {
  const uploadImage = async (
    base64Image: string,
    organizationId: string,
    articleId: string
  ): Promise<string | null> => {
    try {
      // Convert base64 to blob
      const base64Data = base64Image.split(',')[1];
      const binaryData = atob(base64Data);
      const bytes = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'image/jpeg' });

      // Create unique filename
      const fileName = `${organizationId}/${articleId}.jpg`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('article-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Failed to upload article image:', error);
      return null;
    }
  };

  const deleteImage = async (
    organizationId: string,
    articleId: string
  ): Promise<boolean> => {
    try {
      const fileName = `${organizationId}/${articleId}.jpg`;
      
      const { error } = await supabase.storage
        .from('article-images')
        .remove([fileName]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to delete article image:', error);
      return false;
    }
  };

  return { uploadImage, deleteImage };
};
