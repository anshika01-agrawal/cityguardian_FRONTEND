"use client"

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  ImageIcon, 
  Upload, 
  X, 
  Eye, 
  Loader2,
  Camera,
  FileImage
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface UploadedImage {
  url: string
  publicId: string
  width?: number
  height?: number
  format?: string
  bytes?: number
}

interface ImageUploadProps {
  onImagesChange: (images: UploadedImage[]) => void
  maxImages?: number
  maxSizePerImage?: number
  disabled?: boolean
  existingImages?: UploadedImage[]
}

export default function ImageUpload({ 
  onImagesChange, 
  maxImages = 5, 
  maxSizePerImage = 10,
  disabled = false,
  existingImages = []
}: ImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>(existingImages)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled) return

    const totalImages = images.length + acceptedFiles.length
    if (totalImages > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`)
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      // Check file sizes
      for (const file of acceptedFiles) {
        if (file.size > maxSizePerImage * 1024 * 1024) {
          toast.error(`${file.name} is too large. Maximum size is ${maxSizePerImage}MB`)
          setUploading(false)
          return
        }
      }

      // Option 1: Upload to Cloudinary via API
      const formData = new FormData()
      acceptedFiles.forEach((file) => {
        formData.append('files', file)
      })

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        // Fallback to base64 if Cloudinary fails
        const base64Images = await Promise.all(
          acceptedFiles.map(file => convertToBase64(file))
        )

        const fallbackResponse = await fetch('/api/upload', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: base64Images }),
        })

        if (!fallbackResponse.ok) {
          throw new Error('Failed to upload images')
        }

        const fallbackData = await fallbackResponse.json()
        const newImages = [...images, ...fallbackData.images]
        setImages(newImages)
        onImagesChange(newImages)
        toast.success(`${acceptedFiles.length} image(s) uploaded successfully`)
      } else {
        const data = await response.json()
        const newImages = [...images, ...data.images]
        setImages(newImages)
        onImagesChange(newImages)
        toast.success(data.message)
      }

      setUploadProgress(100)
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error('Failed to upload images. Please try again.')
    } finally {
      setUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }, [images, maxImages, maxSizePerImage, disabled, onImagesChange])

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    disabled: disabled || uploading,
    multiple: true
  })

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
    onImagesChange(newImages)
    toast.success('Image removed')
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragActive
            ? 'border-accent bg-accent/10'
            : disabled || uploading
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-accent/30 hover:border-accent/60 hover:bg-accent/5'
        }`}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-3">
          {uploading ? (
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          ) : (
            <div className="p-3 rounded-full bg-accent/10">
              <Camera className="w-8 h-8 text-accent" />
            </div>
          )}
          
          <div>
            <p className="text-lg font-semibold text-foreground">
              {uploading ? 'Uploading...' : 'Upload Photos'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {isDragActive
                ? 'Drop the images here...'
                : `Drag & drop images here, or click to select`}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Max {maxImages} images • {maxSizePerImage}MB per image • JPEG, PNG, WebP
            </p>
          </div>
          
          {!uploading && (
            <Button type="button" variant="outline" size="sm" className="mt-2">
              <Upload className="w-4 h-4 mr-2" />
              Choose Files
            </Button>
          )}
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && uploadProgress > 0 && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-sm text-muted-foreground text-center">
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <FileImage className="w-4 h-4" />
            Uploaded Images ({images.length}/{maxImages})
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border border-border/30 bg-muted/50">
                  <Image
                    src={image.url}
                    alt={`Upload ${index + 1}`}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                    onError={() => {
                      toast.error(`Failed to load image ${index + 1}`)
                    }}
                  />
                </div>
                
                {/* Image Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setPreviewImage(image.url)}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => removeImage(index)}
                    className="h-8 w-8 p-0"
                    disabled={disabled}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Image Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 rounded-b-lg">
                  <p className="truncate">
                    {image.format || 'Unknown'} • {formatFileSize(image.bytes)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <Image
              src={previewImage}
              alt="Preview"
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}