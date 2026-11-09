import React from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {BrandMark} from './BrandMark';

const WASHI = '#E9DFC9';
const SUMI = '#11110F';

export const SymbolMotion: React.FC<{transparent: boolean}> = ({transparent}) => {
  return (
    <AbsoluteFill style={{backgroundColor: transparent ? 'transparent' : WASHI, overflow: 'hidden'}}>
      {!transparent && (
        <>
          <Img
            src={staticFile('backgrounds/field-light.jpg')}
            style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: .45}}
          />
          <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 48%, rgba(233,223,201,.62), rgba(233,223,201,.9) 62%, rgba(233,223,201,.96))'}}/>
          <div style={{position:'absolute',left:48,top:48,right:48,bottom:48,border:`2px solid ${SUMI}22`}}/>
        </>
      )}
      <div style={{position:'absolute',left:610,top:150,width:700,height:700}}>
        <BrandMark inverse={transparent} size={700}/>
      </div>
      <Audio src={staticFile('audio/tengu-sting.wav')} volume={.72}/>
    </AbsoluteFill>
  );
};
