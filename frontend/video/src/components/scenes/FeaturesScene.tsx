import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { AnimatedText } from "../AnimatedText";
import { FeatureCard } from "../FeatureCard";

const COLORS = {
  primary: "#004C48",
  secondary: "#BA4C00",
  accent: "#FFD4A6",
  background: "#F3F3F3",
};

const FEATURES = [
  { icon: "🎲", title: "800+ Juegos" },
  { icon: "🎁", title: "3 Visitas Gratis" },
  { icon: "👨‍👩‍👧‍👦", title: "Todas las Edades" },
];

type FeaturesSceneProps = {
  isVertical?: boolean;
};

export const FeaturesScene: React.FC<FeaturesSceneProps> = ({ isVertical = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animación de las partículas decorativas
  const particleY = interpolate(frame, [0, fps * 4], [0, -50]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${COLORS.background} 0%, white 100%)`,
      }}
    >
      {/* Partículas decorativas */}
      {[...Array(8)].map((_, i) => {
        const x = 10 + (i * 12);
        const y = 20 + (i % 3) * 30;
        const size = 10 + (i % 3) * 8;
        const opacity = 0.1 + (i % 3) * 0.05;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y + particleY * (i % 2 === 0 ? 1 : -0.5)}%`,
              width: size,
              height: size,
              borderRadius: "50%",
              backgroundColor: i % 2 === 0 ? COLORS.primary : COLORS.secondary,
              opacity,
            }}
          />
        );
      })}

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: isVertical ? 60 : 80,
          gap: isVertical ? 50 : 60,
        }}
      >
        <AnimatedText
          text="¿Por qué unirte?"
          fontSize={isVertical ? 52 : 64}
          color={COLORS.primary}
          fontWeight="700"
          animationType="slideUp"
        />

        <div
          style={{
            display: "flex",
            flexDirection: isVertical ? "column" : "row",
            gap: isVertical ? 30 : 40,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {FEATURES.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              delay={fps * 0.5 + index * 10}
              backgroundColor={COLORS.accent}
              textColor={COLORS.primary}
            />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
