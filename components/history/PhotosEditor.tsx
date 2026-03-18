"use client";

import { useState } from "react";
import { Card } from "@heroui/react";
import { PhotoUploader, type PhotoItem } from "@/components/PhotoUploader";

interface PhotosEditorProps {
  orderId: string;
  initialPhotos: PhotoItem[];
}

export function PhotosEditor({ orderId, initialPhotos }: PhotosEditorProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>(initialPhotos);

  const handleDelete = async (photoId: string) => {
    await fetch(`/api/work-orders/${orderId}/photos`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId }),
    });
  };

  return (
    <Card variant="default">
      <Card.Header>
        <Card.Title>Photos{photos.length > 0 ? ` (${photos.length})` : ""}</Card.Title>
      </Card.Header>
      <Card.Content>
        <PhotoUploader
          photos={photos}
          uploadUrl={`/api/work-orders/${orderId}/photos`}
          onPhotosChange={setPhotos}
          onDelete={handleDelete}
        />
      </Card.Content>
    </Card>
  );
}
