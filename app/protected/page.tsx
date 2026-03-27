'use client';

import { useState } from 'react';
import { CameraFeed } from '@/components/camera-feed';
import { CameraModal } from '@/components/camera-modal';
import { EventFeed } from '@/components/event-feed';
import { StatsOverview } from '@/components/stats-overview';
import { locations, events } from '@/lib/data';

export default function Page() {
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [mainCamera, setMainCamera] = useState<string | null>(
    locations.flatMap(loc => loc.cameras)[0]?.id || null
  );
  const [videoTimes, setVideoTimes] = useState<Record<string, number>>({});
  const [hoveredCamera, setHoveredCamera] = useState<string | null>(null);

  const allCameras = locations.flatMap(location => location.cameras);

  const handleTimeUpdate = (cameraId: string, time: number) => {
    setVideoTimes((prev) => ({
      ...prev,
      [cameraId]: time,
    }));
  };

  const handleEventClick = (cameraId: string, timestamp: number) => {
    setSelectedCamera(cameraId);
    setVideoTimes((prev) => ({
      ...prev,
      [cameraId]: timestamp,
    }));
  };

  const handleMarqueeVideoClick = (cameraId: string) => {
    setSelectedCamera(cameraId);
    setMainCamera(cameraId); // optional: switch main camera
  };

  const mainCameraObj = allCameras.find(
    (camera) => camera.id === mainCamera
  );

  return (
    <div className='flex w-full flex-1'>
      <div className='flex-1 overflow-auto'>
        <div className='container mx-auto py-6'>
          {mainCameraObj && (
            <div className='mb-6'>
              <div className='relative aspect-video overflow-hidden rounded-lg'>
                <CameraFeed
                  camera={mainCameraObj}
                  onTimeUpdate={(time) =>
                    handleTimeUpdate(mainCameraObj.id, time)
                  }
                />
                <div className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4'>
                  <div className='font-medium text-white'>
                    {mainCameraObj.name}
                  </div>
                  <div className='text-sm text-white/75'>
                    {mainCameraObj.address}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className='relative overflow-hidden'>
            <div className='flex animate-marquee space-x-4 py-2'>
              {locations.flatMap((location) =>
                location.cameras.map((camera) => (
                  <button
                    key={camera.id}
                    onClick={() => handleMarqueeVideoClick(camera.id)}
                    onMouseEnter={() => setHoveredCamera(camera.id)}
                    onMouseLeave={() => setHoveredCamera(null)}
                    className={`relative h-32 w-56 flex-shrink-0 overflow-hidden rounded-lg transition-opacity duration-300 hover:ring-2 hover:ring-blue-500 ${
                      hoveredCamera && hoveredCamera !== camera.id
                        ? 'opacity-70'
                        : 'opacity-100'
                    }`}
                  >
                    <CameraFeed
                      camera={camera}
                      onTimeUpdate={(time) =>
                        handleTimeUpdate(camera.id, time)
                      }
                    />
                    <div className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-2'>
                      <div className='text-sm font-medium text-white'>
                        {camera.name}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className='hidden w-96 overflow-auto border-l p-6 lg:block'>
        <StatsOverview />
        <div className='mt-6'>
          <EventFeed
            events={events}
            videoTimes={videoTimes}
            onEventHover={setHoveredCamera}
            onEventClick={handleEventClick}
          />
        </div>
      </div>

      {selectedCamera && (
        <CameraModal
          open={true}
          onOpenChange={(open) => !open && setSelectedCamera(null)}
          cameraId={selectedCamera}
          currentTime={videoTimes[selectedCamera]}
          date={new Date()}
        />
      )}
    </div>
  );
}