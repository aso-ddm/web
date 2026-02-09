import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { loadFont } from "@remotion/google-fonts/Quicksand";

const { fontFamily: quicksandFont } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

type AnimatedTextProps = {
  text: string;
  fontSize?: number;
  color?: string;
  fontWeight?: "400" | "500" | "600" | "700";
  delay?: number;
  animationType?: "fade" | "slideUp" | "scale" | "typewriter";
};

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  fontSize = 48,
  color = "#004C48",
  fontWeight = "700",
  delay = 0,
  animationType = "slideUp",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const adjustedFrame = Math.max(0, frame - delay);

  const progress = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  let style: React.CSSProperties = {
    fontFamily: quicksandFont,
    fontSize,
    color,
    fontWeight,
    textAlign: "center",
    lineHeight: 1.2,
  };

  switch (animationType) {
    case "fade":
      style = {
        ...style,
        opacity: progress,
      };
      break;
    case "slideUp":
      style = {
        ...style,
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [50, 0])}px)`,
      };
      break;
    case "scale":
      style = {
        ...style,
        opacity: progress,
        transform: `scale(${progress})`,
      };
      break;
    case "typewriter":
      const charactersToShow = Math.floor(
        interpolate(adjustedFrame, [0, fps * 1.5], [0, text.length], {
          extrapolateRight: "clamp",
        })
      );
      return (
        <span style={style}>
          {text.slice(0, charactersToShow)}
          <span style={{ opacity: Math.sin(frame * 0.3) > 0 ? 1 : 0 }}>|</span>
        </span>
      );
  }

  return <span style={style}>{text}</span>;
};
