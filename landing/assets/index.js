import brainwave from "./brainwave.svg";
import check from "./check.svg";
import brainwaveSymbol from "./brainwave-symbol.svg";
import brainwaveWhiteSymbol from "./brainwave-symbol-white.svg";
import play from "./play.svg";
import gradient from "./gradient.png";
import smallSphere from "./4-small.png";
import grid from "./grid.png";
import check2 from "./check-02.svg";
import loading1 from "./loading-01.svg";
import homeSmile from "./home-smile.svg";
import file02 from "./file-02.svg";
import searchMd from "./search-md.svg";
import plusSquare from "./plus-square.svg";
import recording03 from "./recording-03.svg";
import recording01 from "./recording-01.svg";
import disc02 from "./disc-02.svg";
import chromecast from "./chrome-cast.svg";
import sliders04 from "./sliders-04.svg";
import loading from "./loading.png";
import background from "./background.jpg";

import curve from "./hero/curve.png";
import robot from "./hero/robot.jpg";
import heroBackground from "./hero/hero-background.jpg";

import curve1 from "./collaboration/curve-1.svg";
import curve2 from "./collaboration/curve-2.svg";
import discord from "./collaboration/discord.png";
import figma from "./collaboration/figma.png";
import framer from "./collaboration/framer.png";
import notion from "./collaboration/notion.png";
import photoshop from "./collaboration/photoshop.png";
import protopie from "./collaboration/protopie.png";
import raindrop from "./collaboration/raindrop.png";
import slack from "./collaboration/slack.png";

import service1 from "./services/service-1.png";
import service2 from "./services/service-2.png";
import service3 from "./services/service-3.png";

import lines from "./pricing/lines.svg";
import stars from "./pricing/stars.svg";

import coins from "./roadmap/coins.png";
import done from "./roadmap/done.svg";
import hero from "./roadmap/hero.png";
import roadmap1 from "./roadmap/image-1.png";
import roadmap2 from "./roadmap/image-2.png";
import roadmap3 from "./roadmap/image-3.png";
import roadmap4 from "./roadmap/image-4.png";
import undone from "./roadmap/undone.svg";

import notification1 from "./notification/image-1.png";
import notification2 from "./notification/image-2.png";
import notification3 from "./notification/image-3.png";
import notification4 from "./notification/image-4.png";

import benefitCard1 from "./benefits/card-1.svg";
import benefitCard2 from "./benefits/card-2.svg";
import benefitCard3 from "./benefits/card-3.svg";
import benefitCard4 from "./benefits/card-4.svg";
import benefitCard5 from "./benefits/card-5.svg";
import benefitCard6 from "./benefits/card-6.svg";
import benefitIcon1 from "./benefits/icon-1.svg";
import benefitIcon2 from "./benefits/icon-2.svg";
import benefitIcon3 from "./benefits/icon-3.svg";
import benefitIcon4 from "./benefits/icon-4.svg";
import benefitImage2 from "./benefits/image-2.png";

import discordBlack from "./socials/discord.svg";
import facebook from "./socials/facebook.svg";
import instagram from "./socials/instagram.svg";
import telegram from "./socials/telegram.svg";
import twitter from "./socials/twitter.svg";

const assetUrl = (asset) =>
  typeof asset === "string" ? asset : asset?.src || asset;

const rawAssets = {
  brainwave,
  check,
  check2,
  loading1,
  brainwaveSymbol,
  brainwaveWhiteSymbol,
  play,
  gradient,
  smallSphere,
  grid,
  homeSmile,
  file02,
  searchMd,
  plusSquare,
  recording03,
  recording01,
  disc02,
  chromecast,
  sliders04,
  loading,
  background,
  curve,
  robot,
  heroBackground,
  curve1,
  curve2,
  discord,
  figma,
  framer,
  notion,
  photoshop,
  protopie,
  raindrop,
  slack,
  service1,
  service2,
  service3,
  lines,
  stars,
  coins,
  done,
  hero,
  roadmap1,
  roadmap2,
  roadmap3,
  roadmap4,
  undone,
  notification1,
  notification2,
  notification3,
  notification4,
  benefitCard1,
  benefitCard2,
  benefitCard3,
  benefitCard4,
  benefitCard5,
  benefitCard6,
  benefitIcon1,
  benefitIcon2,
  benefitIcon3,
  benefitIcon4,
  benefitImage2,
  discordBlack,
  facebook,
  instagram,
  telegram,
  twitter,
};

const normalizedAssets = Object.fromEntries(
  Object.entries(rawAssets).map(([key, value]) => [key, assetUrl(value)])
);

