import { motion } from "framer-motion";

type ZoneHighlight = {
  zone: "full" | "abdomen" | "skin" | "muscles" | "core" | "limbs" | "bones";
  color: string;
  opacity?: number;
};

interface BodySilhouetteProps {
  highlights?: ZoneHighlight[];
  label?: string;
}

// Realistic human silhouette path
const BODY_OUTLINE = `M100,12 C106,12 111,16 113,22 C115,28 114,35 112,40 C110,44 107,47 105,50
L105,52 C108,54 112,56 116,58 C122,61 128,64 134,68
L148,60 C152,56 156,50 160,44 C164,38 168,34 172,34
C176,34 179,37 180,42 C181,47 180,54 176,62 C172,70 166,78 160,84
L150,72 C146,76 142,80 140,86
C142,96 144,108 145,120 C146,132 146,144 145,156
C144,168 142,180 140,192 C139,200 138,208 138,216
C138,228 140,240 142,252 C144,264 146,276 148,288
C150,300 151,312 150,322 C149,330 146,336 142,340
C138,344 132,346 128,346 C124,346 120,344 118,340
L112,322 C110,314 108,306 106,298 C104,290 103,282 102,274
L100,268
L98,274 C97,282 96,290 94,298 C92,306 90,314 88,322
L82,340 C80,344 76,346 72,346 C68,346 62,344 58,340
C54,336 51,330 50,322 C49,312 50,300 52,288
C54,276 56,264 58,252 C60,240 62,228 62,216
C62,208 61,200 60,192 C58,180 56,168 55,156
C54,144 54,132 55,120 C56,108 58,96 60,86
C58,80 54,76 50,72
L40,84 C34,78 28,70 24,62 C20,54 19,47 20,42
C21,37 24,34 28,34 C32,34 36,38 40,44 C44,50 48,56 52,60
L66,68 C72,64 78,61 84,58 C88,56 92,54 95,52
L95,50 C93,47 90,44 88,40 C86,35 85,28 87,22
C89,16 94,12 100,12 Z`;

// Subcutaneous fat - follows body outline but slightly inside
const SKIN_LAYER = `M100,18 C104,18 108,21 110,26 C112,32 111,38 109,42 C107,46 105,48 103,51
L103,53 C106,55 110,57 114,59 C120,62 126,65 132,69
L145,61 C149,57 153,52 157,46 C161,40 164,37 168,37
C171,37 173,39 174,43 C175,48 174,54 170,62 C167,69 162,76 157,82
L148,73 C144,77 141,82 139,88
C141,98 143,110 144,122 C145,134 145,146 144,158
C143,170 141,182 139,194 C138,202 137,210 137,218
C137,230 139,242 141,254 C143,266 145,278 147,290
C149,302 150,314 149,324 C148,330 146,334 143,338
C140,341 135,343 131,343 C128,343 125,341 123,338
L117,320 C115,312 113,304 111,296 C109,288 108,280 107,272
L105,266 L100,260 L95,266
L93,272 C92,280 91,288 89,296 C87,304 85,312 83,320
L77,338 C75,341 72,343 69,343 C65,343 60,341 57,338
C54,334 52,330 51,324 C50,314 51,302 53,290
C55,278 57,266 59,254 C61,242 63,230 63,218
C63,210 62,202 61,194 C59,182 57,170 56,158
C55,146 55,134 56,122 C57,110 59,98 61,88
C59,82 56,77 52,73
L43,82 C38,76 33,69 30,62 C26,54 25,48 26,43
C27,39 29,37 32,37 C36,37 39,40 43,46 C47,52 51,57 55,61
L68,69 C74,65 80,62 86,59 C90,57 94,55 97,53
L97,51 C95,48 93,46 91,42 C89,38 88,32 90,26
C92,21 96,18 100,18 Z`;

// Visceral fat - abdominal area
const VISCERAL_ZONE = `M78,110 C82,105 90,102 100,102 C110,102 118,105 122,110
C126,118 128,130 128,142 C128,154 126,166 122,175
C118,182 110,186 100,186 C90,186 82,182 78,175
C74,166 72,154 72,142 C72,130 74,118 78,110 Z`;

// Muscle groups
const MUSCLE_ARMS = `M134,68 L148,60 C152,56 156,50 160,44 C164,38 168,34 172,34
C176,34 179,37 180,42 C181,47 180,54 176,62 C172,70 166,78 160,84
L150,72 C146,76 142,80 140,86 C142,82 138,76 134,68 Z
M66,68 L52,60 C48,56 44,50 40,44 C36,38 32,34 28,34
C24,34 21,37 20,42 C19,47 20,54 24,62 C28,70 34,78 40,84
L50,72 C54,76 58,80 60,86 C58,82 62,76 66,68 Z`;

