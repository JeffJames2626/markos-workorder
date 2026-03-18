"use client";

import { useRef, useState } from "react";
import { Button, Card } from "@heroui/react";

export interface PhotoItem {
  id?: string;
  url: string;
  pathname: string;
}

interface PhotoUploaderProps {
  photos: PhotoItem[];
  /** Upload endpoint — receives FormData with "file" field, returns { url, pathname } */
  uploadUrl: string;
  onPhotosChange: (photos: PhotoItem[]) => void;
  /** Called when deleting a photo that has an id (already persisted) */
  onDelete?: (photoId: string) => Promise<void>;
}

export function PhotoUploader({
  photos,
  uploadUrl,
  onPhotosChange,
  onDelete,
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFiles = async (files: FileList) => {
    setError(null);
    setUploading(true);

    const newPhotos: PhotoItem[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed");
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("Max file size is 10MB");
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(uploadUrl, { method: "POST", body: formData });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Upload failed");
          continue;
        }
        const data = await res.json();
        newPhotos.push({ url: data.url, pathname: data.pathname, id: data.id });
      } catch {
        setError("Upload failed");
      }
    }

    if (newPhotos.length > 0) {
      onPhotosChange([...photos, ...newPhotos]);
    }
    setUploading(false);

    // Reset input so the same file can be re-selected
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = async (index: number) => {
    const photo = photos[index];
    if (photo.id && onDelete) {
      await onDelete(photo.id);
    }
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, i) => (
            <div key={photo.url} className="relative aspect-square group">
              <button
                type="button"
                className="w-full h-full"
                onClick={() => setPreview(photo.url)}
              >
                <img
                  src={photo.url}
                  alt={`Photo ${i + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
              </button>
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs"
                aria-label="Remove photo"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}

      <Button
        variant="secondary"
        fullWidth
        isPending={uploading}
        isDisabled={uploading}
        onPress={() => inputRef.current?.click()}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        {uploading ? "Uploading..." : "Add Photos"}
      </Button>

      {/* Fullscreen preview */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center"
            onClick={() => setPreview(null)}
            aria-label="Close preview"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <img
            src={preview}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
