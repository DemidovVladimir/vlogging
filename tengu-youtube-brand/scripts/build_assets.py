from pathlib import Path
from PIL import Image, ImageOps
import shutil

ROOT = Path(__file__).resolve().parents[1]
SVG = ROOT / "source" / "svg"
TPL = ROOT / "source" / "templates"
TEX = ROOT / "textures"
PUB = ROOT / "motion" / "remotion" / "public" / "backgrounds"

SUMI = "#11110F"
WASHI = "#E9DFC9"
VERMILION = "#C92F20"
INDIGO = "#1D3342"
GOLD = "#A9853E"


def doc(viewbox: str, body: str, title: str, desc: str, width=None, height=None) -> str:
    size = f' width="{width}" height="{height}"' if width and height else ""
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}"{size} role="img" aria-labelledby="title desc">
  <title id="title">{title}</title>
  <desc id="desc">{desc}</desc>
{body}
</svg>
'''


def grid(width: int, height: int, dark=False) -> str:
    ink = WASHI if dark else SUMI
    return f'''<defs><pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M80 0H0V80" fill="none" stroke="{ink}" stroke-width="1" opacity=".085"/></pattern></defs>
  <rect width="{width}" height="{height}" fill="url(#grid)"/>
  <g stroke="{ink}" opacity=".24"><path d="M24 48H72M48 24V72M{width-72} 48H{width-24}M{width-48} 24V72M24 {height-48}H72M48 {height-72}V{height-24}M{width-72} {height-48}H{width-24}M{width-48} {height-72}V{height-24}"/></g>'''


def mark_group(x=0, y=0, scale=1, inverse=False, simple=False, prefix="m") -> str:
    ink = WASHI if inverse else SUMI
    if simple:
        details = f'''
    <circle cx="256" cy="256" r="126" fill="none" stroke="{ink}" stroke-width="11" stroke-dasharray="338 42 208 204" transform="rotate(-52 256 256)"/>
    <circle cx="256" cy="130" r="12" fill="{ink}"/><circle cx="148" cy="322" r="12" fill="{ink}"/><circle cx="360" cy="330" r="12" fill="{GOLD}"/>
    <path d="M356 132C414 177 432 254 407 320" fill="none" stroke="{VERMILION}" stroke-width="29" stroke-linecap="butt"/>
    <rect x="221" y="221" width="70" height="70" fill="{VERMILION}"/>'''
    else:
        details = f'''
    <g fill="none" stroke="{ink}">
      <path d="M256 54V105M256 407V458M54 256H105M407 256H458" stroke-width="4" opacity=".72"/>
      <circle cx="256" cy="256" r="156" stroke-width="5" stroke-dasharray="213 31 92 22 151 471" transform="rotate(-70 256 256)"/>
      <circle cx="256" cy="256" r="112" stroke-width="11" stroke-dasharray="187 22 80 24 144 247" transform="rotate(-37 256 256)"/>
      <circle cx="256" cy="256" r="74" stroke-width="3" stroke-dasharray="10 15" opacity=".68"/>
      <path d="M256 256L256 144M256 256L159 200M256 256L159 312M256 256L256 368M256 256L353 312" stroke-width="3" opacity=".45"/>
      <path d="M256 256L353 200" stroke="{GOLD}" stroke-width="8" opacity=".92"/>
    </g>
    <g fill="{ink}"><circle cx="256" cy="144" r="13"/><circle cx="159" cy="200" r="13"/><circle cx="159" cy="312" r="13"/><circle cx="256" cy="368" r="13"/><circle cx="353" cy="312" r="13"/></g>
    <circle cx="353" cy="200" r="15" fill="{GOLD}"/>
    <circle cx="116" cy="256" r="10" fill="{ink}"/><circle cx="394" cy="256" r="9" fill="none" stroke="{ink}" stroke-width="4"/>
    <path d="M130 122C82 172 69 234 84 290" fill="none" stroke="{ink}" stroke-width="25" stroke-linecap="butt"/>
    <path d="M371 108C424 154 446 223 429 292" fill="none" stroke="{VERMILION}" stroke-width="30" stroke-linecap="butt"/>
    <path d="M374 111C422 159 438 221 425 276" fill="none" stroke="{VERMILION}" stroke-width="8" opacity=".45"/>
    <rect x="218" y="218" width="76" height="76" fill="{VERMILION}"/>'''
    return f'<g id="{prefix}" transform="translate({x} {y}) scale({scale})">{details}</g>'


def label(x, y, text, size=18, fill=SUMI, anchor="start", weight=600, spacing=2, family="mono"):
    fam = "'IBM Plex Mono',Menlo,monospace" if family == "mono" else "Manrope,'Avenir Next','Helvetica Neue',Arial,sans-serif"
    return f'<text x="{x}" y="{y}" fill="{fill}" text-anchor="{anchor}" font-family="{fam}" font-size="{size}" font-weight="{weight}" letter-spacing="{spacing}">{text}</text>'


def display(x, y, lines, size=80, fill=SUMI, weight=800, leading=0.95):
    return ''.join(
        f'<text x="{x}" y="{y + i*int(size*leading)}" fill="{fill}" font-family="Manrope,\'Avenir Next\',Arial,sans-serif" font-size="{size}" font-weight="{weight}" letter-spacing="-2">{line}</text>'
        for i, line in enumerate(lines)
    )


def wordmark_group(x=0, y=0, scale=1, fill=SUMI, hero=False, prefix="wm") -> str:
    """Custom technical TENGU lettering. This is geometry, not a font dependency."""
    shapes = f'''
      <path d="M0 0H94L86 18H58V100H35V18H0Z"/>
      <path d="M118 0H210L202 18H141V39H195V57H141V82H210L202 100H118Z"/>
      <path d="M236 100V0H258L311 66V0H334V100H312L259 34V100Z"/>
      <path d="M450 0H386C370 0 360 11 360 27V73C360 89 370 100 386 100H450V43H409V61H428V82H389C384 82 382 79 382 74V26C382 21 384 18 389 18H450Z"/>
      <path d="M477 0H500V74C500 79 504 82 509 82H542C547 82 551 79 551 74V0H574V77C574 92 563 100 548 100H503C488 100 477 92 477 77Z"/>'''
    if not hero:
        return f'<g id="{prefix}" transform="translate({x} {y}) scale({scale})" fill="{fill}">{shapes}</g>'
    holes = '''
      <path d="M28 10H73L68 15H28ZM126 30H182L178 35H126ZM242 10H270L274 15H242ZM299 73H327V78H303ZM367 31H397V36H367ZM414 10H445V15H414ZM486 42H506V47H486ZM526 85H559L553 90H526Z" fill="black"/>
      <path d="M16 69H47V73H16ZM153 88H194L189 93H153ZM274 47H304L308 52H278ZM377 88H420V93H377ZM489 12H520V16H489Z" fill="black" opacity=".72"/>'''
    return f'''<defs><mask id="{prefix}-distress"><rect x="-8" y="-8" width="590" height="116" fill="white"/>{holes}</mask></defs>
    <g id="{prefix}" transform="translate({x} {y}) scale({scale})" fill="{fill}" stroke="{fill}" stroke-width="1.8" mask="url(#{prefix}-distress)">{shapes}</g>'''


def mountain_path(fill=SUMI, opacity=1):
    return f'<path d="M0 920L0 760L90 700L155 748L260 624L328 690L414 590L486 662L560 548L632 635L720 500L802 592L866 557L940 672L1030 620L1114 690L1210 590L1300 670L1410 548L1535 660L1640 612L1740 710L1842 646L1920 690V920Z" fill="{fill}" opacity="{opacity}"/>'


def write(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def make_logos():
    body = f'<rect width="512" height="512" fill="none"/>{mark_group(prefix="primary")}'
    write(SVG / "tengu-mark-primary.svg", doc("0 0 512 512", body, "TENGU primary mark", "Human intent at the center of an agent and evidence field."))
    write(SVG / "tengu-mark-simplified.svg", doc("0 0 512 512", f'<rect width="512" height="512" fill="none"/>{mark_group(simple=True, prefix="simple")}', "TENGU simplified mark", "Small-size TENGU mark."))
    write(SVG / "tengu-mark-inverse.svg", doc("0 0 512 512", f'<rect width="512" height="512" fill="{SUMI}"/>{mark_group(inverse=True, prefix="inverse")}', "TENGU inverse mark", "TENGU mark for dark backgrounds."))
    avatar = f'''<defs><filter id="grain"><feTurbulence baseFrequency=".72" numOctaves="2" seed="9" result="n"/><feBlend in="SourceGraphic" in2="n" mode="multiply"/></filter></defs>
  <rect width="1024" height="1024" rx="212" fill="{SUMI}"/>
  <g transform="translate(80 80) scale(1.69)">{mark_group(inverse=True, simple=True, prefix="avatar")}</g>
  <rect width="1024" height="1024" rx="212" fill="none" stroke="{WASHI}" stroke-width="10" opacity=".18"/>'''
    write(SVG / "tengu-avatar.svg", doc("0 0 1024 1024", avatar, "TENGU channel avatar", "Dark social avatar with simplified TENGU mark."))
    watermark = f'<rect width="512" height="512" fill="none"/>{mark_group(simple=True, prefix="watermark")}'
    write(SVG / "tengu-watermark.svg", doc("0 0 512 512", watermark, "TENGU video watermark", "Transparent simplified TENGU video watermark."))
    custom = f'<rect width="574" height="100" fill="none"/>{wordmark_group(prefix="custom")}'
    write(SVG / "tengu-wordmark-custom.svg", doc("0 0 574 100", custom, "TENGU custom wordmark", "Custom wide technical TENGU lettering, outlined as vector geometry."))
    hero_custom = f'<rect width="574" height="100" fill="none"/>{wordmark_group(hero=True,prefix="hero")}'
    write(SVG / "tengu-wordmark-hero.svg", doc("0 0 574 100", hero_custom, "TENGU hero wordmark", "Distressed hero version of the custom TENGU lettering."))
    word = f'''<rect width="1500" height="410" fill="none"/>{mark_group(28,-48,.9,prefix="lockup")}
  {wordmark_group(520,82,1.42,SUMI,prefix="horizontalWord")}
  <path d="M522 224H1394" stroke="{VERMILION}" stroke-width="8"/>
  {label(524,280,"ПРАКТИЧЕСКИЙ ИИ ДЛЯ ЛЮДЕЙ",27,SUMI,weight=700,spacing=6)}
  {label(524,330,"HUMAN INTENT · SPECIALIST AGENTS · VERIFIED RESULTS",17,GOLD,weight=600,spacing=3)}'''
    write(SVG / "tengu-wordmark-horizontal.svg", doc("0 0 1500 410", word, "TENGU horizontal lockup", "Primary TENGU wordmark and descriptor."))
    stack = f'''<rect width="850" height="900" fill="none"/>{mark_group(169,40,1,prefix="stacked")}
  {wordmark_group(109,610,1.1,SUMI,prefix="stackedWord")}
  <path d="M352 724H498" stroke="{VERMILION}" stroke-width="10"/>
  {label(425,790,"ПРАКТИЧЕСКИЙ ИИ ДЛЯ ЛЮДЕЙ",22,SUMI,"middle",700,4)}'''
    write(SVG / "tengu-wordmark-stacked.svg", doc("0 0 850 900", stack, "TENGU stacked lockup", "Stacked TENGU lockup."))
    stamp = f'''<rect width="512" height="512" fill="none"/><rect x="82" y="82" width="348" height="348" fill="none" stroke="{VERMILION}" stroke-width="18"/>
  <rect x="104" y="104" width="304" height="304" fill="none" stroke="{VERMILION}" stroke-width="4" opacity=".7"/>
  <text x="256" y="325" text-anchor="middle" fill="{VERMILION}" font-family="'Shippori Mincho','Hiragino Mincho ProN',serif" font-size="188" font-weight="800" letter-spacing="-14">天狗</text>'''
    write(SVG / "tengu-stamp.svg", doc("0 0 512 512", stamp, "TENGU seal", "Vermilion Japanese TENGU stamp."))


def make_icons():
    icons = {
        "01-ideas": f'<circle cx="128" cy="128" r="74" fill="none" stroke="{SUMI}" stroke-width="14" stroke-dasharray="280 184" transform="rotate(-35 128 128)"/><path d="M175 66A76 76 0 0 1 198 120" stroke="{VERMILION}" stroke-width="17" fill="none"/><circle cx="194" cy="142" r="10" fill="{GOLD}"/>',
        "02-agents": f'<path d="M128 50L198 91V171L128 212L58 171V91Z" fill="none" stroke="{SUMI}" stroke-width="8"/><g fill="{SUMI}"><circle cx="128" cy="50" r="16"/><circle cx="198" cy="91" r="16"/><circle cx="198" cy="171" r="16"/><circle cx="128" cy="212" r="16"/><circle cx="58" cy="171" r="16"/><circle cx="58" cy="91" r="16"/></g><rect x="113" y="113" width="30" height="30" fill="{VERMILION}"/>',
        "03-tools": f'<path d="M48 103V48H103M153 48H208V103M208 153V208H153M103 208H48V153" fill="none" stroke="{SUMI}" stroke-width="15"/><rect x="111" y="111" width="34" height="34" fill="{VERMILION}"/>',
        "04-practice": f'<path d="M42 190L96 78L128 142L166 54L214 190Z" fill="{SUMI}"/><path d="M96 78L128 142L111 178H72Z" fill="{GOLD}"/><path d="M166 54L214 190H158L142 112Z" fill="{VERMILION}" opacity=".9"/>',
        "05-evidence": f'<path d="M46 82H210L180 112H76ZM76 117H180L202 140L180 163H76L54 140ZM46 168H210L180 198H76Z" fill="{SUMI}"/><path d="M82 127H174L186 140L174 153H82L70 140Z" fill="{WASHI}"/>',
        "06-people": f'<circle cx="128" cy="128" r="78" fill="none" stroke="{VERMILION}" stroke-width="15"/><path d="M57 128H199" stroke="{VERMILION}" stroke-width="15"/><circle cx="128" cy="91" r="20" fill="{SUMI}"/><path d="M89 163C93 133 163 133 167 163" fill="{SUMI}"/>',
    }
    for name, body in icons.items():
        write(SVG / "icons" / f"{name}.svg", doc("0 0 256 256", f'<rect width="256" height="256" fill="none"/>{body}', name.replace("-", " "), "TENGU category marker."))


def make_templates():
    banner = f'''<rect width="2560" height="1440" fill="{WASHI}"/>{grid(2560,1440)}
  <path d="M0 1120C330 1000 530 1090 820 930C1080 786 1260 1020 1500 870C1800 680 2150 920 2560 730V1440H0Z" fill="{SUMI}" opacity=".92"/>
  <circle cx="2240" cy="342" r="132" fill="{VERMILION}" opacity=".96"/>
  <g transform="translate(526 453) scale(.95)">{mark_group(prefix="banner")}</g>
  {wordmark_group(1090,492,1.36,SUMI,prefix="bannerWord")}
  <path d="M1094 650H1870" stroke="{VERMILION}" stroke-width="10"/>
  {label(1098,720,"ПРАКТИЧЕСКИЙ ИИ ДЛЯ ЛЮДЕЙ",31,SUMI,weight=700,spacing=7)}
  {label(1100,784,"ИДЕИ · АГЕНТЫ · ИНСТРУМЕНТЫ · ПРАКТИКА · ДОКАЗАТЕЛЬСТВА",18,GOLD,weight=700,spacing=2)}
  {label(90,110,"FIELD MANUAL / YOUTUBE",22,SUMI,weight=700,spacing=5)}
  {label(2470,1330,"ЧЕЛОВЕК → АГЕНТЫ → ПРОВЕРЕННЫЙ РЕЗУЛЬТАТ",20,WASHI,"end",700,3)}
  <rect x="507" y="508" width="1546" height="423" fill="none" stroke="{INDIGO}" stroke-width="3" stroke-dasharray="16 12" opacity=".26"/>'''
    write(TPL / "youtube-banner.svg", doc("0 0 2560 1440", banner, "TENGU YouTube banner", "2560 by 1440 channel banner. Dashed line indicates the 1546 by 423 all-device safe area.", 2560, 1440))

    light = f'''<rect width="1280" height="720" fill="{WASHI}"/>{grid(1280,720)}
  <circle cx="1090" cy="138" r="99" fill="{VERMILION}"/>
  <path d="M658 720L760 540L842 608L918 470L1000 548L1080 430L1168 532L1280 440V720Z" fill="{SUMI}" opacity=".88"/>
  {label(56,58,"TENGU / 03 ИНСТРУМЕНТЫ",20,SUMI,weight=700,spacing=3)}
  {display(56,182,["КАК СОБРАТЬ","ИИ-АГЕНТА","БЕЗ ХАЙПА"],88,SUMI)}
  <path d="M58 475H448" stroke="{VERMILION}" stroke-width="12"/>
  {label(58,535,"ПОЛНЫЙ ПРОЦЕСС · РЕАЛЬНЫЙ ТЕСТ",20,INDIGO,weight=700,spacing=2)}
  {label(58,667,"01 / FIELD NOTE",16,GOLD,weight=700,spacing=3)}
  <g transform="translate(934 274) scale(.53)">{mark_group(prefix="thumbLight")}</g>'''
    write(TPL / "thumbnail-light.svg", doc("0 0 1280 720", light, "TENGU light thumbnail", "Light editorial thumbnail template.", 1280, 720))

    dark = f'''<rect width="1280" height="720" fill="{SUMI}"/>{grid(1280,720,True)}
  <path d="M0 720V604L166 520L262 584L378 458L480 552L604 432L720 520L826 406L930 512L1068 390L1280 540V720Z" fill="{INDIGO}" opacity=".8"/>
  {label(58,60,"TENGU / 05 ДОКАЗАТЕЛЬСТВА",20,WASHI,weight=700,spacing=3)}
  {display(58,196,["АГЕНТЫ","СДЕЛАЛИ","РАБОТУ"],92,WASHI)}
  {display(58,480,["НО ГДЕ","ДОКАЗАТЕЛЬСТВА?"],60,VERMILION)}
  {label(60,668,"ТЕСТ · ОГРАНИЧЕНИЯ · ВЕРДИКТ",17,GOLD,weight=700,spacing=3)}
  <g transform="translate(846 92) scale(.74)">{mark_group(inverse=True,prefix="thumbDark")}</g>'''
    write(TPL / "thumbnail-dark.svg", doc("0 0 1280 720", dark, "TENGU dark thumbnail", "Dark results and evidence thumbnail template.", 1280, 720))

    title = f'''<rect width="1920" height="1080" fill="{WASHI}"/>{grid(1920,1080)}
  <circle cx="1630" cy="236" r="142" fill="{VERMILION}"/>{mountain_path(SUMI,.9)}
  {label(86,98,"TENGU / TITLE CARD / 04 ПРАКТИКА",22,SUMI,weight=700,spacing=4)}
  {display(86,286,["КАК СОБРАТЬ","РАБОЧУЮ СИСТЕМУ"],104,SUMI)}
  <path d="M90 532H690" stroke="{VERMILION}" stroke-width="14"/>
  {label(90,600,"ОТ ИДЕИ ДО ПРОВЕРЕННОГО РЕЗУЛЬТАТА",25,INDIGO,weight=700,spacing=3)}
  <g transform="translate(1320 458) scale(.8)">{mark_group(inverse=True,prefix="title")}</g>'''
    write(TPL / "title-card.svg", doc("0 0 1920 1080", title, "TENGU episode title card", "Editable episode title card.", 1920, 1080))

    bumper_light = f'''<rect width="1920" height="1080" fill="{WASHI}"/>{grid(1920,1080)}
  {label(100,98,"TENGU / CHAPTER 03",20,SUMI,weight=700,spacing=4)}
  {display(100,398,["ИНСТРУМЕНТЫ","И СБОРКА"],112,SUMI)}
  <path d="M102 645H686" stroke="{VERMILION}" stroke-width="14"/>
  {label(104,710,"СОБИРАЕМ СИСТЕМУ ШАГ ЗА ШАГОМ",25,INDIGO,weight=700,spacing=3)}
  <g transform="translate(1270 270) scale(1.03)">{mark_group(prefix="bumperLight")}</g>'''
    write(TPL / "chapter-bumper-light.svg", doc("0 0 1920 1080", bumper_light, "TENGU light chapter bumper", "Light chapter bumper still.", 1920, 1080))

    bumper_dark = f'''<rect width="1920" height="1080" fill="{SUMI}"/>{grid(1920,1080,True)}
  {mountain_path(INDIGO,.62)}
  {label(100,98,"TENGU / CHAPTER 05",20,WASHI,weight=700,spacing=4)}
  {display(100,398,["ДОКАЗАТЕЛЬСТВА","И ВЕРДИКТ"],112,WASHI)}
  <path d="M102 645H686" stroke="{VERMILION}" stroke-width="14"/>
  {label(104,710,"ПОКАЗЫВАЕМ РЕЗУЛЬТАТ ЧЕСТНО",25,GOLD,weight=700,spacing=3)}
  <g transform="translate(1270 270) scale(1.03)">{mark_group(inverse=True,prefix="bumperDark")}</g>'''
    write(TPL / "chapter-bumper-dark.svg", doc("0 0 1920 1080", bumper_dark, "TENGU dark chapter bumper", "Dark chapter bumper still.", 1920, 1080))

    lower = f'''<rect width="1920" height="1080" fill="none"/>
  <g transform="translate(86 820)"><path d="M0 0H1030L970 176H0Z" fill="{SUMI}" opacity=".96"/>
  <rect x="0" y="0" width="18" height="176" fill="{VERMILION}"/>
  {label(48,66,"ВЛАДИМИР ДЕМИДОВ",34,WASHI,weight=800,spacing=2,family="sans")}
  {label(50,118,"TENGU · ПРАКТИЧЕСКИЙ ИИ ДЛЯ ЛЮДЕЙ",18,GOLD,weight=700,spacing=3)}
  <g transform="translate(858 -35) scale(.31)">{mark_group(inverse=True,simple=True,prefix="lower")}</g></g>'''
    write(TPL / "lower-third.svg", doc("0 0 1920 1080", lower, "TENGU lower third", "Transparent lower third overlay.", 1920, 1080))

    end = f'''<rect width="1920" height="1080" fill="{WASHI}"/>{grid(1920,1080)}
  {label(84,92,"TENGU / ПРОДОЛЖИТЬ МАРШРУТ",22,SUMI,weight=700,spacing=4)}
  <rect x="86" y="164" width="748" height="421" fill="{SUMI}"/><rect x="894" y="164" width="748" height="421" fill="{SUMI}"/>
  <path d="M86 610H834M894 610H1642" stroke="{VERMILION}" stroke-width="10"/>
  {label(86,660,"СЛЕДУЮЩИЙ ЭПИЗОД",20,SUMI,weight=700,spacing=3)}{label(894,660,"ПО ТЕМЕ",20,SUMI,weight=700,spacing=3)}
  <circle cx="1735" cy="846" r="116" fill="{SUMI}"/><g transform="translate(1607 718) scale(.5)">{mark_group(inverse=True,simple=True,prefix="end")}</g>
  {label(1540,1020,"ПОДПИСАТЬСЯ",18,VERMILION,weight=700,spacing=3)}
  {label(86,934,"ЧЕЛОВЕК ЗАДАЁТ ЦЕЛЬ. АГЕНТЫ РАБОТАЮТ.",30,SUMI,weight=800,spacing=2,family="sans")}
  {label(86,982,"РЕЗУЛЬТАТ ПРОВЕРЯЕТСЯ.",30,VERMILION,weight=800,spacing=2,family="sans")}'''
    write(TPL / "end-screen.svg", doc("0 0 1920 1080", end, "TENGU end screen", "End screen with two video slots and subscribe target.", 1920, 1080))

    board = f'''<rect width="1920" height="1280" fill="{WASHI}"/>{grid(1920,1280)}
  <path d="M44 44H1876V1236H44Z" fill="none" stroke="{SUMI}" opacity=".34"/>
  {label(74,90,"TENGU / YOUTUBE FIELD SYSTEM / V1.0",18,SUMI,weight=700,spacing=4)}
  <g transform="translate(34 112) scale(.98)">{mark_group(prefix="board")}</g>
  {wordmark_group(88,624,.78,SUMI,hero=True,prefix="boardWord")}
  {label(90,758,"ПРАКТИЧЕСКИЙ ИИ ДЛЯ ЛЮДЕЙ",23,SUMI,weight=700,spacing=5)}
  <path d="M88 792H542" stroke="{VERMILION}" stroke-width="9"/>
  {label(650,90,"01 / SYMBOL SYSTEM",18,SUMI,weight=700,spacing=4)}
  <rect x="650" y="120" width="350" height="310" fill="none" stroke="{SUMI}" opacity=".25"/><g transform="translate(692 115) scale(.52)">{mark_group(prefix="board1")}</g>
  <rect x="1020" y="120" width="350" height="310" fill="{SUMI}"/><g transform="translate(1062 115) scale(.52)">{mark_group(inverse=True,prefix="board2")}</g>
  <rect x="1390" y="120" width="430" height="310" fill="none" stroke="{SUMI}" opacity=".25"/>{label(1430,200,"CORE",18,SUMI,weight=700,spacing=3)}{label(1430,258,"ЧЕЛОВЕК",30,SUMI,weight=800,spacing=1,family="sans")}{label(1430,318,"АГЕНТЫ",30,SUMI,weight=800,spacing=1,family="sans")}{label(1430,378,"ПРОВЕРКА",30,VERMILION,weight=800,spacing=1,family="sans")}
  {label(650,492,"02 / CATEGORY MARKERS",18,SUMI,weight=700,spacing=4)}
  <g font-family="Menlo,monospace" font-size="15" font-weight="700" fill="{SUMI}">
    <g transform="translate(650 530)"><circle cx="42" cy="42" r="30" fill="none" stroke="{VERMILION}" stroke-width="9" stroke-dasharray="120 80"/><text x="0" y="112">01 ИДЕИ</text></g>
    <g transform="translate(840 530)"><circle cx="22" cy="30" r="8"/><circle cx="62" cy="54" r="8"/><circle cx="22" cy="78" r="8"/><path d="M22 30L62 54L22 78Z" fill="none" stroke="{SUMI}" stroke-width="4"/><text x="0" y="112">02 АГЕНТЫ</text></g>
    <g transform="translate(1030 530)"><path d="M8 36V8H36M62 8H90V36M90 62V90H62M36 90H8V62" fill="none" stroke="{SUMI}" stroke-width="8"/><text x="0" y="112">03 TOOLS</text></g>
    <g transform="translate(1220 530)"><path d="M4 90L42 18L64 58L88 10L108 90Z"/><text x="0" y="112">04 ПРАКТИКА</text></g>
    <g transform="translate(1420 530)"><path d="M0 20H110L90 40H20ZM18 50H92L110 68L92 86H18L0 68Z"/><text x="0" y="112">05 EVIDENCE</text></g>
    <g transform="translate(1650 530)"><circle cx="55" cy="55" r="44" fill="none" stroke="{VERMILION}" stroke-width="9"/><path d="M12 55H98" stroke="{VERMILION}" stroke-width="9"/><text x="0" y="112">06 ЛЮДИ</text></g>
  </g>
  {label(650,720,"03 / THUMBNAIL GRAMMAR",18,SUMI,weight=700,spacing=4)}
  <rect x="650" y="750" width="555" height="312" fill="{SUMI}"/>{display(682,846,["ОДНА МЫСЛЬ","ОДИН КОНФЛИКТ"],48,WASHI)}<path d="M682 964H962" stroke="{VERMILION}" stroke-width="10"/><g transform="translate(972 770) scale(.4)">{mark_group(inverse=True,prefix="board3")}</g>
  <rect x="1235" y="750" width="585" height="312" fill="{WASHI}" stroke="{SUMI}" opacity=".96"/>{display(1266,846,["ЧЁТКИЙ","РЕЗУЛЬТАТ"],54,SUMI)}<circle cx="1710" cy="838" r="72" fill="{VERMILION}"/>{label(1268,1012,"3–7 СЛОВ · ВЫСОКИЙ КОНТРАСТ",15,INDIGO,weight=700,spacing=2)}
  {label(74,1145,"PALETTE",18,SUMI,weight=700,spacing=4)}
  <g transform="translate(250 1110)"><rect width="210" height="54" fill="{SUMI}"/><rect x="238" width="210" height="54" fill="{WASHI}" stroke="{SUMI}"/><rect x="476" width="210" height="54" fill="{VERMILION}"/><rect x="714" width="210" height="54" fill="{INDIGO}"/><rect x="952" width="210" height="54" fill="{GOLD}"/></g>
  {label(250,1194,"SUMI",14,SUMI,weight=700,spacing=2)}{label(488,1194,"WASHI",14,SUMI,weight=700,spacing=2)}{label(726,1194,"VERMILION",14,SUMI,weight=700,spacing=2)}{label(964,1194,"INDIGO",14,SUMI,weight=700,spacing=2)}{label(1202,1194,"AGED GOLD",14,SUMI,weight=700,spacing=2)}'''
    write(TPL / "brand-system-board.svg", doc("0 0 1920 1280", board, "TENGU YouTube brand system", "Reference board for the TENGU YouTube identity.", 1920, 1280))

    study = f'''<rect width="1600" height="1000" fill="{WASHI}"/>{grid(1600,1000)}
  {label(68,72,"TENGU / WORDMARK STUDY / V2.1",18,SUMI,weight=700,spacing=4)}
  {label(68,142,"01 / PREVIOUS NEUTRAL TYPE",16,INDIGO,weight=700,spacing=3)}
  {label(68,260,"TENGU",112,SUMI,weight=800,spacing=18,family="sans")}
  <path d="M68 302H1530" stroke="{SUMI}" opacity=".18"/>
  {label(68,360,"02 / PROPOSED CUSTOM MASTER",16,INDIGO,weight=700,spacing=3)}
  {wordmark_group(68,406,1.65,SUMI,prefix="studyClean")}
  <path d="M68 604H1530" stroke="{SUMI}" opacity=".18"/>
  {label(68,662,"03 / HERO INK VERSION",16,INDIGO,weight=700,spacing=3)}
  {wordmark_group(68,710,1.65,SUMI,hero=True,prefix="studyHero")}
  <path d="M68 902H1530" stroke="{VERMILION}" stroke-width="9"/>
  {label(68,952,"CUSTOM LETTERING · NO FONT DEPENDENCY · CLEAN + MATERIAL VARIANTS",16,GOLD,weight=700,spacing=3)}'''
    write(TPL / "wordmark-study.svg", doc("0 0 1600 1000", study, "TENGU wordmark comparison", "Previous neutral type compared with proposed custom technical wordmark and hero ink version.", 1600, 1000))


def make_textures():
    sources = {
        "field-light": Path("/Users/vladimirdemidov/.codex/generated_images/01a14b7f-c58f-79b2-940b-d762c9999e18/exec-ae63c2b8-65af-494a-8bb0-9941e3336520.png"),
        "field-dark": Path("/Users/vladimirdemidov/.codex/generated_images/01a14b7f-c58f-79b2-940b-d762c9999e18/exec-0e5bf0df-251e-4b07-a601-2a6e3a291218.png"),
    }
    TEX.mkdir(parents=True, exist_ok=True)
    PUB.mkdir(parents=True, exist_ok=True)
    for name, src in sources.items():
        shutil.copy2(src, TEX / f"{name}-source.png")
        im = Image.open(src).convert("RGB")
        for size, suffix in [((1920, 1080), "1080p"), ((3840, 2160), "4k")]:
            out = ImageOps.fit(im, size, method=Image.Resampling.LANCZOS, centering=(.5, .5))
            out.save(TEX / f"{name}-{suffix}.jpg", quality=94, subsampling=0)
            if suffix == "1080p":
                out.save(PUB / f"{name}.jpg", quality=94, subsampling=0)


if __name__ == "__main__":
    make_logos()
    make_icons()
    make_templates()
    make_textures()
    print("Built TENGU brand assets in", ROOT)
