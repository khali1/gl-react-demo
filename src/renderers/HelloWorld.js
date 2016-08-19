import React from 'react';
import GL from 'gl-react';


const shaders = GL.Shaders.create({
  helloGL: {
    frag: `
      precision highp float;
      varying vec2 uv;
      uniform float value;
      void main () {
        gl_FragColor = vec4(uv.x, uv.y, value, 1.0);
      }
    `
  }
});

export default GL.createComponent(({width, height, time}) => <GL.Node
    shader={shaders.helloGL}
    width={width}
    height={height}
    uniforms={{value: (1 + Math.cos(time / 1000)) / 2}}
  />);
