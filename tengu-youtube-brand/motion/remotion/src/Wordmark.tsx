import React from 'react';

type Props = {
  fill: string;
  width?: number;
  hero?: boolean;
};

const paths = [
  'M0 0H94L86 18H58V100H35V18H0Z',
  'M118 0H210L202 18H141V39H195V57H141V82H210L202 100H118Z',
  'M236 100V0H258L311 66V0H334V100H312L259 34V100Z',
  'M450 0H386C370 0 360 11 360 27V73C360 89 370 100 386 100H450V43H409V61H428V82H389C384 82 382 79 382 74V26C382 21 384 18 389 18H450Z',
  'M477 0H500V74C500 79 504 82 509 82H542C547 82 551 79 551 74V0H574V77C574 92 563 100 548 100H503C488 100 477 92 477 77Z',
];

export const Wordmark: React.FC<Props> = ({fill, width = 700, hero = false}) => {
  const height = width * 100 / 574;
  return (
    <svg width={width} height={height} viewBox="0 0 574 100" role="img" aria-label="TENGU">
      {hero && (
        <defs>
          <mask id="wordmark-distress">
            <rect x="-8" y="-8" width="590" height="116" fill="white"/>
            <path d="M28 10H73L68 15H28ZM126 30H182L178 35H126ZM242 10H270L274 15H242ZM299 73H327V78H303ZM367 31H397V36H367ZM414 10H445V15H414ZM486 42H506V47H486ZM526 85H559L553 90H526Z" fill="black"/>
            <path d="M16 69H47V73H16ZM153 88H194L189 93H153ZM274 47H304L308 52H278ZM377 88H420V93H377ZM489 12H520V16H489Z" fill="black" opacity=".72"/>
          </mask>
        </defs>
      )}
      <g fill={fill} stroke={hero ? fill : 'none'} strokeWidth={hero ? 1.8 : 0} mask={hero ? 'url(#wordmark-distress)' : undefined}>
        {paths.map((d) => <path key={d} d={d}/>)}
      </g>
    </svg>
  );
};
