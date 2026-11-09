import React from 'react';
import {Composition} from 'remotion';
import {ChapterBumper, type ChapterBumperProps} from './ChapterBumper';
import {LogoSting} from './LogoSting';
import {SymbolMotion} from './SymbolMotion';

export const TenguRoot: React.FC = () => {
  const light: ChapterBumperProps = {
    chapter: '03',
    category: 'ИНСТРУМЕНТЫ',
    title: 'ИНСТРУМЕНТЫ\nИ СБОРКА',
    subtitle: 'СОБИРАЕМ СИСТЕМУ ШАГ ЗА ШАГОМ',
    theme: 'light',
  };
  const dark: ChapterBumperProps = {
    chapter: '05',
    category: 'ДОКАЗАТЕЛЬСТВА',
    title: 'ДОКАЗАТЕЛЬСТВА\nИ ВЕРДИКТ',
    subtitle: 'ПОКАЗЫВАЕМ РЕЗУЛЬТАТ ЧЕСТНО',
    theme: 'dark',
  };

  return (
    <>
      <Composition
        id="TenguLogoSting"
        component={LogoSting}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={72}
        defaultProps={{transparent: false}}
      />
      <Composition
        id="TenguLogoStingTransparent"
        component={LogoSting}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={72}
        defaultProps={{transparent: true}}
      />
      <Composition
        id="TenguSymbolMotion"
        component={SymbolMotion}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={72}
        defaultProps={{transparent: false}}
      />
      <Composition
        id="TenguSymbolMotionTransparent"
        component={SymbolMotion}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={72}
        defaultProps={{transparent: true}}
      />
      <Composition
        id="TenguChapterBumperLight"
        component={ChapterBumper}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={90}
        defaultProps={light}
      />
      <Composition
        id="TenguChapterBumperDark"
        component={ChapterBumper}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={90}
        defaultProps={dark}
      />
    </>
  );
};
