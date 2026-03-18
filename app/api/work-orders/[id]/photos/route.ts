import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { getWorkOrderById } from "@/lib/db/queries/work-orders";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const photos = await prisma.workOrderPhoto.findMany({
    where: { workOrderId: id },
    orderBy: { uploadedAt: "asc" },
  });

  return NextResponse.json(photos);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await getWorkOrderById(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role !== "admin" && order.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") || "";

  // JSON body — bulk associate already-uploaded photos (from wizard flow)
  if (contentType.includes("application/json")) {
    const { photos } = await request.json() as {
      photos: Array<{ url: string; pathname: string }>;
    };
    if (!photos?.length) {
      return NextResponse.json({ error: "No photos provided" }, { status: 400 });
    }

    const created = await prisma.workOrderPhoto.createMany({
      data: photos.map((p) => ({
        workOrderId: id,
        url: p.url,
        pathname: p.pathname,
      })),
    });

    return NextResponse.json({ count: created.count }, { status: 201 });
  }

  // FormData — single file upload (from detail page)
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  const blob = await put(`work-orders/${id}/${file.name}`, file, {
    access: "public",
  });

  const photo = await prisma.workOrderPhoto.create({
    data: {
      workOrderId: id,
      url: blob.url,
      pathname: blob.pathname,
    },
  });

  return NextResponse.json(photo, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await getWorkOrderById(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role !== "admin" && order.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { photoId } = await request.json();
  const photo = await prisma.workOrderPhoto.findUnique({ where: { id: photoId } });
  if (!photo || photo.workOrderId !== id) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  // Delete from blob storage
  await del(photo.url);

  // Delete from database
  await prisma.workOrderPhoto.delete({ where: { id: photoId } });

  return NextResponse.json({ success: true });
}
