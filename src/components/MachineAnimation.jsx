/**
 * MachineAnimation — real-time layered render of the H-Bot / CoreXY machine.
 *
 * Replaces the static photo on the Home page.  Each moving sub-assembly is a
 * transparent PNG layer translated according to the live machine position
 * read from the GRBL controller (via the `coords` prop).  When the machine
 * moves, the model moves with it.
 *
 * The stage uses a light background so it blends with the white interface —
 * the visual language of the rest of the app is preserved.
 */
import { useMemo } from 'react'
import { offsetsFromCoords, toLayerStyle, SCENE_SIZE } from '../lib/animation'

import frameImg from '../assets/machine/frame.png'
import lowerTowersImg from '../assets/machine/lower-towers.png'
import greenLeftImg from '../assets/machine/green-left.png'
import greenRightImg from '../assets/machine/green-right.png'
import greenLeftOverlayImg from '../assets/machine/green-left-overlay.png'
import greenRightOverlayImg from '../assets/machine/green-right-overlay.png'
import blueImg from '../assets/machine/blue.png'
import blueOverlayImg from '../assets/machine/blue-overlay.png'
import motorOverlayImg from '../assets/machine/motor-overlay.png'
import zAssemblyImg from '../assets/machine/z-assembly.png'

const layerImg = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  userSelect: 'none',
  pointerEvents: 'none',
}

const motionLayer = {
  position: 'absolute',
  inset: 0,
  transition: 'transform 180ms ease-out',
  willChange: 'transform',
}

export default function MachineAnimation({
  coords = { x: 0, y: 0, z: 0 },
  travels = { x: 300, y: 300, z: 45 },
  className = '',
}) {
  const offsets = useMemo(() => offsetsFromCoords(coords, travels), [coords, travels])

  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl ${className}`}
      style={{
        aspectRatio: `${SCENE_SIZE.width} / ${SCENE_SIZE.height}`,
        background:
          'radial-gradient(circle at 50% 30%, #ffffff 0%, #f3f4f6 60%, #e5e7eb 100%)',
        filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.12))',
      }}
    >
      {/* Fixed frame + bed */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <img src={frameImg} alt="Bâti fixe" style={layerImg} />
      </div>

      {/* Green traverses — move on Y */}
      <div style={{ ...motionLayer, zIndex: 2, ...toLayerStyle(offsets.green) }}>
        <img src={greenRightImg} alt="Traverse verte droite" style={layerImg} />
        <img src={greenRightOverlayImg} alt="" style={layerImg} />
      </div>

      {/* Yellow Z assembly — moves on Y + X + Z */}
      <div style={{ ...motionLayer, zIndex: 3, ...toLayerStyle(offsets.yellow) }}>
        <img src={zAssemblyImg} alt="Ensemble Z jaune" style={layerImg} />
      </div>

      {/* Blue carriage — moves on Y + X */}
      <div style={{ ...motionLayer, zIndex: 4, ...toLayerStyle(offsets.blue) }}>
        <img src={blueImg} alt="Chariot bleu" style={layerImg} />
        <img src={motorOverlayImg} alt="" style={layerImg} />
        <img src={blueOverlayImg} alt="" style={layerImg} />
      </div>

      {/* Left green traverse overlay — move on Y (drawn above blue) */}
      <div style={{ ...motionLayer, zIndex: 5, ...toLayerStyle(offsets.green) }}>
        <img src={greenLeftImg} alt="Traverse verte gauche" style={layerImg} />
        <img src={greenLeftOverlayImg} alt="" style={layerImg} />
      </div>

      {/* Lower towers (foreground) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 6 }}>
        <img src={lowerTowersImg} alt="Tours support" style={layerImg} />
      </div>
    </div>
  )
}
