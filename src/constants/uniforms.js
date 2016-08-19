const MODES_SCREEN = 0;
const MODES_OVERLAY = 1;
const MODES_MULTIPLY = 2;
const MODES_COLOR_BURN = 3;
const MODES_DARKEN = 4;
const MODES_SOFT_LIGHT = 5;

/* For all filters we use only one of the filters
*  to determine which - we leave the original css in comments
**/

export default {
  'NONE': {
    name: 'NONE',
    hue: 0,
    br: 1,
    sat: 1,
    con: 1,
    sepia: 0,
    gray: 0,
    blendMode: MODES_SCREEN,
    grad: 0,
    gradColor: [0 / 255,  0 / 255,  0 / 255,  0],
    blendOpacity: -1,
    isColorBlend: true,
    isInverse: false
  },
  'INKWELL': {
    name: 'INKWELL',
    hue: 0,
    br: 1.1,
    sat: 1,
    con: 1.1,
    sepia: 0.3,
    gray: 1,
    blendMode: MODES_SCREEN,
    grad: 0,
    gradColor: [0 / 255,  0 / 255,  0 / 255,  0],
    blendOpacity: -1,
    isColorBlend: true,
    isInverse: false
  },
  'MAYFAIR': {
    /*.mayfair {
  -webkit-filter: contrast(1.1) saturate(1.1);
  .mayfair::after {
    background: -webkit-radial-gradient(40% 40%, circle, rgba(255, 255, 255, 0.8), rgba(255, 200, 200, 0.6), #111111 60%);
    background: radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.8), rgba(255, 200, 200, 0.6), #111111 60%);
    mix-blend-mode: overlay;
    opacity: .4; }
    */
    name: 'MAYFAIR',
    hue: 0,
    br: 1,
    sat: 1.1,
    con: 1.1,
    sepia: 0,
    gray: 0,
    blendMode: MODES_OVERLAY,
    grad: 0,
    gradColor: [0 / 255,  0 / 255,  0 / 255,  0],
    blendOpacity: 0.4,
    isColorBlend: false,
    isInverse: true
  },
  'LOFI': {
    /*.lofi {
  -webkit-filter: saturate(1.1) contrast(1.5);
  .lofi::after {
    background: -webkit-radial-gradient(circle, transparent 70%, #222222 150%);
    background: radial-gradient(circle, transparent 70%, #222222 150%);
    mix-blend-mode: multiply; }
    */
    name: 'LOFI',
    hue: 0,
    br: 1,
    sat: 1.1,
    con: 1.5,
    sepia: 0,
    gray: 0,
    blendMode: MODES_MULTIPLY,
    grad: 1,
    gradColor: [0 / 255,  0 / 255,  0 / 255,  0],
    blendOpacity: 1,
    isColorBlend: false,
    isInverse: false
  },
  'EARLYBIRD': {
    /*.earlybird {
  -webkit-filter: contrast(0.9) sepia(0.2);
  .earlybird::after {
    background: -webkit-radial-gradient(circle, #d0ba8e 20%, #360309 85%, #1d0210 100%);
    background: radial-gradient(circle, #d0ba8e 20%, #360309 85%, #1d0210 100%);
    mix-blend-mode: overlay; }
    */
    name: 'EARLYBIRD',
    hue: 0,
    br: 1,
    sat: 1,
    con: 0.9,
    sepia: 0.2,
    gray: 0,
    blendMode: MODES_OVERLAY,
    grad: 2,
    gradColor: [0 / 255,  0 / 255,  0 / 255,  0],
    blendOpacity: 1,
    isColorBlend: false,
    isInverse: false
  },
  'F1977': {
    /*._1977 {
  -webkit-filter: contrast(1.1) brightness(1.1) saturate(1.3);
  ._1977:after {
    background: rgba(243, 106, 188, 0.3);
    mix-blend-mode: screen; }
    */
    name: '1977',
    hue: 0,
    br: 1.1,
    sat: 1.3,
    con: 1.1,
    sepia: 0,
    gray: 0,
    blendMode: MODES_SCREEN,
    grad: 0,
    gradColor: [243 / 255,  106 / 255,  188 / 255,  0.3],
    blendOpacity: 1,
    isColorBlend: true,
    isInverse: false
  },
  'WALDEN': {
    /*.walden {
  -webkit-filter: brightness(1.1) hue-rotate(-10deg) sepia(0.3) saturate(1.6);
  .walden::after {
    background: #0044cc;
    mix-blend-mode: screen;
    opacity: .3; }
    */
    name: 'WALDEN',
    hue: -10,
    br: 1.1,
    sat: 1.6,
    con: 1,
    sepia: 0.3,
    gray: 0,
    blendMode: MODES_SCREEN,
    grad: 0,
    gradColor: [0 / 255,  68 / 255,  204 / 255,  0.3],
    blendOpacity: 1,
    isColorBlend: true,
    isInverse: false
  },
  'XPRO': {
    /*.xpro2 {
  -webkit-filter: sepia(0.3);
  .xpro2::after {
    background: -webkit-radial-gradient(circle, #e6e7e0 40%, rgba(43, 42, 161, 0.6) 110%);
    background: radial-gradient(circle, #e6e7e0 40%, rgba(43, 42, 161, 0.6) 110%);
    mix-blend-mode: color-burn; }
    */
    name: 'XPRO',
    hue: 0,
    br: 1,
    sat: 1,
    con: 1,
    sepia: 0.3,
    gray: 0,
    blendMode: MODES_COLOR_BURN,
    grad: 3,
    gradColor: [0 / 255,  0 / 255,  0 / 255,  0],
    blendOpacity: 1,
    isColorBlend: false,
    isInverse: false
  },
  'BROOKLYN': {
    /*
.brooklyn {
  -webkit-filter: contrast(0.9) brightness(1.1);
  .brooklyn::after {
    background: -webkit-radial-gradient(circle, rgba(168, 223, 193, 0.4) 70%, #c4b7c8);
    background: radial-gradient(circle, rgba(168, 223, 193, 0.4) 70%, #c4b7c8);
    mix-blend-mode: overlay; }
    */
    name: 'BROOKLYN',
    hue: 0,
    br: 1.1,
    sat: 1,
    con: 0.9,
    sepia: 0,
    gray: 0,
    blendMode: MODES_OVERLAY,
    grad: 4,
    gradColor: [0 / 255,  0 / 255,  0 / 255,  0],
    blendOpacity: 1,
    isColorBlend: false,
    isInverse: false
  },
  'GINGHAM': {
    /*
.gingham {
  -webkit-filter: brightness(1.05) hue-rotate(-10deg);
  .gingham::after {
    background: -webkit-linear-gradient(left, rgba(66, 10, 14, 0.2), transparent);
    background: linear-gradient(to right, rgba(66, 10, 14, 0.2), transparent);
    mix-blend-mode: darken; }
    */
    name: 'GINGHAM',
    hue: -10,
    br: 1.05,
    sat: 1,
    con: 1,
    sepia: 0,
    gray: 0,
    blendMode: MODES_DARKEN,
    grad: 5,
    gradColor: [0 / 255,  0 / 255,  0 / 255,  0],
    blendOpacity: 1,
    isColorBlend: false,
    isInverse: false
  },
  'REYES': {
    /*.reyes {
  -webkit-filter: sepia(0.22) brightness(1.1) contrast(0.85) saturate(0.75);
  .reyes::after {
    background: #efcdad;
    mix-blend-mode: soft-light;
    opacity: .5; }
    */
    name: 'REYES',
    hue: 0,
    br: 1.1,
    sat: 0.75,
    con: 0.85,
    sepia: 0.22,
    gray: 0,
    blendMode: MODES_SOFT_LIGHT,
    grad: 0,
    gradColor: [239 / 255,  205 / 255,  173 / 255,  0.5],
    blendOpacity: 1,
    isColorBlend: true,
    isInverse: false
  },
  'HUDSON': {
    /*
.hudson {
  -webkit-filter: brightness(1.2) contrast(0.9) saturate(1.1);
          filter: brightness(1.2) contrast(0.9) saturate(1.1); }
  .hudson::after {
    background: -webkit-radial-gradient(circle, #a6b1ff 50%, #342134);
    background: radial-gradient(circle, #a6b1ff 50%, #342134);
    mix-blend-mode: multiply;
    opacity: .5; }*/
    name: 'HUDSON',
    hue: 0,
    br: 1.2,
    sat: 1.1,
    con: 0.9,
    sepia: 0,
    gray: 0,
    blendMode: MODES_MULTIPLY,
    grad: 7,
    gradColor: [0 / 255,  0 / 255,  0 / 255,  0],
    blendOpacity: 0.5,
    isColorBlend: false,
    isInverse: true
  }
};
