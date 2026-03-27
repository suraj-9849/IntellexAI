'use client';

import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Upload, Save, Clock, Film, AlertTriangle, ChevronRight, Shield } from 'lucide-react';

import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import VideoPlayer from '@/components/video-player';
import TimestampList from '@/components/timestamp-list';
import type { Timestamp } from '@/app/types';
import { detectEvents, type VideoEvent } from './actions';
import Link from 'next/link';

// --- New: EventLogCard for real-time event log ---
function EventLogCard({ event }: { event: Timestamp }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3 mb-2 ${
        event.isDangerous
          ? 'border-red-700 bg-red-900/70 animate-pulse'
          : 'border-green-700 bg-green-900/70'
      }`}
    >
      {event.isDangerous ? (
        <AlertTriangle className="h-6 w-6 text-red-400" />
      ) : (
        <Shield className="h-6 w-6 text-green-400" />
      )}
      <div className="flex flex-col">
        <span className={`font-mono text-xs ${event.isDangerous ? 'text-red-200' : 'text-green-200'}`}>{event.timestamp}</span>
        <span className={`text-sm font-medium ${event.isDangerous ? 'text-red-200' : 'text-green-200'}`}>{event.description}</span>
      </div>
    </div>
  );
}

interface SavedVideo {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  timestamps: Timestamp[];
}

export default function UploadPage() {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [timestamps, setTimestamps] = useState<Timestamp[]>([]);
  // New: Real-time event log
  const [eventLog, setEventLog] = useState<Timestamp[]>([]);
  // New: For immediate last API response
  const [lastApiResult, setLastApiResult] = useState<{ description: string; isDangerous: boolean } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoName, setVideoName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const captureFrame = async (
    video: HTMLVideoElement,
    time: number
  ): Promise<string | null> => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      console.error('Failed to get canvas context');
      return null;
    }

    try {
      video.currentTime = time;
    } catch (error) {
      console.error('Error setting video time:', error);
      return null;
    }

    // Wait for video to seek to the specified time
    await new Promise((resolve) => {
      video.onseeked = resolve;
    });

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handleFileUpload = async (e: {
    target: { files: FileList | null };
  }) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setTimestamps([]);

    try {
      const localUrl = URL.createObjectURL(file);
      setVideoUrl(localUrl);
      setVideoName(file.name);

      // Wait for video element to be available
      while (!videoRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Set the source and wait for video to load
      const video = videoRef.current;
      video.src = localUrl;

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout waiting for video metadata'));
        }, 10000);

        const handleLoad = () => {
          clearTimeout(timeout);
          resolve(true);
        };

        const handleError = () => {
          clearTimeout(timeout);
          reject(new Error('Failed to load video: ' + video.error?.message));
        };

        video.addEventListener('loadeddata', handleLoad);
        video.addEventListener('error', handleError);

        if (video.readyState >= 2) {
          handleLoad();
        }

        return () => {
          video.removeEventListener('loadeddata', handleLoad);
          video.removeEventListener('error', handleError);
        };
      });
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setIsUploading(false);
      setUploadProgress(100);

      // Start analysis
      setIsAnalyzing(true);
      const duration = video.duration;

      if (!duration || duration === Infinity || isNaN(duration)) {
        throw new Error('Invalid video duration');
      }

      console.log('Video duration:', duration);
      const interval = 3; // Analyze one frame every 3 seconds
      const totalFrames = Math.floor(duration / interval);
      const newTimestamps: Timestamp[] = [];

      // Process frames at regular intervals, ensuring each API call is resolved before the next

      for (let time = 0; time < duration; time += interval) {
        const progress = Math.floor((time / duration) * 100);
        setUploadProgress(progress);
        console.log(`Analyzing frame at ${time}s (${progress}%)...`);

        const frame = await captureFrame(video, time);
        if (frame) {
          try {
            // Print to terminal: API call start
            console.log(`Sending frame at ${time}s to hosted model API...`);
            console.log('Frame (base64, first 100 chars):', frame.slice(0, 100));

            const result = await detectEvents(frame);
            console.log('Frame analysis result:', result);

            // Show the latest API result on screen immediately
            if (result.events && result.events.length > 0) {
              const event = result.events[0];
              setLastApiResult({ description: event.description, isDangerous: event.isDangerous });
              const minutes = Math.floor(time / 60);
              const seconds = Math.floor(time % 60);
              const timestamp = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
              const eventObj: Timestamp = {
                timestamp,
                description: event.description, // Already one-liner from API
                isDangerous: event.isDangerous,
              };
              newTimestamps.push(eventObj);
              setEventLog((prev) => [eventObj, ...prev].slice(0, 20)); // Show latest 20 events
            }
          } catch (error) {
            console.error('Error analyzing frame:', error);
          }
        }
      }

      console.log('Analysis complete, found timestamps:', newTimestamps);
      setTimestamps(newTimestamps);
      // Optionally, set eventLog to all events at the end (if needed)
      setIsAnalyzing(false);
      setUploadProgress(100);
    } catch (error) {
      console.error('Error uploading/analyzing video:', error);
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  const handleTimestampClick = (timestamp: string) => {
    if (!videoRef.current) return;

    const [minutes, seconds] = timestamp.split(':').map(Number);
    const timeInSeconds = minutes * 60 + seconds;
    videoRef.current.currentTime = timeInSeconds;
    videoRef.current.play();
  };

  const handleSaveVideo = () => {
    if (!videoUrl || !videoName) return;

    const savedVideos: SavedVideo[] = JSON.parse(
      localStorage.getItem('savedVideos') || '[]'
    );
    const newVideo: SavedVideo = {
      id: Date.now().toString(),
      name: videoName,
      url: videoUrl,
      thumbnailUrl: videoUrl,
      timestamps: timestamps,
    };
    savedVideos.push(newVideo);
    localStorage.setItem('savedVideos', JSON.stringify(savedVideos));
    
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-zinc-900 via-black to-zinc-900 p-4 text-white">
      <div className="relative mx-auto mb-8 w-full max-w-5xl overflow-hidden rounded-xl bg-black p-8">
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="absolute -inset-[10px] animate-pulse rounded-full bg-purple-600 blur-3xl"></div>
          <div className="absolute -right-[40%] top-[30%] h-72 w-72 animate-pulse rounded-full bg-blue-500 blur-3xl"></div>
          <div className="absolute -left-[40%] top-[60%] h-72 w-72 animate-pulse rounded-full bg-indigo-500 blur-3xl"></div>
        </div>
        
        <div className="relative z-10 text-center">
          <h1 className="mb-2 bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-4xl font-bold text-transparent">
            Video Timestamp Analyzer
          </h1>
          <p className="mx-auto max-w-2xl text-zinc-400">
            Upload your video to automatically detect key moments, generate intelligent timestamps, and keep track of important events
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl">
        {/* Immediate ML Model Response Log */}
        {lastApiResult && (
          <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900/80 p-4 flex items-center gap-4">
            <span className={`font-bold ${lastApiResult.isDangerous ? 'text-red-400' : 'text-green-400'}`}>
              {lastApiResult.isDangerous ? 'DANGEROUS' : 'SAFE'}
            </span>
            <span className="text-white">{lastApiResult.description}</span>
          </div>
        )}
        {/* Real-time Event Log Panel */}
        {eventLog.length > 0 && (
          <div className="mb-8 rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
            <h2 className="mb-4 text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="text-yellow-400" /> Event Log
            </h2>
            <div className="max-h-64 overflow-y-auto">
              {eventLog.map((event, idx) => (
                <EventLogCard key={idx} event={event} />
              ))}
            </div>
          </div>
        )}
        <div className="">
          <div className={`space-y-8 rounded-xl border border-zinc-800 bg-black p-6 shadow-2xl lg:col-span-${videoUrl ? '5' : '7'}`}>
            {!videoUrl && (
              <div className="flex justify-center">
                <div className="w-full max-w-lg">
                  <label
                    htmlFor="video-upload"
                    className={`flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all duration-300 ${
                      isDragging
                        ? 'border-purple-500 bg-purple-900/20'
                        : 'border-zinc-700 hover:border-purple-500 hover:bg-zinc-800/30'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(false);

                      const file = e.dataTransfer.files[0];
                      if (file && file.type.startsWith('video/')) {
                        const input = document.getElementById(
                          'video-upload'
                        ) as HTMLInputElement;
                        if (input) {
                          const dataTransfer = new DataTransfer();
                          dataTransfer.items.add(file);
                          input.files = dataTransfer.files;
                          handleFileUpload({
                            target: { files: dataTransfer.files },
                          } as any);
                        }
                      }
                    }}
                  >
                    <div className="flex flex-col items-center justify-center space-y-4 px-6 py-10 text-center">
                      <div className="rounded-full bg-purple-900/20 p-4">
                        <Upload className="h-10 w-10 text-purple-400" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-lg font-medium text-white">
                          Drag & drop or click to upload
                        </p>
                        <p className="text-sm text-zinc-400">
                          MP4, MOV, WebM, AVI up to 500MB
                        </p>
                      </div>
                      <Button className="mt-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white transition-all hover:from-purple-600 hover:to-indigo-700">
                        Select Video File
                      </Button>
                    </div>
                    <input
                      id="video-upload"
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isUploading || isAnalyzing}
                    />
                  </label>
                </div>
              </div>
            )}

            {(isUploading || isAnalyzing) && (
              <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-white">
                      {isUploading ? 'Uploading Video' : 'Analyzing Content'}
                    </h3>
                    <p className="text-sm text-zinc-400">
                      {isUploading
                        ? 'Preparing your video...'
                        : 'AI is processing each frame to identify key moments...'}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-900/30">
                    {isUploading ? (
                      <Film className="h-5 w-5 text-indigo-400" />
                    ) : (
                      <Clock className="h-5 w-5 text-indigo-400" />
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>Processing</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div 
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {videoUrl && (
              <div className="space-y-6">
                <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/30">
                  <VideoPlayer
                    url={videoUrl}
                    timestamps={timestamps}
                    ref={videoRef}
                  />
                </div>
                
                {timestamps.length > 0 ? (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-medium text-white">
                        <span className="mr-2">Detected Key Moments</span>
                        <Badge className="bg-indigo-600">{timestamps.length}</Badge>
                      </h3>
                    </div>
                    <TimestampList
                      timestamps={timestamps}
                      onTimestampClick={handleTimestampClick}
                    />
                  </div>
                ) : !isAnalyzing && (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-6 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-900/20">
                      <Clock className="h-8 w-8 text-indigo-400" />
                    </div>
                    <h3 className="mb-2 text-lg font-medium text-white">No Timestamps Detected</h3>
                    <p className="text-zinc-400">
                      We couldn't find any notable moments in this video. You can still save it to your library.
                    </p>
                  </div>
                )}
                
                {/* Video Saving UI */}
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
                  <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-x-4 sm:space-y-0">
                    <div className="flex-grow">
                      <Input
                        type="text"
                        placeholder="Enter a name for this video"
                        value={videoName}
                        onChange={(e) => setVideoName(e.target.value)}
                        className="border-zinc-700 bg-zinc-800 text-white"
                      />
                    </div>
                    <div>
                      <Button
                        onClick={handleSaveVideo}
                        className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white transition-all hover:from-purple-600 hover:to-indigo-700 sm:w-auto"
                        disabled={!videoName}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save to Library
                      </Button>
                    </div>
                  </div>
                  
                  {showSuccessMessage && (
                    <Alert className="mt-4 border-green-800 bg-green-900/20 text-green-300">
                      <AlertDescription className="flex items-center">
                        <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-900/50">✓</span>
                        Video saved successfully to your library!
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Only shown when a video is loaded */}
          {videoUrl && (
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-xl border border-zinc-800 bg-black p-4 shadow-lg">
                <h3 className="mb-4 text-lg font-medium text-white">Video Info</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Name:</span>
                    <span className="font-medium text-white">{videoName}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Duration:</span>
                    <span className="font-medium text-white">
                      {videoRef.current?.duration 
                        ? `${Math.floor(videoRef.current.duration / 60)}:${Math.floor(videoRef.current.duration % 60).toString().padStart(2, '0')}`
                        : '--:--'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Timestamps:</span>
                    <Badge className="bg-indigo-600">{timestamps.length}</Badge>
                  </div>
                  
                  {timestamps.some(t => t.isDangerous) && (
                    <div className="mt-4 flex items-center rounded-lg bg-red-900/20 p-2 text-red-300">
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      <span className="text-xs">Contains potentially sensitive content</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="rounded-xl border border-zinc-800 bg-black p-4 shadow-lg">
                <h3 className="mb-4 text-lg font-medium text-white">Quick Actions</h3>
                
                <div className="space-y-2">
                  <Button 
                    variant="outline"
                    className="w-full justify-between border-zinc-700 text-left hover:bg-zinc-800"
                    onClick={() => {if (videoRef.current) videoRef.current.play()}}
                  >
                    <span>Play Video</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  
                  <Link href="/pages/saved-videos">
                    <Button 
                      variant="outline"
                      className="w-full justify-between border-zinc-700 text-left hover:bg-zinc-800"
                    >
                      <span>View Library</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  
                  <Button 
                    variant="outline"
                    className="w-full justify-between border-zinc-700 text-left hover:bg-zinc-800"
                    onClick={() => {
                      setVideoUrl('');
                      setTimestamps([]);
                      setVideoName('');
                    }}
                  >
                    <span>Upload New Video</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        
      
      </div>
    </div>
  );
}