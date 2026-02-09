import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import { Logo } from "../Logo";
import { AnimatedText } from "../AnimatedText";

// Colores del brand
const COLORS = {
  primary: "#004C48",
  secondary: "#BA4C00",
  accent: "#FFD4A6",
  background: "#F3F3F3",
};

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Animación del fondo
  const bgScale = interpolate(frame, [0, fps * 3], [1.1, 1], {
    extrapolateRight: "clamp",
  });

  const overlayOpacity = interpolate(frame, [0, fps * 0.5], [0.7, 0.6], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      {/* Imagen de fondo con zoom lento */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          transform: `scale(${bgScale})`,
        }}
      >
        <Img
          src={staticFile("club-community-people-playing.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>

      {/* Overlay con gradiente */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background: `linear-gradient(135deg, ${COLORS.primary}ee ${overlayOpacity * 100}%, ${COLORS.secondary}dd ${overlayOpacity * 80}%)`,
        }}
      />

      {/* Contenido */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 30,
        }}
      >
        <Logo variant="white" size={width > 1200 ? 350 : 250} />

        <div style={{ marginTop: 20 }}>
          <AnimatedText
            text="TU CLUB DE JUEGOS DE MESA"
            fontSize={width > 1200 ? 56 : 40}
            color="white"
            fontWeight="700"
            delay={fps * 0.8}
            animationType="slideUp"
          />
        </div>

        <AnimatedText
          text="EN GRANADA"
          fontSize={width > 1200 ? 72 : 52}
          color={COLORS.accent}
          fontWeight="700"
          delay={fps * 1.2}
          animationType="scale"
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
