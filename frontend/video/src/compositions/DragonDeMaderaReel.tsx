import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { IntroScene } from "../components/scenes/IntroScene";
import { WebRevealScene } from "../components/scenes/WebRevealScene";
import { FeaturesScene } from "../components/scenes/FeaturesScene";
import { GalleryScene } from "../components/scenes/GalleryScene";
import { CTAScene } from "../components/scenes/CTAScene";

// Video vertical 9:16 para Instagram Reels / TikTok (1080x1920)
export const DragonDeMaderaReel: React.FC = () => {
  const SCENE_DURATION = 105; // 3.5 segundos por escena
  const TRANSITION_DURATION = 15; // 0.5 segundos de transición

  return (
    <AbsoluteFill>
      <Audio src={staticFile("musica.mp3")} volume={0.8} />
      <TransitionSeries>
        {/* Escena 1: Intro con logo y tagline */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATION}>
          <IntroScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        {/* Escena 2: Nueva Web - Reveal (0.5s pausa + 5s scroll + 0.5s final) */}
        <TransitionSeries.Sequence durationInFrames={180}>
          <WebRevealScene isVertical={true} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        {/* Escena 3: Features / Beneficios */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATION}>
          <FeaturesScene isVertical={true} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        {/* Escena 4: Galería de la comunidad */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATION}>
          <GalleryScene isVertical={true} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />

        {/* Escena 5: Call to Action */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATION}>
          <CTAScene isVertical={true} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
