import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, OffthreadVideo, staticFile } from "remotion";
import { AnimatedText } from "../AnimatedText";
import { loadFont } from "@remotion/google-fonts/Quicksand";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
});

const COLORS = {
  primary: "#004C48",
  secondary: "#BA4C00",
  accent: "#FFD4A6",
  background: "#F3F3F3",
};

type WebRevealSceneProps = {
  isVertical?: boolean;
};

export const WebRevealScene: React.FC<WebRevealSceneProps> = ({ isVertical = false }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  // Animaciones
  const phoneScale = spring({
    frame: frame - fps * 0.3,
    fps,
    config: { damping: 15 },
  });

  const phoneRotation = interpolate(
    spring({ frame: frame - fps * 0.3, fps, config: { damping: 20 } }),
    [0, 1],
    [-10, 0]
  );

  const sparkle1 = Math.sin(frame * 0.2) * 0.3 + 0.7;

  const badgeScale = spring({
    frame: frame - fps * 1,
    fps,
    config: { damping: 8, stiffness: 150 },
  });

  // Dimensiones del mockup (ratio iPhone 390:844 = 1:2.16)
  const mockupWidth = isVertical ? width * 0.5 : width * 0.22;
  const mockupHeight = mockupWidth * 2.16;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${COLORS.primary} 0%, #006560 50%, ${COLORS.secondary}88 100%)`,
      }}
    >
      {/* Partículas brillantes */}
      {[...Array(12)].map((_, i) => {
        const x = 10 + (i * 8);
        const y = 15 + ((i * 17) % 70);
        const size = 4 + (i % 4) * 3;
        const sparkleAnim = Math.sin(frame * 0.15 + i) * 0.5 + 0.5;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              borderRadius: "50%",
              backgroundColor: COLORS.accent,
              opacity: sparkleAnim * 0.6,
              boxShadow: `0 0 ${size * 2}px ${COLORS.accent}`,
            }}
          />
        );
      })}

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: isVertical ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          padding: isVertical ? 50 : 80,
          gap: isVertical ? 40 : 80,
        }}
      >
        {/* Texto lado izquierdo */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: isVertical ? "center" : "flex-start",
            gap: 20,
            flex: isVertical ? "none" : 1,
            textAlign: isVertical ? "center" : "left",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              opacity: sparkle1,
            }}
          >
            <span style={{ fontSize: isVertical ? 36 : 42 }}>✨</span>
            <span
              style={{
                fontFamily,
                fontSize: isVertical ? 22 : 26,
                fontWeight: 600,
                color: COLORS.accent,
                textTransform: "uppercase",
                letterSpacing: 3,
              }}
            >
              Novedad
            </span>
            <span style={{ fontSize: isVertical ? 36 : 42 }}>✨</span>
          </div>

          <AnimatedText
            text="Nueva Web"
            fontSize={isVertical ? 64 : 80}
            color="white"
            fontWeight="700"
            delay={fps * 0.2}
            animationType="slideUp"
          />

          <AnimatedText
            text="Mismo Espíritu"
            fontSize={isVertical ? 42 : 52}
            color={COLORS.accent}
            fontWeight="600"
            delay={fps * 0.5}
            animationType="slideUp"
          />

          <div
            style={{
              marginTop: 20,
              opacity: interpolate(frame, [fps * 1, fps * 1.5], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            <span
              style={{
                fontFamily,
                fontSize: isVertical ? 20 : 24,
                color: "rgba(255,255,255,0.85)",
                lineHeight: 1.6,
              }}
            >
              Diseño moderno{isVertical ? " · " : <br />}
              Más fácil de usar{isVertical ? " · " : <br />}
              Toda la info que necesitas
            </span>
          </div>
        </div>

        {/* Mockup del teléfono */}
        <div
          style={{
            position: "relative",
            transform: `scale(${phoneScale}) rotate(${phoneRotation}deg)`,
          }}
        >
          {/* Marco del teléfono estilo iPhone */}
          <div
            style={{
              width: mockupWidth,
              height: mockupHeight,
              backgroundColor: "#0a0a0a",
              borderRadius: mockupWidth * 0.12,
              padding: mockupWidth * 0.03,
              boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px #333, inset 0 0 0 1px #222",
            }}
          >
            {/* Pantalla con video de scroll real */}
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: mockupWidth * 0.1,
                overflow: "hidden",
                position: "relative",
                backgroundColor: "#F3F3F3",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Safe area superior con notch */}
              <div
                style={{
                  width: "100%",
                  height: mockupWidth * 0.08,
                  backgroundColor: "#F3F3F3",
                  position: "relative",
                  flexShrink: 0,
                }}
              >
                {/* Dynamic Island / Notch */}
                <div
                  style={{
                    position: "absolute",
                    top: 6,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: mockupWidth * 0.28,
                    height: mockupWidth * 0.065,
                    backgroundColor: "#0a0a0a",
                    borderRadius: mockupWidth * 0.04,
                  }}
                />
              </div>
              {/* Contenedor del video */}
              <div
                style={{
                  flex: 1,
                  overflow: "hidden",
                }}
              >
                <OffthreadVideo
                  src={staticFile("web-scroll-club.webm")}
                  startFrom={30}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "top",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Badge "NUEVO" */}
          <div
            style={{
              position: "absolute",
              top: -20,
              right: -20,
              backgroundColor: COLORS.secondary,
              padding: "12px 20px",
              borderRadius: 30,
              transform: `scale(${badgeScale}) rotate(12deg)`,
              boxShadow: "0 5px 20px rgba(186, 76, 0, 0.4)",
            }}
          >
            <span
              style={{
                fontFamily,
                fontSize: isVertical ? 18 : 22,
                fontWeight: 700,
                color: "white",
              }}
            >
              NUEVO
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
