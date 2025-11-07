import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    // Validate file types and sizes
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. Only JPEG, PNG, and WebP are allowed.` },
          { status: 400 }
        );
      }
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File too large: ${file.name}. Maximum size is 10MB.` },
          { status: 400 }
        );
      }
    }

    // Upload files to Cloudinary
    const uploadPromises = files.map(async (file) => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: 'cityguardian/complaints',
            transformation: [
              { width: 1200, height: 800, crop: 'limit' },
              { quality: 'auto' },
              { fetch_format: 'auto' }
            ]
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else {
              resolve({
                url: result?.secure_url,
                publicId: result?.public_id,
                width: result?.width,
                height: result?.height,
                format: result?.format,
                bytes: result?.bytes
              });
            }
          }
        ).end(buffer);
      });
    });

    const uploadResults = await Promise.all(uploadPromises);

    return NextResponse.json({
      success: true,
      images: uploadResults,
      message: `${uploadResults.length} image(s) uploaded successfully`
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload images', details: error.message },
      { status: 500 }
    );
  }
}

// Alternative simple upload using base64 (if Cloudinary is not configured)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { images } = await request.json();

    if (!images || !Array.isArray(images)) {
      return NextResponse.json({ error: 'Invalid images data' }, { status: 400 });
    }

    // For simple base64 storage (fallback)
    const processedImages = images.map((base64Image, index) => ({
      url: base64Image, // Store base64 directly
      publicId: `complaint_${Date.now()}_${index}`,
      width: null,
      height: null,
      format: 'base64',
      bytes: base64Image.length
    }));

    return NextResponse.json({
      success: true,
      images: processedImages,
      message: `${processedImages.length} image(s) processed successfully`
    });

  } catch (error: any) {
    console.error('Base64 upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process images', details: error.message },
      { status: 500 }
    );
  }
}