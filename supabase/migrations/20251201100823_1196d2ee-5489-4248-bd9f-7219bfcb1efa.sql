-- Create storage bucket for food donation images
INSERT INTO storage.buckets (id, name, public)
VALUES ('food-images', 'food-images', true);

-- Allow anyone to view images in the food-images bucket
CREATE POLICY "Anyone can view food images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'food-images');

-- Allow authenticated users to upload their own food images
CREATE POLICY "Authenticated users can upload food images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'food-images' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own images
CREATE POLICY "Users can update their own food images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'food-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own food images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'food-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);