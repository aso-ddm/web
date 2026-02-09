import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { loadFont } from "@remotion/google-fonts/Quicksand";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
});

type FeatureCardProps = {
  icon: string;
  title: string;
  delay?: number;
  backgroundColor?: string;
  textColor?: string;
};

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  delay = 0,
  backgroundColor = "#FFD4A6",
  textColor = "#004C48",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const adjustedFrame = Math.max(0, frame - delay);

  const scale = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 12, stiffness: 150 },
  });

  const opacity = interpolate(adjustedFrame, [0, fps * 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px 40px",
        backgroundColor,
        borderRadius: 20,
        transform: `scale(${scale})`,
        opacity,
        gap: 15,
        minWidth: 200,
      }}
    >
      <span style={{ fontSize: 50 }}>{icon}</span>
      <span
        style={{
          fontFamily,
          fontSize: 24,
          fontWeight: 700,
          color: textColor,
          textAlign: "center",
        }}
      >
        {title}
      </span>
    </div>
  );
};
