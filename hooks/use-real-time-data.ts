"use client"

import { useEffect, useState } from "react"

export interface RealtimeMetric {
  label: string
  value: number
  target?: number
  trend?: "up" | "down" | "stable"
}

export function useRealtimeData(initialValue: number, maxValue?: number, updateInterval = 2000) {
  const [value, setValue] = useState(initialValue)
  const [trend, setTrend] = useState<"up" | "down" | "stable">("stable")

  useEffect(() => {
    const interval = setInterval(() => {
      setValue((prev) => {
        const change = Math.floor(Math.random() * 5) - 2
        const newValue = Math.max(0, Math.min(prev + change, maxValue || prev + 10))

        if (change > 0) setTrend("up")
        else if (change < 0) setTrend("down")
        else setTrend("stable")

        return newValue
      })
    }, updateInterval)

    return () => clearInterval(interval)
  }, [maxValue, updateInterval])

  return { value, trend }
}

export function useAnimatedCounter(target: number, duration = 1000) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      setCount(Math.floor(target * progress))

      if (progress === 1) clearInterval(interval)
    }, 16)

    return () => clearInterval(interval)
  }, [target, duration])

  return count
}

export function useLiveStatus(initialStatus: "active" | "inactive" | "alert", changeInterval = 5000) {
  const [status, setStatus] = useState<"active" | "inactive" | "alert">(initialStatus)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      const random = Math.random()
      if (random > 0.7) {
        setStatus("alert")
      } else if (random > 0.3) {
        setStatus("active")
      } else {
        setStatus("inactive")
      }
      setLastUpdate(new Date())
    }, changeInterval)

    return () => clearInterval(interval)
  }, [changeInterval])

  return { status, lastUpdate }
}