const MUSCLE_LEGS = `M102,268 L106,298 C108,306 110,314 112,322
L118,340 C120,344 124,346 128,346 C132,346 138,344 142,340
C146,336 149,330 150,322 C151,312 150,300 148,288
C146,276 144,264 142,252 C140,240 138,228 138,216
C138,210 138,204 140,196 L120,200 C116,220 114,240 112,258 L102,268 Z
M98,268 L94,298 C92,306 90,314 88,322
L82,340 C80,344 76,346 72,346 C68,346 62,344 58,340
C54,336 51,330 50,322 C49,312 50,300 52,288
C54,276 56,264 58,252 C60,240 62,228 62,216
C62,210 62,204 60,196 L80,200 C84,220 86,240 88,258 L98,268 Z`;

const MUSCLE_TORSO = `M95,52 C92,54 88,56 84,58 C78,61 72,64 66,68
C62,76 58,82 60,90 C62,100 64,112 65,124
C66,136 66,148 65,160 C64,172 62,184 60,196
L80,200 L100,205 L120,200
L140,196 C138,184 136,172 135,160
C134,148 134,136 135,124 C136,112 138,100 140,90
C142,82 138,76 134,68 C128,64 122,61 116,58
C112,56 108,54 105,52 L100,50 L95,52 Z`;

const BONE_SKELETON = `M100,20 L100,50 M85,60 L115,60 M100,60 L100,196
M100,196 L80,268 L75,340 M100,196 L120,268 L125,340
M66,68 L35,60 M134,68 L165,60
M80,120 L120,120 M75,160 L125,160`;

export function BodySilhouette({ highlights = [], label }: BodySilhouetteProps) {
  const ids = {
    grad: `grad-${Math.random().toString(36).slice(2)}`,
    skinGrad: `skinGrad-${Math.random().toString(36).slice(2)}`,
  };

  const getHighlight = (zone: string) => highlights.find(h => h.zone === zone);

  const fullH = getHighlight("full");
  const skinH = getHighlight("skin");
  const abdomenH = getHighlight("abdomen");
  const musclesH = getHighlight("muscles");
  const coreH = getHighlight("core");
  const limbsH = getHighlight("limbs");
  const bonesH = getHighlight("bones");

  return (
    <svg viewBox="0 0 200 360" className="w-full h-full max-h-[300px]" xmlns="http://www.w3.org/2000/svg">
      {/* Base outline */}
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
        d={BODY_OUTLINE}
        fill="none"
        stroke="hsl(var(--muted-foreground))"
        strokeWidth="1.5"
        strokeOpacity={0.4}
      />

      {/* Full body fill */}
      {fullH && (
        <motion.path
          initial={{ opacity: 0 }}
          animate={{ opacity: fullH.opacity ?? 0.3 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          d={BODY_OUTLINE}
          fill={fullH.color}
        />
      )}

      {/* Subcutaneous fat layer (skin edge) */}
      {skinH && (
        <motion.path
          initial={{ opacity: 0 }}
          animate={{ opacity: skinH.opacity ?? 0.45 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          d={SKIN_LAYER}
          fill="none"
          stroke={skinH.color}
          strokeWidth="6"
          strokeOpacity={skinH.opacity ?? 0.5}
        />
      )}

      {/* Visceral fat zone (abdomen) */}
      {abdomenH && (
        <motion.path
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: abdomenH.opacity ?? 0.5, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          d={VISCERAL_ZONE}
          fill={abdomenH.color}
          style={{ transformOrigin: "100px 144px" }}
        />
      )}

      {/* Muscle torso */}
      {coreH && (
        <motion.path
          initial={{ opacity: 0 }}
          animate={{ opacity: coreH.opacity ?? 0.35 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          d={MUSCLE_TORSO}
          fill={coreH.color}
        />
      )}

      {/* Muscle arms + legs */}
      {limbsH && (
        <>
          <motion.path
            initial={{ opacity: 0 }}
            animate={{ opacity: limbsH.opacity ?? 0.3 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            d={MUSCLE_ARMS}
            fill={limbsH.color}
          />
          <motion.path
            initial={{ opacity: 0 }}
            animate={{ opacity: limbsH.opacity ?? 0.3 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            d={MUSCLE_LEGS}
            fill={limbsH.color}
          />
        </>
      )}

      {/* Full muscle overlay */}
      {musclesH && (
        <>
          <motion.path
            initial={{ opacity: 0 }}
            animate={{ opacity: musclesH.opacity ?? 0.35 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            d={MUSCLE_TORSO}
            fill={musclesH.color}
          />
          <motion.path
            initial={{ opacity: 0 }}
            animate={{ opacity: musclesH.opacity ?? 0.3 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            d={MUSCLE_ARMS}
            fill={musclesH.color}
          />
          <motion.path
            initial={{ opacity: 0 }}
            animate={{ opacity: musclesH.opacity ?? 0.3 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            d={MUSCLE_LEGS}
            fill={musclesH.color}
          />
        </>
      )}

      {/* Bone skeleton overlay */}
      {bonesH && (
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 0.5 }}
          d={BONE_SKELETON}
          fill="none"
          stroke={bonesH.color}
          strokeWidth="2.5"
          strokeOpacity={bonesH.opacity ?? 0.6}
          strokeLinecap="round"
        />
      )}

      {/* Label */}
      {label && (
        <text x="100" y="355" textAnchor="middle" className="text-[11px] fill-muted-foreground">
          {label}
        </text>
      )}
    </svg>
  );
}
