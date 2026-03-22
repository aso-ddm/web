import { Img, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

type ImageGalleryProps = {
  images: string[];
  imageWidth?: number;
  aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16";
  columns?: number;
};

const ASPECT_RATIOS = {
  "1:1": 1,
  "3:4": 4 / 3,
  "4:3": 3 / 4,
  "9:16": 16 / 9,
};

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  imageWidth = 150,
  aspectRatio = "3:4",
  columns,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const imageHeight = imageWidth * ASPECT_RATIOS[aspectRatio];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: columns ? `repeat(${columns}, ${imageWidth}px)` : `repeat(auto-fit, ${imageWidth}px)`,
        gap: 16,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {images.map((image, index) => {
        const delay = index * 5;
        const adjustedFrame = Math.max(0, frame - delay);

        const scale = spring({
          frame: adjustedFrame,
          fps,
          config: { damping: 15 },
        });

        const rotation = interpolate(scale, [0, 1], [15, (index % 2 === 0 ? 1 : -1) * 3]);

        const opacity = interpolate(adjustedFrame, [0, fps * 0.3], [0, 1], {
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={index}
            style={{
              width: imageWidth,
              height: imageHeight,
              borderRadius: 12,
              overflow: "hidden",
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              opacity,
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
            }}
          >
            <Img
              src={staticFile(image)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
