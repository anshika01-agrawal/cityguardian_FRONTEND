"use client"

import type React from "react"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { ImageIcon, MapPin, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import ImageUpload from "@/components/image-upload"

const ISSUE_CATEGORIES = [
  { value: "air_pollution", label: "Air Quality", emoji: "💨" },
  { value: "pothole", label: "Pothole/Road Damage", emoji: "🕳️" },
  { value: "streetlight", label: "Broken Street Light", emoji: "💡" },
  { value: "noise", label: "Noise Pollution", emoji: "🔊" },
  { value: "waste", label: "Waste/Debris", emoji: "🗑️" },
  { value: "water", label: "Water Issue", emoji: "💧" },
  { value: "other", label: "Other", emoji: "📍" },
]

const PRIORITY_LEVELS = [
  { value: "low", label: "Low", color: "green" },
  { value: "medium", label: "Medium", color: "yellow" },
  { value: "high", label: "High", color: "orange" },
  { value: "critical", label: "Critical", color: "red" },
]

export default function IssueForm() {
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    description: "",
    location: {
      address: "",
      coordinates: [0, 0] as [number, number]
    },
    priority: "medium",
    contact: {
      mobile: "",
      email: session?.user?.email || ""
    }
  })

  const [uploadedImages, setUploadedImages] = useState<{url: string, publicId: string}[]>([])

  const handleImagesChange = (images: {url: string, publicId: string}[]) => {
    setUploadedImages(images)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session) {
      toast.error("Please login to submit a complaint")
      return
    }

    if (!formData.type || !formData.title || !formData.description || !formData.location.address || !formData.contact.mobile) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          images: uploadedImages
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Complaint submitted successfully!")
        // Reset form
        setFormData({
          title: "",
          type: "",
          description: "",
          location: { address: "", coordinates: [0, 0] },
          priority: "medium",
          contact: { mobile: "", email: session?.user?.email || "" }
        })
        setUploadedImages([])
      } else {
        toast.error(data.error || "Failed to submit complaint")
      }
    } catch (error) {
      console.error('Error submitting complaint:', error)
      toast.error("An error occurred while submitting the complaint")
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCategory = ISSUE_CATEGORIES.find((cat) => cat.value === formData.type)

  return (
    <Card className="p-8 border-accent/30 bg-card/50 backdrop-blur">
      <div className="flex items-center gap-3 mb-6">
        <AlertCircle className="w-6 h-6 text-accent" />
        <h2 className="text-2xl font-bold text-foreground">Report an Issue</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Selection */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-3">Category</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ISSUE_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setFormData({ ...formData, type: cat.value })}
                className={`p-3 rounded-lg border-2 transition-all text-center ${
                  formData.type === cat.value
                    ? "border-accent bg-accent/10"
                    : "border-border/30 bg-card/30 hover:border-accent/50"
                }`}
              >
                <div className="text-2xl mb-1">{cat.emoji}</div>
                <div className="text-xs font-semibold text-foreground">{cat.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Issue Title</label>
          <Input
            type="text"
            placeholder="Brief title of the issue..."
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="bg-input border-border/50 text-foreground placeholder:text-foreground/40"
            required
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Location</label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Street address or location..."
              value={formData.location.address}
              onChange={(e) => setFormData({ 
                ...formData, 
                location: { ...formData.location, address: e.target.value }
              })}
              className="flex-1 bg-input border-border/50 text-foreground placeholder:text-foreground/40"
              required
            />
            <Button type="button" variant="outline" className="border-accent/30 bg-transparent">
              <MapPin className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Mobile Number</label>
            <Input
              type="tel"
              placeholder="Your mobile number..."
              value={formData.contact.mobile}
              onChange={(e) => setFormData({ 
                ...formData, 
                contact: { ...formData.contact, mobile: e.target.value }
              })}
              className="bg-input border-border/50 text-foreground placeholder:text-foreground/40"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Email</label>
            <Input
              type="email"
              placeholder="Your email address..."
              value={formData.contact.email}
              onChange={(e) => setFormData({ 
                ...formData, 
                contact: { ...formData.contact, email: e.target.value }
              })}
              className="bg-input border-border/50 text-foreground placeholder:text-foreground/40"
              required
            />
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Priority Level</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {PRIORITY_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setFormData({ ...formData, priority: level.value })}
                className={`py-2 px-3 rounded-lg border-2 font-semibold capitalize transition-all ${
                  formData.priority === level.value
                    ? level.color === "green"
                      ? "border-green-500/50 bg-green-500/10 text-green-400"
                      : level.color === "yellow"
                        ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
                        : level.color === "orange"
                          ? "border-orange-500/50 bg-orange-500/10 text-orange-400"
                          : "border-red-500/50 bg-red-500/10 text-red-400"
                    : "border-border/30 bg-card/30 text-foreground/60 hover:border-border/60"
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Description</label>
          <Textarea
            placeholder="Provide detailed description of the issue..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="bg-input border-border/50 text-foreground placeholder:text-foreground/40 min-h-32"
            required
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-3">Photos (Optional)</label>
          <ImageUpload 
            onImagesChange={handleImagesChange}
            maxImages={5}
            maxSizePerImage={10}
            disabled={isSubmitting}
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-accent to-secondary text-foreground font-bold h-12 neon-glow disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Issue Report"
          )}
        </Button>

        <div className="p-4 rounded-lg bg-accent/10 border border-accent/30 text-sm text-foreground/80">
          <p className="font-semibold text-accent mb-2">💰 You'll earn:</p>
          <p>Base reward: 100 points + 50 bonus if resolved</p>
        </div>
      </form>
    </Card>
  )
}
