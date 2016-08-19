import React from 'react';
import GL from 'gl-react';


const shaders = GL.Shaders.create({
  shader: {
    frag: `
      precision highp float;
      varying vec2 uv;
      uniform sampler2D video;
      void main () {
        gl_FragColor = texture2D(video, uv.xy);
      }
    `
  }
});

export default GL.createComponent(({width, height, time, children}) =>
  <GL.Node
    shader={shaders.shader}
    width={width}
    height={height}>
    <GL.Uniform name="video">
      {children}
    </GL.Uniform>
  </GL.Node>);
