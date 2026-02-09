import { Composition, Folder } from "remotion";
import { DragonDeMaderaPromo } from "./compositions/DragonDeMaderaPromo";
import { DragonDeMaderaReel } from "./compositions/DragonDeMaderaReel";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Dragon-de-Madera">
        {/* Video largo promocional (16:9) - para YouTube/Web */}
        <Composition
          id="DragonDeMaderaPromo"
          component={DragonDeMaderaPromo}
          durationInFrames={540} // 18 segundos a 30fps
          fps={30}
          width={1920}
          height={1080}
        />
        {/* Video vertical (9:16) - para Instagram Reels / TikTok */}
        <Composition
          id="DragonDeMaderaReel"
          component={DragonDeMaderaReel}
          durationInFrames={540} // 18 segundos a 30fps
          fps={30}
          width={1080}
          height={1920}
        />
      </Folder>
    </>
  );
};
