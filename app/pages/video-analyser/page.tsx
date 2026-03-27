"use client"
//video analyser page 
import { useEffect, useRef, useState, useCallback } from "react"
import {
  PlayIcon,
  MonitorStopIcon as StopIcon,
  CameraIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  StopCircleIcon,
  RefreshCwIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { detectEvents, type VideoEvent } from "./actions"

const useDangerSound = (audioSrc: string) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio(audioSrc)

    // Configure audio for looping
    if (audioRef.current) {
      audioRef.current.loop = true
    }

    // Cleanup function
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [audioSrc])

  const playSound = () => {
    if (audioRef.current && !isPlaying) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }

  return { playSound, stopSound, isPlaying }
}

const DangerAlert = ({
  event,
  onResolve,
}: {
  event: VideoEvent
  onResolve: () => void
}) => {
  const dangerColor = event.isDangerous ? "bg-red-900/70 border-red-700" : "bg-green-900/70 border-green-700"
  const Icon = event.isDangerous ? AlertTriangleIcon : CheckCircleIcon

  return (
    <div className={`rounded-lg border p-3 ${dangerColor} mb-2 flex animate-pulse items-center space-x-3`}>
      <div className="flex w-full items-center space-x-3">
        <Icon className={`h-8 w-8 ${event.isDangerous ? "text-red-400" : "text-green-400"}`} />
        <div className="flex-grow">
          <p className={`text-sm font-medium ${event.isDangerous ? "text-red-200" : "text-green-200"}`}>
            {event.timestamp} - {event.description}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={onResolve} className="bg-white/20 text-white hover:bg-white/30">
          <StopCircleIcon className="mr-2 h-4 w-4" /> Resolve
        </Button>
      </div>
    </div>
  )
}

