import React from 'react';
import '@fontsource-variable/manrope';
import '@fontsource/ibm-plex-mono/600.css';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {BrandMark} from './BrandMark';

const SUMI = '#11110F';
const WASHI = '#E9DFC9';
const RED = '#C92F20';
const INDIGO = '#1D3342';
const GOLD = '#A9853E';

export type ChapterBumperProps = {
  chapter: string;
  category: string;
  title: string;
  subtitle: string;
  theme: 'light' | 'dark';
};

export const ChapterBumper: React.FC<ChapterBumperProps> = ({chapter, category, title, subtitle, theme}) => {
  const frame = useCurrentFrame();
  const dark = theme === 'dark';
  const ink = dark ? WASHI : SUMI;
  const reveal = interpolate(frame, [7, 23], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp', easing:Easing.out(Easing.cubic)});
  const line = interpolate(frame, [24, 42], [0, 1], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
  const settle = interpolate(frame, [67, 89], [1, .98], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor:dark?SUMI:WASHI,overflow:'hidden'}}>
      <Img src={staticFile(`backgrounds/field-${dark?'dark':'light'}.jpg`)} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:dark?.7:.62,transform:`scale(${settle})`}}/>
      <AbsoluteFill style={{background:dark?'linear-gradient(90deg,rgba(17,17,15,.94),rgba(17,17,15,.72) 58%,rgba(17,17,15,.18))':'linear-gradient(90deg,rgba(233,223,201,.97),rgba(233,223,201,.82) 58%,rgba(233,223,201,.22))'}}/>
      <div style={{position:'absolute',left:82,top:70,fontFamily:'IBM Plex Mono, monospace',fontSize:20,fontWeight:600,letterSpacing:4,color:ink}}>TENGU / CHAPTER {chapter} / {category}</div>
      <div style={{position:'absolute',left:86,top:270,width:1040,opacity:reveal,transform:`translateY(${(1-reveal)*44}px)`,whiteSpace:'pre-line',fontFamily:'Manrope Variable, Manrope, sans-serif',fontSize:112,fontWeight:800,lineHeight:.94,letterSpacing:-2,color:ink}}>{title}</div>
      <div style={{position:'absolute',left:90,top:647,width:640,height:13,background:RED,transformOrigin:'left',transform:`scaleX(${line})`}}/>
      <div style={{position:'absolute',left:90,top:704,opacity:line,fontFamily:'IBM Plex Mono, monospace',fontSize:24,fontWeight:600,letterSpacing:3,color:dark?GOLD:INDIGO}}>{subtitle}</div>
      <div style={{position:'absolute',right:176,top:248,width:570,height:570}}><BrandMark inverse={dark} size={570}/></div>
      <Audio src={staticFile('audio/tengu-sting.wav')} volume={.72}/>
    </AbsoluteFill>
  );
};