const {
  brainwave: brainwaveAsset,
  check: checkAsset,
  check2: check2Asset,
  loading1: loading1Asset,
  brainwaveSymbol: brainwaveSymbolAsset,
  brainwaveWhiteSymbol: brainwaveWhiteSymbolAsset,
  play: playAsset,
  gradient: gradientAsset,
  smallSphere: smallSphereAsset,
  grid: gridAsset,
  homeSmile: homeSmileAsset,
  file02: file02Asset,
  searchMd: searchMdAsset,
  plusSquare: plusSquareAsset,
  recording03: recording03Asset,
  recording01: recording01Asset,
  disc02: disc02Asset,
  chromecast: chromecastAsset,
  sliders04: sliders04Asset,
  loading: loadingAsset,
  background: backgroundAsset,
  curve: curveAsset,
  robot: robotAsset,
  heroBackground: heroBackgroundAsset,
  curve1: curve1Asset,
  curve2: curve2Asset,
  discord: discordAsset,
  figma: figmaAsset,
  framer: framerAsset,
  notion: notionAsset,
  photoshop: photoshopAsset,
  protopie: protopieAsset,
  raindrop: raindropAsset,
  slack: slackAsset,
  service1: service1Asset,
  service2: service2Asset,
  service3: service3Asset,
  lines: linesAsset,
  stars: starsAsset,
  coins: coinsAsset,
  done: doneAsset,
  hero: heroAsset,
  roadmap1: roadmap1Asset,
  roadmap2: roadmap2Asset,
  roadmap3: roadmap3Asset,
  roadmap4: roadmap4Asset,
  undone: undoneAsset,
  notification1: notification1Asset,
  notification2: notification2Asset,
  notification3: notification3Asset,
  notification4: notification4Asset,
  benefitCard1: benefitCard1Asset,
  benefitCard2: benefitCard2Asset,
  benefitCard3: benefitCard3Asset,
  benefitCard4: benefitCard4Asset,
  benefitCard5: benefitCard5Asset,
  benefitCard6: benefitCard6Asset,
  benefitIcon1: benefitIcon1Asset,
  benefitIcon2: benefitIcon2Asset,
  benefitIcon3: benefitIcon3Asset,
  benefitIcon4: benefitIcon4Asset,
  benefitImage2: benefitImage2Asset,
  discordBlack: discordBlackAsset,
  facebook: facebookAsset,
  instagram: instagramAsset,
  telegram: telegramAsset,
  twitter: twitterAsset,
} = normalizedAssets;

export {
  brainwaveAsset as brainwave,
  checkAsset as check,
  check2Asset as check2,
  loading1Asset as loading1,
  brainwaveSymbolAsset as brainwaveSymbol,
  brainwaveWhiteSymbolAsset as brainwaveWhiteSymbol,
  playAsset as play,
  gradientAsset as gradient,
  smallSphereAsset as smallSphere,
  gridAsset as grid,
  homeSmileAsset as homeSmile,
  file02Asset as file02,
  searchMdAsset as searchMd,
  plusSquareAsset as plusSquare,
  recording03Asset as recording03,
  recording01Asset as recording01,
  disc02Asset as disc02,
  chromecastAsset as chromecast,
  sliders04Asset as sliders04,
  loadingAsset as loading,
  backgroundAsset as background,
  curveAsset as curve,
  robotAsset as robot,
  heroBackgroundAsset as heroBackground,
  curve1Asset as curve1,
  curve2Asset as curve2,
  discordAsset as discord,
  figmaAsset as figma,
  framerAsset as framer,
  notionAsset as notion,
  photoshopAsset as photoshop,
  protopieAsset as protopie,
  raindropAsset as raindrop,
  slackAsset as slack,
  service1Asset as service1,
  service2Asset as service2,
  service3Asset as service3,
  linesAsset as lines,
  starsAsset as stars,
  coinsAsset as coins,
  doneAsset as done,
  heroAsset as hero,
  roadmap1Asset as roadmap1,
  roadmap2Asset as roadmap2,
  roadmap3Asset as roadmap3,
  roadmap4Asset as roadmap4,
  undoneAsset as undone,
  notification1Asset as notification1,
  notification2Asset as notification2,
  notification3Asset as notification3,
  notification4Asset as notification4,
  benefitCard1Asset as benefitCard1,
  benefitCard2Asset as benefitCard2,
  benefitCard3Asset as benefitCard3,
  benefitCard4Asset as benefitCard4,
  benefitCard5Asset as benefitCard5,
  benefitCard6Asset as benefitCard6,
  benefitIcon1Asset as benefitIcon1,
  benefitIcon2Asset as benefitIcon2,
  benefitIcon3Asset as benefitIcon3,
  benefitIcon4Asset as benefitIcon4,
  benefitImage2Asset as benefitImage2,
  discordBlackAsset as discordBlack,
  facebookAsset as facebook,
  instagramAsset as instagram,
  telegramAsset as telegram,
  twitterAsset as twitter,
};
