import React from 'react';
import GL from 'gl-react';
import uniforms from '../constants/uniforms';


const shaders = GL.Shaders.create({
  shader: {
    frag: `precision highp float;
    varying vec2 uv;
    uniform sampler2D inputTexture;
    uniform float hue;
    uniform float br;
    uniform float sat;
    uniform float con;
    uniform float sepia;
    uniform float gray;
    uniform int blendMode;
    uniform bool isColorBlend;
    uniform float blendOpacity;
    uniform sampler2D gradient;
    uniform vec4 gradientColor;
    uniform bool inverseFilter;


    const vec3 W = vec3(0.2125, 0.7154, 0.0721);
    const mat3 rgb2yiq = mat3(0.299, 0.587, 0.114, 0.595716, -0.274453, -0.321263, 0.211456, -0.522591, 0.311135);
    const mat3 yiq2rgb = mat3(1.0, 0.9563, 0.6210, 1.0, -0.2721, -0.6474, 1.0, -1.1070, 1.7046);
    const float PI = 3.14159265359;

    const int MODES_SCREEN = 0;
    const int MODES_OVERLAY = 1;
    const int MODES_MULTIPLY = 2;
    const int MODES_COLOR_BURN = 3;
    const int MODES_DARKEN = 4;
    const int MODES_SOFT_LIGHT = 5;

    vec3 BrightnessContrastSaturation(vec3 color)
    {
      vec3 black = vec3(0., 0., 0.);
      vec3 middle = vec3(0.5, 0.5, 0.5);
      float luminance = dot(color, W);
      vec3 gray = vec3(luminance, luminance, luminance);
      vec3 brtColor = mix(black, color, br);
      vec3 conColor = mix(middle, brtColor, con);
      vec3 satColor = mix(gray, conColor, sat);
      return satColor;
    }

    vec4 adjustHue(vec3 color, float hue){
      vec3 yColor = rgb2yiq * color.rgb;
      float originalHue = atan(yColor.b, yColor.g);
      float finalHue = originalHue + hue;
      float chroma = sqrt(yColor.b*yColor.b+yColor.g*yColor.g);
      vec3 yFinalColor = vec3(yColor.r, chroma * cos(finalHue), chroma * sin(finalHue));
      return vec4(yiq2rgb*yFinalColor, 1.0);
    }

    vec3 addSepia(vec3 color){
      float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      vec4 merged = mix(vec4(color, 1.), vec4(gray * vec3(0.9, 0.8, 0.6),1.0), sepia);
      return merged.rgb;
    }

    vec3 addGray(vec3 color){
      float grayCol = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      vec4 merged = mix(vec4(color, 1.), vec4(grayCol,grayCol,grayCol, 1.), gray);
      return merged.rgb;
    }

    float blendScreen(float base, float blend) {
      return 1.0-((1.0-base)*(1.0-blend));
    }

    vec3 blendScreen(vec3 base, vec3 blend) {
      return vec3(blendScreen(base.r,blend.r),blendScreen(base.g,blend.g),blendScreen(base.b,blend.b));
    }

    vec3 blendScreen(vec3 base, vec3 blend, float opacity) {
      return (blendScreen(base, blend) * opacity + blend * (1.0 - opacity));
    }

    float blendOverlay(float base, float blend) {
      return base<0.5?(2.0*base*blend):(1.0-2.0*(1.0-base)*(1.0-blend));
    }

    vec3 blendOverlay(vec3 base, vec3 blend) {
      return vec3(blendOverlay(base.r,blend.r),blendOverlay(base.g,blend.g),blendOverlay(base.b,blend.b));
    }

    vec3 blendOverlay(vec3 base, vec3 blend, float opacity) {
      return (blendOverlay(base, blend) * opacity + blend * (1.0 - opacity));
    }

    vec3 blendMultiply(vec3 base, vec3 blend) {
      return base*blend;
    }

    vec3 blendMultiply(vec3 base, vec3 blend, float opacity) {
      return (blendMultiply(base, blend) * opacity + blend * (1.0 - opacity));
    }

    float blendColorBurn(float base, float blend) {
      return (blend==0.0)?blend:max((1.0-((1.0-base)/blend)),0.0);
    }

    vec3 blendColorBurn(vec3 base, vec3 blend) {
      return vec3(blendColorBurn(base.r,blend.r),blendColorBurn(base.g,blend.g),blendColorBurn(base.b,blend.b));
    }

    vec3 blendColorBurn(vec3 base, vec3 blend, float opacity) {
      return (blendColorBurn(base, blend) * opacity + blend * (1.0 - opacity));
    }

    float blendDarken(float base, float blend) {
      return min(blend,base);
    }

    vec3 blendDarken(vec3 base, vec3 blend) {
      return vec3(blendDarken(base.r,blend.r),blendDarken(base.g,blend.g),blendDarken(base.b,blend.b));
    }

    vec3 blendDarken(vec3 base, vec3 blend, float opacity) {
      return (blendDarken(base, blend) * opacity + blend * (1.0 - opacity));
    }

    float blendSoftLight(float base, float blend) {
      return (blend<0.5)?(2.0*base*blend+base*base*(1.0-2.0*blend)):(sqrt(base)*(2.0*blend-1.0)+2.0*base*(1.0-blend));
    }

    vec3 blendSoftLight(vec3 base, vec3 blend) {
      return vec3(blendSoftLight(base.r,blend.r),blendSoftLight(base.g,blend.g),blendSoftLight(base.b,blend.b));
    }

    vec3 blendSoftLight(vec3 base, vec3 blend, float opacity) {
      return (blendSoftLight(base, blend) * opacity + base * (1.0 - opacity));
    }

    vec3 blend(int blendMode, vec3 base, vec3 blend, float opacity) {
      if (blendMode == MODES_SCREEN)
        return blendScreen(base, blend, opacity);
      else if (blendMode == MODES_OVERLAY)
        return blendOverlay(base, blend, opacity);
      else if (blendMode == MODES_MULTIPLY)
        return blendMultiply(base, blend, opacity);
      else if (blendMode == MODES_COLOR_BURN)
        return blendColorBurn(base, blend, opacity);
      else if (blendMode == MODES_DARKEN)
        return blendDarken(base, blend, opacity);
      else if (blendMode == MODES_SOFT_LIGHT)
        return blendSoftLight(base, blend, opacity);
      else
        return base;
    }

    vec3 applyGradient(vec3 color) {
      if (blendOpacity == -1.) {
        return color;
      } else {
        if (isColorBlend) {
          vec3 newGradColor = mix(color, gradientColor.rgb, gradientColor.a).rgb;
          return blend(blendMode, color, newGradColor, blendOpacity);
        } else {
          vec4 gc = texture2D(gradient, uv);
          vec3 newGradColor = mix(color, gc.rgb, gc.a).rgb;
          if (inverseFilter) {
            return blend(blendMode, newGradColor.rgb, color, blendOpacity);
          } else {
            return blend(blendMode, color, newGradColor.rgb, blendOpacity);
          }
        }
      }
    }

    void main()
    {
      vec3 bcs_result = texture2D(inputTexture, uv).rgb;
      bcs_result = adjustHue(bcs_result, -hue*PI/180.).rgb;
      bcs_result = BrightnessContrastSaturation(bcs_result);
      bcs_result = addSepia(bcs_result);
      bcs_result = addGray(bcs_result);
      bcs_result = applyGradient(bcs_result);
      gl_FragColor = vec4(bcs_result, 1.);
    }`
  }
});


export default GL.createComponent(({width, height, filter, children}) =>
  <GL.Node
    shader={shaders.shader}
    width={width}
    height={height}
    uniforms={{
      hue: uniforms[filter].hue,
      br: uniforms[filter].br,
      sat: uniforms[filter].sat,
      con: uniforms[filter].con,
      sepia: uniforms[filter].sepia,
      gray: uniforms[filter].gray,
      blendMode: uniforms[filter].blendMode,
      blendOpacity: uniforms[filter].blendOpacity,
      gradientColor: uniforms[filter].gradColor,
      isColorBlend: uniforms[filter].isColorBlend,
      inverseFilter: uniforms[filter].isInverse,
      gradient: `/dist/grads/GRAD_${uniforms[filter].grad}.png`}}>
    <GL.Uniform name="inputTexture">
      {children}
    </GL.Uniform>
  </GL.Node>);
