import { motion } from "framer-motion";

interface BodySilhouetteProps {
  highlightColor: string;
  opacity?: number;
  fillPercentage?: number;
  direction?: "top" | "bottom";
  label?: string;
}

export function BodySilhouette({ 
  highlightColor, 
  opacity = 0.4, 
  fillPercentage = 100,
  direction = "bottom",
}: BodySilhouetteProps) {
  const clipId = `clip-${Math.random().toString(36).slice(2)}`;
  const gradientId = `grad-${Math.random().toString(36).slice(2)}`;
  
  // Calculate clip rect based on fill percentage and direction
  const fillHeight = (fillPercentage / 100) * 400;
  const yStart = direction === "bottom" ? 400 - fillHeight : 0;

  return (
    <svg viewBox="0 0 200 400" className="w-full h-full max-h-[320px]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y={yStart} width="200" height={fillHeight} />
        </clipPath>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={highlightColor} stopOpacity={opacity * 0.6} />
          <stop offset="50%" stopColor={highlightColor} stopOpacity={opacity} />
          <stop offset="100%" stopColor={highlightColor} stopOpacity={opacity * 0.8} />
        </linearGradient>
      </defs>
      
      {/* Base silhouette outline */}
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}
        d="M100,10 
           C108,10 115,15 118,22 C121,29 120,38 118,45 C116,50 112,54 110,58
           C115,62 122,65 128,70 C138,78 148,82 155,90
           C160,96 162,104 160,112 C158,118 152,122 148,126
           C152,135 155,145 156,155 C158,170 158,185 156,200
           C155,210 154,220 154,230 C154,245 156,260 158,275
           C160,285 163,295 165,305 C167,315 168,325 166,335
           C164,345 158,352 152,358 C146,364 138,368 132,370
           C128,372 124,370 120,368
           L115,365 C112,370 108,375 105,380 C103,384 101,388 100,390
           C99,388 97,384 95,380 C92,375 88,370 85,365
           L80,368 C76,370 72,372 68,370
           C62,368 54,364 48,358 C42,352 36,345 34,335
           C32,325 33,315 35,305 C37,295 40,285 42,275
           C44,260 46,245 46,230 C46,220 45,210 44,200
           C42,185 42,170 44,155 C45,145 48,135 52,126
           C48,122 42,118 40,112 C38,104 40,96 45,90
           C52,82 62,78 72,70 C78,65 85,62 90,58
           C88,54 84,50 82,45 C80,38 79,29 82,22
           C85,15 92,10 100,10 Z"
        fill="none"
        stroke="hsl(var(--muted-foreground))"
        strokeWidth="1.5"
        strokeOpacity={0.3}
      />

      {/* Filled silhouette with clip */}
      <motion.path
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        d="M100,10 
           C108,10 115,15 118,22 C121,29 120,38 118,45 C116,50 112,54 110,58
           C115,62 122,65 128,70 C138,78 148,82 155,90
           C160,96 162,104 160,112 C158,118 152,122 148,126
           C152,135 155,145 156,155 C158,170 158,185 156,200
           C155,210 154,220 154,230 C154,245 156,260 158,275
           C160,285 163,295 165,305 C167,315 168,325 166,335
           C164,345 158,352 152,358 C146,364 138,368 132,370
           C128,372 124,370 120,368
           L115,365 C112,370 108,375 105,380 C103,384 101,388 100,390
           C99,388 97,384 95,380 C92,375 88,370 85,365
           L80,368 C76,370 72,372 68,370
           C62,368 54,364 48,358 C42,352 36,345 34,335
           C32,325 33,315 35,305 C37,295 40,285 42,275
           C44,260 46,245 46,230 C46,220 45,210 44,200
           C42,185 42,170 44,155 C45,145 48,135 52,126
           C48,122 42,118 40,112 C38,104 40,96 45,90
           C52,82 62,78 72,70 C78,65 85,62 90,58
           C88,54 84,50 82,45 C80,38 79,29 82,22
           C85,15 92,10 100,10 Z"
        fill={`url(#${gradientId})`}
        clipPath={`url(#${clipId})`}
      />
    </svg>
  );
}
