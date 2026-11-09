import React from 'react';
import '@fontsource-variable/manrope';
import '@fontsource/ibm-plex-mono/600.css';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {BrandMark} from './BrandMark';
import {Wordmark} from './Wordmark';

const SUMI = '#11110F';
const WASHI = '#E9DFC9';
const RED = '#C92F20';
const GOLD = '#A9853E';

export const LogoSting: React.FC<{transparent: boolean}> = ({transparent}) => {
  const frame = useCurrentFrame();
  const word = interpolate(frame, [43, 57], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const field = interpolate(frame, [0, 24], [.92, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const ink = transparent ? WASHI : SUMI;

  return (
    <AbsoluteFill style={{backgroundColor: transparent ? 'transparent' : WASHI, overflow: 'hidden'}}>
      {!transparent && <Img src={staticFile('backgrounds/field-light.jpg')} style={{position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:.58, transform:`scale(${field})`}}/>}
      {!transparent && <AbsoluteFill style={{background:'linear-gradient(90deg,rgba(233,223,201,.88) 0%,rgba(233,223,201,.72) 54%,rgba(233,223,201,.3) 100%)'}}/>}
      {!transparent && <div style={{position:'absolute',left:48,top:48,right:48,bottom:48,border:`2px solid ${SUMI}22`}}/>}
      <div style={{position:'absolute',left:transparent ? 436 : 330,top:240,width:600,height:600}}>
        <BrandMark inverse={transparent} size={600}/>
      </div>
      <div style={{position:'absolute',left:transparent ? 955 : 890,top:410,opacity:word,transform:`translateX(${(1-word)*46}px)`}}>
        <Wordmark fill={ink} width={660}/>
        <div style={{height:9,width:660,background:RED,marginTop:27,transformOrigin:'left',transform:`scaleX(${word})`}}/>
        <div style={{fontFamily:'IBM Plex Mono, monospace',fontSize:23,fontWeight:600,letterSpacing:4,color:ink,marginTop:32}}>PRACTICAL AI FOR REAL PEOPLE</div>
        <div style={{fontFamily:'IBM Plex Mono, monospace',fontSize:16,fontWeight:600,letterSpacing:3,color:GOLD,marginTop:24}}>HUMAN INTENT · SPECIALIST AGENTS · VERIFIED RESULTS</div>
      </div>
      {!transparent && <div style={{position:'absolute',left:74,top:65,fontFamily:'IBM Plex Mono, monospace',fontSize:18,fontWeight:600,letterSpacing:4,color:SUMI,opacity:.8}}>TENGU / FIELD SIGNAL / 01</div>}
      <Audio src={staticFile('audio/tengu-sting.wav')} volume={.82}/>
    </AbsoluteFill>
  );
};
