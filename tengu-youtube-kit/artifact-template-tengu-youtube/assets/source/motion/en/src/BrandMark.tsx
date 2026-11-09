import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

const SUMI = '#11110F';
const WASHI = '#E9DFC9';
const RED = '#C92F20';
const GOLD = '#A9853E';

type Props = {
  inverse?: boolean;
  size?: number;
  animated?: boolean;
};

const nodes = [
  [256, 144], [159, 200], [159, 312], [256, 368], [353, 312], [353, 200],
] as const;

export const BrandMark: React.FC<Props> = ({inverse = false, size = 512, animated = true}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ink = inverse ? WASHI : SUMI;
  const core = animated ? spring({frame, fps, config: {damping: 13, stiffness: 220, mass: .65}, durationInFrames: 12}) : 1;
  const ring = animated ? interpolate(frame, [14, 38], [590, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}) : 0;
  const outer = animated ? interpolate(frame, [28, 49], [610, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)}) : 0;
  const reg = animated ? interpolate(frame, [38, 56], [0, .72], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : .72;

  return (
    <svg width={size} height={size} viewBox="0 0 512 512" style={{overflow: 'visible'}}>
      <g fill="none" stroke={ink} opacity={reg}>
        <path d="M256 54V105M256 407V458M54 256H105M407 256H458" strokeWidth="4" />
      </g>
      <circle cx="256" cy="256" r="156" fill="none" stroke={ink} strokeWidth="5" strokeDasharray="213 31 92 22 151 471" transform="rotate(-70 256 256)" strokeDashoffset={outer}/>
      <circle cx="256" cy="256" r="112" fill="none" stroke={ink} strokeWidth="11" strokeDasharray="187 22 80 24 144 247" transform="rotate(-37 256 256)" strokeDashoffset={ring}/>
      <circle cx="256" cy="256" r="74" fill="none" stroke={ink} strokeWidth="3" strokeDasharray="10 15" opacity={animated ? interpolate(frame,[22,42],[0,.65],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}) : .65}/>
      {nodes.map(([x, y], i) => {
        const p = animated ? spring({frame: frame - 7 - i * 3, fps, config: {damping: 16, stiffness: 170}, durationInFrames: 15}) : 1;
        const px = 256 + (x - 256) * p;
        const py = 256 + (y - 256) * p;
        const gold = i === 5;
        return <circle key={i} cx={px} cy={py} r={gold ? 15 : 13} fill={gold ? GOLD : ink} opacity={p}/>;
      })}
      {nodes.slice(0, 5).map(([x, y], i) => {
        const p = animated ? interpolate(frame, [12 + i * 2, 27 + i * 2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
        return <path key={i} d={`M256 256L${x} ${y}`} stroke={ink} strokeWidth="3" opacity={.42 * p}/>;
      })}
      <path d="M256 256L353 200" stroke={GOLD} strokeWidth="8" opacity={animated ? interpolate(frame,[24,38],[0,.92],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}) : .92}/>
      <path d="M130 122C82 172 69 234 84 290" fill="none" stroke={ink} strokeWidth="25" strokeDasharray="260" strokeDashoffset={outer} strokeLinecap="butt"/>
      <path d="M371 108C424 154 446 223 429 292" fill="none" stroke={RED} strokeWidth="30" strokeDasharray="280" strokeDashoffset={outer} strokeLinecap="butt"/>
      <circle cx="116" cy="256" r="10" fill={ink} opacity={reg}/>
      <circle cx="394" cy="256" r="9" fill="none" stroke={ink} strokeWidth="4" opacity={reg}/>
      <rect x="218" y="218" width="76" height="76" fill={RED} transform={`translate(256 256) scale(${core}) translate(-256 -256)`}/>
    </svg>
  );
};