const Page = () => {
  const imgRef = useRef<HTMLImageElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const [ipAddress, setIpAddress] = useState<string>("")
  const [streamUrl, setStreamUrl] = useState<string>("")
  const [videoUrl, setVideoUrl] = useState<string>("")
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)
  const [events, setEvents] = useState<VideoEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<"analyze" | "watch">("analyze")
  const [watchUrl, setWatchUrl] = useState<string>("")
  const [streamKey, setStreamKey] = useState(0)

  const { playSound, stopSound, isPlaying } = useDangerSound("/danger_alert.mp3")

  const captureAndAnalyzeFrame = useCallback(async () => {
    if (!imgRef.current || !canvasRef.current || !isAnalyzing) return

    const img = imgRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      setError("Failed to get canvas context.")
      return
    }

    try {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      const base64Image = canvas.toDataURL("image/jpeg")
      setIsLoading(true)

      const { events: newEvents } = await detectEvents(base64Image)

      // Add current timestamp to each event
      const eventsWithTimestamp = newEvents.map((event:any) => {
        const now = new Date()
        const formattedTime = now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
        return {
          ...event,
          timestamp: formattedTime,
        }
      })

      // Play danger sound if any dangerous event is detected
      if (eventsWithTimestamp.some((event:any) => event.isDangerous)) {
        playSound()
      }

      // Limit events to last 10
      setEvents((prev) => {
        const updatedEvents = [...eventsWithTimestamp, ...prev].slice(0, 10)
        return updatedEvents
      })

      setError(null)
    } catch (error) {
      console.error("Error analyzing frame:", error)
      setError(`Failed to analyze frame: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }, [isAnalyzing, playSound])

  const startAnalysis = () => {
    if (!ipAddress) {
      setError("Please enter an IP address with port.")
      return
    }

    // Construct URLs with potential video stream paths
    const baseUrl = ipAddress.startsWith("http://") ? ipAddress : `http://${ipAddress}`

    // Try common video stream paths
    const possibleVideoUrls = [
      `${baseUrl}/video`,
      `${baseUrl}/stream`,
      `${baseUrl}/mjpg/video.mjpg`,
      `${baseUrl}:8080/video`,
      `${baseUrl}:8080/stream`,
      `${baseUrl}:8080/mjpg/video.mjpg`,
    ]

    // Try the first working URL
    const tryStreamUrls = async () => {
      for (const url of possibleVideoUrls) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000) // Timeout after 5 seconds

          const response = await fetch(url, {
            method: "HEAD",
            signal: controller.signal,
          })
          clearTimeout(timeoutId)

          if (response.ok) {
            setStreamUrl(url)
            setVideoUrl(url)
            setWatchUrl(baseUrl)
            setIsAnalyzing(true)
            setError(null)
            setStreamKey((prev) => prev + 1)
            return
          }
        } catch (err) {
          console.log(`Failed to connect to ${url}`)
        }
      }

      // If no URL works
      setError("Could not find a valid video stream. Please check the IP and try a specific video URL.")
    }

    tryStreamUrls()
  }

  const stopAnalysis = () => {
    setIsAnalyzing(false)
    stopSound()
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const resolveEvent = (index: number) => {
    const updatedEvents = [...events]
    updatedEvents.splice(index, 1)
    setEvents(updatedEvents)

    // Stop sound if no more dangerous events
    if (!updatedEvents.some((event) => event.isDangerous)) {
      stopSound()
    }
  }

  const reloadStream = () => {
    setStreamKey((prev) => prev + 1)
  }

  useEffect(() => {
    if (isAnalyzing) {
      intervalRef.current = setInterval(captureAndAnalyzeFrame, 5000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isAnalyzing, captureAndAnalyzeFrame])

  return (
    <div className="flex h-screen flex-col bg-gray-900">
      {/* Navigation */}
      <div className="flex justify-center space-x-4 bg-gray-800/60 p-4 backdrop-blur-sm">
        <Button
          variant={activeTab === "analyze" ? "default" : "outline"}
          onClick={() => setActiveTab("analyze")}
          className="px-8"
        >
          Analyze
        </Button>
        <Button
          variant={activeTab === "watch" ? "default" : "outline"}
          onClick={() => setActiveTab("watch")}
          className="px-8"
        >
          Watch
        </Button>
      </div>

      {/* Content Area */}
      {activeTab === "analyze" && (
        <div className="flex flex-1 overflow-hidden">
          {/* Video Section - 75% width */}
          <div className="relative w-3/4 p-4">
            <Card className="flex h-full flex-col border-2 border-blue-900/50 shadow-lg shadow-blue-900/30">
              <CardHeader>
                <CardTitle className="text-2xl font-bold tracking-tight text-blue-200">
                  Real-time Intelligent Surveillance
                </CardTitle>
              </CardHeader>
              <CardContent className="relative flex-grow">
                <div className="mb-4 flex flex-col gap-4">
                  <div className="flex gap-4">
                    <Input
                      placeholder="Camera IP Address (192.168.1.3:8080/video)"
                      value={ipAddress}
                      onChange={(e) => setIpAddress(e.target.value)}
                      className="flex-grow border-blue-700 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500"
                    />
                    <Button onClick={startAnalysis} disabled={isAnalyzing} className="bg-green-700 hover:bg-green-600">
                      <PlayIcon className="mr-2" /> Start
                    </Button>
                    <Button
                      onClick={stopAnalysis}
                      disabled={!isAnalyzing}
                      variant="destructive"
                      className="bg-red-800 hover:bg-red-700"
                    >
                      <StopIcon className="mr-2" /> Stop
                    </Button>
                  </div>
                </div>

                <div className="relative h-[calc(100vh-250px)] overflow-hidden rounded-lg border-2 border-blue-900/30 bg-black">
                  {isAnalyzing ? (
                    <div className="relative h-full w-full">
                      <img
                        key={streamKey}
                        ref={imgRef}
                        src={`${videoUrl}?${streamKey}`}
                        alt="Live Camera Stream"
                        crossOrigin="anonymous"
                        className="h-full w-full object-contain"
                        onError={() => {
                          setError(`Failed to load video stream from ${videoUrl}`)
                          stopAnalysis()
                        }}
                      />
                      <Button
                        onClick={reloadStream}
                        className="absolute right-2 top-2 bg-blue-600 hover:bg-blue-500"
                        size="sm"
                      >
                        <RefreshCwIcon className="mr-2 h-4 w-4" /> Reload Stream
                      </Button>
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <CameraIcon className="h-24 w-24 text-blue-500 opacity-50" />
                    </div>
                  )}

                  {isAnalyzing && isLoading && (
                    <div className="absolute right-2 top-2">
                      <Badge variant="destructive" className="animate-pulse">
                        Analyzing...
                      </Badge>
                    </div>
                  )}

                  {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-900/70 p-4 text-white">
                      <div className="text-center">
                        <p className="mb-2 text-lg font-bold">Stream Error</p>
                        <p>{error}</p>
                        <Button onClick={() => setError(null)} variant="outline" className="mt-4">
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notification Panel - 25% width */}
          <div className="w-1/4 overflow-y-auto border-l-2 border-blue-900/30 bg-gray-800/60 p-4 backdrop-blur-sm">
            <div className="sticky top-0 z-10 mb-4 rounded-lg bg-gray-900/80 pb-2">
              <h2 className="flex items-center p-2 text-xl font-bold text-blue-300">
                <AlertTriangleIcon className="mr-2 text-yellow-500" />
                Event Log
              </h2>
            </div>

            {events.length === 0 ? (
              <div className="py-8 text-center text-gray-500">No events detected</div>
            ) : (
              <div className="space-y-2">
                {events.map((event, index) => (
                  <DangerAlert key={index} event={event} onResolve={() => resolveEvent(index)} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "watch" && (
        <div className="flex-1 p-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Robot Tracking</CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100vh-150px)]">
              {watchUrl ? (
                <iframe
                  src={watchUrl}
                  className="h-full w-full rounded-lg border-2 border-gray-300 shadow-lg"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="flex h-full items-center justify-center text-gray-500">
                  Enter an IP address in the Analyze tab first
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
    </div>
  )
}

export default Page

