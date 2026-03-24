import { Play } from "lucide-react";

interface VideoPreviewProps {
  youtubeUrl?: string;
  thumbnailUrl?: string;
  title?: string;
}

export function VideoPreview({
  youtubeUrl = "https://youtube.com/@redvitalium",
  thumbnailUrl,
  title,
}: VideoPreviewProps) {
  return (
    <div className="w-full max-w-[640px] mx-auto">
      <a
        href={youtubeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow group"
        style={{ aspectRatio: "16/9" }}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
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
      </a>
      {title && (
        <p className="text-center text-sm text-muted-foreground mt-3 font-medium">
          {title}
        </p>
      )}
    </div>
  );
}
