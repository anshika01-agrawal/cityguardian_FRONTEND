"use client"

import { useEffect, useState } from "react"

export interface LiveUpdate {
  id: string
  timestamp: Date
  message: string
  type: "issue" | "resolution" | "alert" | "achievement"
  priority: "low" | "medium" | "high"
}

export function useLiveFeed(itemsToShow = 5) {
  const [updates, setUpdates] = useState<LiveUpdate[]>([])

  useEffect(() => {
    const mockUpdates: LiveUpdate[] = [
      {
        id: "1",
        timestamp: new Date(Date.now() - 60000),
        message: "New pothole reported on Main Street",
        type: "issue",
        priority: "high",
      },
      {
        id: "2",
        timestamp: new Date(Date.now() - 120000),
        message: "Street lights restored in Downtown Core",
        type: "resolution",
        priority: "medium",
      },
      {
        id: "3",
        timestamp: new Date(Date.now() - 180000),
        message: "AQI Alert: Industrial East zone exceeded threshold",
        type: "alert",
        priority: "high",
      },
      {
        id: "4",
        timestamp: new Date(Date.now() - 240000),
        message: "Jordan Blake reached Gold tier!",
        type: "achievement",
        priority: "low",
      },
      {
        id: "5",
        timestamp: new Date(Date.now() - 300000),
        message: "Waste collection completed in Harbor District",
        type: "resolution",
        priority: "medium",
      },
    ]

    setUpdates(mockUpdates.slice(0, itemsToShow))

    // Simulate new updates
    const interval = setInterval(() => {
      setUpdates((prev) => {
        const newUpdate: LiveUpdate = {
          id: Date.now().toString(),
          timestamp: new Date(),
          message: ["New issue reported", "Task completed", "Alert triggered", "Achievement unlocked"][
            Math.floor(Math.random() * 4)
          ],
          type: (["issue", "resolution", "alert", "achievement"] as const)[Math.floor(Math.random() * 4)],
          priority: (["low", "medium", "high"] as const)[Math.floor(Math.random() * 3)],
        }
        return [newUpdate, ...prev.slice(0, itemsToShow - 1)]
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [itemsToShow])

  return updates
}

export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
