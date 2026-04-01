import { useState } from "react";
import { Play } from "lucide-react";

interface VideoPreviewProps {
  youtubeUrl?: string;
  thumbnailUrl?: string;
  title?: string;
}

function getYouTubeEmbedUrl(url: string): string {
  // Handle shorts URLs
  const shortsMatch = url.match(/youtube\.com\/shorts\/([^?&]+)/);
  if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}?autoplay=1`;

  // Handle standard watch URLs
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}?autoplay=1`;

  // Handle youtu.be URLs
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=1`;

  // Fallback: open channel
  return url;
}

function getYouTubeThumbnail(url: string): string | null {
  const shortsMatch = url.match(/youtube\.com\/shorts\/([^?&]+)/);
  if (shortsMatch) return `https://img.youtube.com/vi/${shortsMatch[1]}/hqdefault.jpg`;

  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return `https://img.youtube.com/vi/${watchMatch[1]}/hqdefault.jpg`;

  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return `https://img.youtube.com/vi/${shortMatch[1]}/hqdefault.jpg`;

  return null;
}

export function VideoPreview({
  youtubeUrl = "https://youtube.com/@redvitalium",
  thumbnailUrl,
  title,
}: VideoPreviewProps) {
  const [playing, setPlaying] = useState(false);
  const embedUrl = getYouTubeEmbedUrl(youtubeUrl);
  const autoThumbnail = thumbnailUrl || getYouTubeThumbnail(youtubeUrl);

  return (
    <div className="w-full max-w-[640px] mx-auto">
      <div
        className="relative rounded-xl overflow-hidden shadow-lg"
        style={{ aspectRatio: "16/9" }}
      >
        {playing ? (
          <iframe
            src={embedUrl}
            title={title || "Video"}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            className="block w-full h-full relative group cursor-pointer"
          >
            {autoThumbnail ? (
              <img
                src={autoThumbnail}
                alt={title || "Video preview"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-secondary via-secondary/90 to-primary/80" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                <Play className="h-7 w-7 md:h-8 md:w-8 text-primary fill-primary ml-1" />
              </div>
            </div>
          </button>
        )}
      </div>
      {title && (
        <p className="text-center text-sm text-muted-foreground mt-3 font-medium">
          {title}
        </p>
      )}
    </div>
  );
}
