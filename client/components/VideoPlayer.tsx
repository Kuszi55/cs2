import React from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoPlayerProps {
  videoPath: string;
  clipId: string;
  moment?: {
    playerName?: string;
    suspicionType?: string;
    confidence?: number;
    description?: string;
  };
  onClose?: () => void;
}

export function VideoPlayer({
  videoPath,
  clipId,
  moment,
  onClose,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      videoRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getSuspicionColor = (type?: string) => {
    switch (type) {
      case "wallhack":
        return "bg-red-500/20 text-red-300 border-red-500";
      case "aim_lock":
        return "bg-orange-500/20 text-orange-300 border-orange-500";
      case "reaction_time":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500";
      case "impossible_angle":
        return "bg-purple-500/20 text-purple-300 border-purple-500";
      default:
        return "bg-blue-500/20 text-blue-300 border-blue-500";
    }
  };

  return (
    <div className="relative space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        <video
          ref={videoRef}
          src={videoPath}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration);
            }
          }}
          onTimeUpdate={() => {
            if (videoRef.current) {
              setCurrentTime(videoRef.current.currentTime);
            }
          }}
          onEnded={() => setIsPlaying(false)}
          className="w-full h-full"
        />

        {/* Controls Overlay */}
        <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity group">
          {/* Top - Close Button */}
          {onClose && (
            <div className="p-4 flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Bottom - Player Controls */}
          <div className="p-4 space-y-2">
            {/* Progress Bar */}
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={(e) => {
                if (videoRef.current) {
                  videoRef.current.currentTime = parseFloat(e.target.value);
                }
              }}
              className="w-full h-1 bg-slate-600 rounded cursor-pointer accent-blue-500"
            />

            {/* Control Buttons and Time */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={togglePlay}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>

                <span className="text-white text-xs whitespace-nowrap">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={handleFullscreen}
                className="text-white hover:bg-white/20"
              >
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Moment Info */}
      {moment && (
        <div
          className={`p-4 rounded-lg border ${getSuspicionColor(moment.suspicionType)}`}
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold">
              {moment.playerName || "Unknown Player"}
            </h4>
            {moment.confidence && (
              <span className="text-sm">
                Confidence: {moment.confidence.toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-sm opacity-90">
            {moment.suspicionType?.replace(/_/g, " ").toUpperCase() ||
              "Suspicious Moment"}
          </p>
          {moment.description && (
            <p className="text-xs opacity-75 mt-1">{moment.description}</p>
          )}
        </div>
      )}
    </div>
  );
}
