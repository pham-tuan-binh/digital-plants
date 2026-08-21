"use client";

import PlantCanvas from "@/components/PlantCanvas";
import { useCamera } from "../film/camera";
import { CUES, FPS, FRAMES, SPECIMENS, growthAt } from "./score";
import "./gallery.css";

/**
 * Every species at once.
 *
 * No cuts and no derivation: fifteen plates on one sheet, all drawing
 * themselves at the same time and each named as it finishes.
 */
export default function Gallery() {
  const { frame, scale } = useCamera(FRAMES, FPS, CUES);

  return (
    <div className="film-fit" style={{ ["--film-scale" as string]: scale }}>
      <div className="film-stage">
        <div className="shot-gallery">
          {SPECIMENS.map((s) => {
            const { reveal, named } = growthAt(s, frame);
            return (
              <div className="gal-cell" key={s.plant.id}>
                <div className="gal-fig">
                  <PlantCanvas
                    drawing={s.drawing}
                    reveal={reveal}
                    roughness={1.1}
                    merge
                    anchor="bottom"
                    seed={s.seed}
                    flower={s.plant.flower}
                    petals={s.plant.petals}
                    heartScale={s.plant.heartScale}
                    rings={s.plant.rings}
                    stemColour={s.plant.stemColour}
                    title={s.plant.name}
                  />
                </div>
                <p className="gal-name" style={{ opacity: named }}>
                  {s.plant.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
