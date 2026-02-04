"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/contexts/language-context"
import { calculateQiblaDirection, calculateDistanceToMecca } from "@/lib/prayer-times"
import type { Location } from "@/types/prayer"

interface CompassProps {
  location: Location | null
}

export function QiblaCompass({ location }: CompassProps) {
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<"granted" | "denied" | "prompt" | "unsupported">("prompt")
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation()

  const qiblaDirection = location
    ? calculateQiblaDirection(location.latitude, location.longitude)
    : null

  const distanceToMecca = location
    ? calculateDistanceToMecca(location.latitude, location.longitude)
    : null

  useEffect(() => {
    if (!("DeviceOrientationEvent" in window)) {
      setPermissionStatus("unsupported")
      return
    }

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const heading = (event as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading

      if (heading !== undefined) {
        setDeviceHeading(heading)
      } else if (event.alpha !== null) {
        setDeviceHeading(360 - event.alpha)
      }
    }

    const DeviceOrientationEventTyped = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<"granted" | "denied">
    }

    if (typeof DeviceOrientationEventTyped.requestPermission === "function") {
      setPermissionStatus("prompt")
    } else {
      window.addEventListener("deviceorientation", handleOrientation, true)
      setPermissionStatus("granted")
    }

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation, true)
    }
  }, [])

  const requestPermission = async () => {
    try {
      const DeviceOrientationEventTyped = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
        requestPermission?: () => Promise<"granted" | "denied">
      }

      if (typeof DeviceOrientationEventTyped.requestPermission === "function") {
        const response = await DeviceOrientationEventTyped.requestPermission()
        setPermissionStatus(response)

        if (response === "granted") {
          window.addEventListener(
            "deviceorientation",
            (event) => {
              const heading = (event as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading
              if (heading !== undefined) {
                setDeviceHeading(heading)
              } else if (event.alpha !== null) {
                setDeviceHeading(360 - event.alpha)
              }
            },
            true
          )
        }
      }
    } catch {
      setError(t("qibla.permissionDenied"))
      setPermissionStatus("denied")
    }
  }

  const needleRotation = qiblaDirection !== null && deviceHeading !== null
    ? qiblaDirection - deviceHeading
    : qiblaDirection || 0

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Compass Circle */}
      <div className="relative h-72 w-72">
        <div className="absolute inset-0 rounded-full border-4 border-border bg-card shadow-lg" />

        {/* Cardinal Directions */}
        <div className="absolute inset-4 rounded-full">
          <span className="absolute left-1/2 top-0 -translate-x-1/2 text-sm font-bold text-primary">
            {t("compass.north")}
          </span>
          <span className="absolute right-0 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
            {t("compass.east")}
          </span>
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-sm font-medium text-muted-foreground">
            {t("compass.south")}
          </span>
          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
            {t("compass.west")}
          </span>
        </div>

        {/* Compass Rose */}
        <div
          className="absolute inset-8 rounded-full border border-border"
          style={{
            transform: deviceHeading !== null ? `rotate(${-deviceHeading}deg)` : undefined,
            transition: "transform 0.3s ease-out",
          }}
        >
          {Array.from({ length: 36 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "absolute left-1/2 top-0 h-2 w-px -translate-x-1/2",
                i % 9 === 0 ? "bg-foreground" : "bg-border"
              )}
              style={{ transform: `rotate(${i * 10}deg)`, transformOrigin: "bottom center" }}
            />
          ))}
        </div>

        {/* Qibla Needle */}
        <div
          className="compass-needle absolute inset-12 flex items-center justify-center"
          style={{ transform: `rotate(${needleRotation}deg)` }}
        >
          <div className="relative h-full w-full">
            <div className="absolute left-1/2 top-2 h-1/2 w-1 -translate-x-1/2 rounded-full bg-primary" />
            <div className="absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 rotate-45 bg-primary" />
            <div className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.18L18.36 7.5 12 10.82 5.64 7.5 12 4.18zM5 9.07l6 3.33v6.53l-6-3.33V9.07zm8 9.86v-6.53l6-3.33v6.53l-6 3.33z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Qibla Info */}
      <div className="text-center">
        {qiblaDirection !== null && (
          <p className="text-lg font-medium">
            {t("qibla.direction", { degrees: `${Math.round(qiblaDirection)}°` })}
          </p>
        )}
        {distanceToMecca !== null && (
          <p className="text-sm text-muted-foreground">
            {t("qibla.distance", { km: Math.round(distanceToMecca).toLocaleString() })}
          </p>
        )}
      </div>

      {/* Permission/Error States */}
      {permissionStatus === "prompt" && (
        <button
          onClick={requestPermission}
          className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t("qibla.enableCompass")}
        </button>
      )}

      {permissionStatus === "denied" && (
        <p className="text-center text-sm text-destructive">
          {t("qibla.permissionDenied")}
        </p>
      )}

      {permissionStatus === "unsupported" && (
        <p className="text-center text-sm text-muted-foreground">
          {t("qibla.unsupported")}
        </p>
      )}

      {error && (
        <p className="text-center text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
