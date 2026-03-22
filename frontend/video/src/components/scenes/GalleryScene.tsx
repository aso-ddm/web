import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import { AnimatedText } from "../AnimatedText";
import { ImageGallery } from "../ImageGallery";

const COLORS = {
  primary: "#004C48",
  secondary: "#BA4C00",
  accent: "#FFD4A6",
  background: "#F3F3F3",
};

const GALLERY_IMAGES = [
  "instagram-1a.jpg",
  "instagram-2a.jpg",
  "instagram-3a.jpg",
  "instagram-4a.jpg",
  "instagram-5a.jpg",
  "instagram-6a.jpg",
];

type GallerySceneProps = {
  isVertical?: boolean;
};

export const GalleryScene: React.FC<GallerySceneProps> = ({ isVertical = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgRotation = interpolate(frame, [0, fps * 10], [0, 360]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.primary,
        overflow: "hidden",
      }}
    >
      {/* Fondo decorativo rotando */}
      <div
        style={{
          position: "absolute",
          width: "200%",
          height: "200%",
          left: "-50%",
          top: "-50%",
          background: `conic-gradient(from ${bgRotation}deg, ${COLORS.primary} 0deg, ${COLORS.secondary}33 90deg, ${COLORS.primary} 180deg, ${COLORS.secondary}33 270deg, ${COLORS.primary} 360deg)`,
          opacity: 0.3,
        }}
      />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: isVertical ? 40 : 80,
          gap: isVertical ? 80 : 60,
        }}
      >
        <AnimatedText
          text="Nuestra Comunidad"
          fontSize={isVertical ? 90 : 80}
          color="white"
          fontWeight="700"
          animationType="slideUp"
        />

        <ImageGallery
          images={GALLERY_IMAGES}
          imageWidth={isVertical ? 260 : 240}
          aspectRatio="3:4"
          columns={3}
        />

        <AnimatedText
          text="@dragondemadera"
          fontSize={isVertical ? 56 : 48}
          color={COLORS.accent}
          fontWeight="600"
          delay={fps * 1}
          animationType="fade"
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
