import { Img, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

type LogoProps = {
  variant?: "color" | "white";
  size?: number;
  animated?: boolean;
};

export const Logo: React.FC<LogoProps> = ({
  variant = "color",
  size = 200,
  animated = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoFile =
    variant === "white"
      ? "logo-dragon-de-madera-blanco.svg"
      : "logo-dragon-de-madera.svg";

  const scale = animated
    ? spring({
        frame,
        fps,
        config: { damping: 12 },
      })
    : 1;

  const opacity = animated
    ? interpolate(frame, [0, fps * 0.5], [0, 1], {
        extrapolateRight: "clamp",
      })
    : 1;

  return (
    <Img
      src={staticFile(logoFile)}
      style={{
        width: size,
        height: "auto",
        transform: `scale(${scale})`,
        opacity,
      }}
    />
  );
};
