import React from 'react';
import GL from 'gl-react';


const shaders = GL.Shaders.create({
  'CROSSFADE': {
    "name": "Crossfade",
    "icon": "cross_fade",
    "duration": "1000",
    "uniforms": {},
    "frag": `precision highp float;
      uniform sampler2D from;
      uniform sampler2D to;
      uniform float progress;
      uniform vec2 resolution;
      void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        gl_FragColor = mix(texture2D(from, uv),texture2D(to, uv), progress);
      }`
  },
  'CUT': {
    "name": "Cut",
    "icon": "cut",
    "duration": "2",
    "uniforms": {},
    "frag": `precision highp float;
      uniform sampler2D from;
      uniform sampler2D to;
      uniform float progress;
      uniform vec2 resolution;
      void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        if (progress > 0.5) {
                gl_FragColor = texture2D(to, uv);
        } else {
                gl_FragColor = texture2D(from, uv);
        }
      }`
  },
  'FADE_COLOR': {
    "name": "Fade Color",
    "icon": "fade_color",
    "duration": "1000",
    "uniforms": {
      "color": [0, 0, 0],
      "colorPhase": 0.4
    },
    "frag": `precision highp float;
             uniform sampler2D from;
             uniform sampler2D to;
             uniform float progress;
             uniform vec2 resolution;
             uniform vec3 color;
             uniform float colorPhase;
             void main() {
               vec2 p = gl_FragCoord.xy / resolution.xy;
               gl_FragColor = mix(
                 mix(vec4(color, 1.0), texture2D(from, p), smoothstep(1.0-colorPhase, 0.0, progress)),
                 mix(vec4(color, 1.0), texture2D(to,   p), smoothstep(    colorPhase, 1.0, progress)),
                 progress);
             }`
  },
  'RAYTRACED_SPHERE': {
    "name": "Raytraced Sphere",
    "icon": "crossfade",
    "duration": "1000",
    "uniforms": {},
    "frag": `#ifdef GL_ES
      precision highp float;
      #endif
      uniform sampler2D from, to;
      uniform float progress;
      uniform vec2 resolution;

      #define EPSILON .001
      #define REFRACT_INDICIES .33
      #define FRESNEL_STRENGTH .8

      struct Ray {
        vec3 origin;
        vec3 direction;
      };
      struct RaycastHit {
        vec3 point;
        vec3 normal;
        float det;
        int type;
      };
      vec3 light = vec3(2., 3., 0.);
      RaycastHit intersectSphere(vec3 position, float radius, const Ray ray) {
        float a = dot(ray.direction, ray.direction);
        float b = 2. * dot(ray.direction, ray.origin - position);
        float c = dot(ray.origin - position, ray.origin - position) -(radius * radius);
        float det = (b * b) - 4. * a * c;
        float lambda = (-b -sqrt(det)) / (2. * a);
        vec3 p = ray.origin + lambda * ray.direction;
        vec3 n = p - position;
        RaycastHit hit;
        hit.point = p;
        hit.normal = normalize(n);
        hit.det = det;
        hit.type = (det >= 0. && lambda >= 0.) ? 0 : -1;
        return hit;
      }

      // Source: http://coding-experiments.blogspot.com.au/2010/06/frosted-glass.html
      float rand(vec2 uv) {
        float a = dot(uv, vec2(92., 80.));
        float b = dot(uv, vec2(41., 62.));
        float x = sin(a) + cos(b) * 51.;
        return fract(x);
      }

      vec4 shade(Ray ray, vec2 uv) {
        vec3 spherePos = vec3(0.,0.,4.);
        RaycastHit sphere = intersectSphere(spherePos, 1.5, ray);
        vec3 bg = mix(texture2D(from, uv), texture2D(to, uv), progress).xyz;
        if(sphere.type == 0) {
          // reflection
          vec3 reflectDir = reflect(ray.direction, sphere.normal);
          Ray reflectRay = Ray(sphere.point + (reflectDir * EPSILON), reflectDir);
          vec3 l = light - sphere.point;
          // diffuse calculation
          float dif = pow(max(dot(normalize(l), sphere.normal), 0.), 1.);
          float spec = 0.;
          spec += pow(max(dot(normalize(reflectRay.direction), normalize(l)), 0.), 15.);
          // fresnel calculation
          // borrowed from TekF's Bouy shader
          // source: https://www.shadertoy.com/view/XdsGDB
          float ndotr = dot(sphere.normal,ray.direction);
           float fresnel = pow(1. - abs(ndotr), FRESNEL_STRENGTH);
           fresnel = mix( .001, 1.0, fresnel );
          // UV coordinates mapping
          uv = vec2(rand(uv), rand(uv)) * .05;
          bg = mix(texture2D(from, uv), texture2D(to, uv), progress).xyz;
          // color calculation
          vec3 ambient = vec3(.2);
          vec3 diffuse = bg * dif;
          vec3 specular = vec3(1.) * spec;
          // blending
          vec3 final = ambient + diffuse + spec;
          return vec4(final.xyz, 1.);
        }
        return vec4(bg, 1.);
      }

      void main() {
       vec2 uv = (gl_FragCoord.xy - (resolution.xy / 2.)) / resolution.y;
       light.x = 2. * progress;
       vec3 ori = vec3(0.);
       vec3 dir = vec3(uv.xy, 1.);
       Ray ray = Ray(ori, dir);
       gl_FragColor = shade(ray, gl_FragCoord.xy / resolution.xy);
      }`
  },
  'BLUR': {
    "name": "Blur",
    "icon": "crossfade",
    "duration": "1000",
    "uniforms": {
      "size": 0.6
    },
    "frag": `#ifdef GL_ES
      precision highp float;
      #endif
      #define QUALITY 32
      // General parameters
      uniform sampler2D from;
      uniform sampler2D to;
      uniform float progress;
      uniform vec2 resolution;
      // Custom parameters
      float size = 0.6;
      const float GOLDEN_ANGLE = 2.399963229728653; // PI * (3.0 - sqrt(5.0))
      vec4 blur(sampler2D t, vec2 c, float radius) {
        vec4 sum = vec4(0.0);
        float q = float(QUALITY);
        // Using a "spiral" to propagate points.
        for (int i=0; i<QUALITY; ++i) {
          float fi = float(i);
          float a = fi * GOLDEN_ANGLE;
          float r = sqrt(fi / q) * radius;
          vec2 p = c + r * vec2(cos(a), sin(a));
          sum += texture2D(t, p);
        }
        return sum / q;
      }
      void main()
      {
        vec2 p = gl_FragCoord.xy / resolution.xy;
        float inv = 1.-progress;
        gl_FragColor = inv*blur(from, p, progress*size) + progress*blur(to, p, inv*size);
      }`
  },
  'GLITCH_DISPLACE': {
    "name": "Glitch Displace",
    "icon": "crossfade",
    "duration": "1000",
    "uniforms": {},
    "frag": "#ifdef GL_ES\nprecision highp float;\n#endif\nuniform sampler2D from, to;\nuniform float progress;\nuniform vec2 resolution;\nhighp float random(vec2 co)\n{\n  highp float a = 12.9898;\n  highp float b = 78.233;\n  highp float c = 43758.5453;\n  highp float dt= dot(co.xy ,vec2(a,b));\n  highp float sn= mod(dt,3.14);\n  return fract(sin(sn) * c);\n}\nfloat voronoi( in vec2 x ) {\n  vec2 p = floor( x );\n  vec2 f = fract( x );\n  float res = 8.0;\n  for( float j=-1.; j<=1.; j++ )\n  for( float i=-1.; i<=1.; i++ ) {\n    vec2 b = vec2( i, j );\n    vec2 r = b - f + random( p + b );\n    float d = dot( r, r );\n    res = min( res, d );\n  }\n  return sqrt( res );\n}\n\nvec2 displace(vec4 tex, vec2 texCoord, float dotDepth, float textureDepth, float strength) {\n  float b = voronoi(.003 * texCoord + 2.0);\n  float g = voronoi(0.2 * texCoord);\n  float r = voronoi(texCoord - 1.0);\n  vec4 dt = tex * 1.0;\n  vec4 dis = dt * dotDepth + 1.0 - tex * textureDepth;\n\n  dis.x = dis.x - 1.0 + textureDepth*dotDepth;\n  dis.y = dis.y - 1.0 + textureDepth*dotDepth;\n  dis.x *= strength;\n  dis.y *= strength;\n  vec2 res_uv = texCoord ;\n  res_uv.x = res_uv.x + dis.x - 0.0;\n  res_uv.y = res_uv.y + dis.y;\n  return res_uv;\n}\n\nfloat ease1(float t) {\n return t == 0.0 || t == 1.0\n  ? t\n  : t < 0.5\n   ? +0.5 * pow(2.0, (20.0 * t) - 10.0)\n   : -0.5 * pow(2.0, 10.0 - (t * 20.0)) + 1.0;\n}\nfloat ease2(float t) {\n return t == 1.0 ? t : 1.0 - pow(2.0, -10.0 * t);\n}\n\n\n\nvoid main() {\n vec2 p = gl_FragCoord.xy / resolution.xy;\n vec4 color1 = texture2D(from, p);\n vec4 color2 = texture2D(to, p);\n vec2 disp = displace(color1, p, 0.33, 0.7, 1.0-ease1(progress));\n vec2 disp2 = displace(color2, p, 0.33, 0.5, ease2(progress));\n vec4 dColor1 = texture2D(to, disp);\n vec4 dColor2 = texture2D(from, disp2);\n float val = ease1(progress);\n vec3 gray = vec3(dot(min(dColor2, dColor1).rgb, vec3(0.299, 0.587, 0.114)));\n dColor2 = vec4(gray, 1.0);\n dColor2 *= 2.0;\n color1 = mix(color1, dColor2, smoothstep(0.0, 0.5, progress));\n color2 = mix(color2, dColor1, smoothstep(1.0, 0.5, progress));\n gl_FragColor = mix(color1, color2, val);\n //gl_FragColor = mix(gl_FragColor, dColor, smoothstep(0.0, 0.5, progress));\n \n  //gl_FragColor = mix(texture2D(from, p), texture2D(to, p), progress);\n}"
  },
  'CROSSHATCH': {
    "name": "Crosshatch",
    "icon": "crossfade",
    "duration": "1000",
    "uniforms": {},
    "frag": "#ifdef GL_ES\nprecision highp float;\n#endif\n\n// General parameters\nuniform sampler2D from;\nuniform sampler2D to;\nuniform float progress;\nuniform vec2 resolution;\n \nconst vec2 center = vec2(0.5, 0.5);\n\nfloat quadraticInOut(float t) {\n float p = 2.0 * t * t;\n return t < 0.5 ? p : -p + (4.0 * t) - 1.0;\n}\n\n// borrowed from wind.\n// https://glsl.io/transition/7de3f4b9482d2b0bf7bb\nfloat rand(vec2 co) {\n return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);\n}\n\n\nvoid main() {\n vec2 p = gl_FragCoord.xy / resolution.xy;\n \n if (progress == 0.0) {\n  gl_FragColor = texture2D(from, p);\n } else if (progress == 1.0) {\n  gl_FragColor = texture2D(to, p);\n } else {\n  float x = progress;\n  float dist = distance(center, p);\n  float r = x - min(rand(vec2(p.y, 0.0)), rand(vec2(0.0, p.x)));\n  float m = dist <= r ? 1.0 : 0.0;\n  gl_FragColor = mix(texture2D(from, p), texture2D(to, p), m);  \n }\n \n}"
  },
  'UNDULATING_BURN_OUT': {
    "name": "Undulating Burn Out",
    "icon": "crossfade",
    "duration": "1000",
    "uniforms": {
      "smoothness": 0.02
    },
    "frag": "#ifdef GL_ES\nprecision highp float;\n#endif\n\n#define \tM_PI  3.14159265358979323846\t/* pi */\n\n// General parameters\nuniform sampler2D from;\nuniform sampler2D to;\nuniform float progress;\nuniform vec2 resolution;\n \nfloat smoothness = 0.02;\nconst vec2 center = vec2(0.5, 0.5);\n\nfloat quadraticInOut(float t) {\n float p = 2.0 * t * t;\n return t < 0.5 ? p : -p + (4.0 * t) - 1.0;\n}\n\nfloat linearInterp(vec2 range, vec2 domain, float x) {\n return mix(range.x, range.y, smoothstep(domain.x, domain.y, clamp(x, domain.x, domain.y)));\n}\n\nfloat getGradient(float r, float dist) {\n float grad = smoothstep(-smoothness, 0.0, r - dist * (1.0 + smoothness)); //, 0.0, 1.0);\n if (r - dist < 0.005 && r - dist > -0.005) {\n  return -1.0;\n } else if (r - dist < 0.01 && r - dist > -0.005) {\n  return -2.0;\n }\n return grad;\n}\n\nfloat round(float a) {\n return floor(a + 0.5);\n}\n\nfloat getWave(vec2 p){\n \n // I'd really like to figure out how to make the ends meet on my circle.\n // The left side is where the ends don't meet.\n \n vec2 _p = p - center; // offset from center\n float rads = atan(_p.y, _p.x);\n float degs = degrees(rads) + 180.0;\n vec2 range = vec2(0.0, M_PI * 30.0);\n vec2 domain = vec2(0.0, 360.0);\n \n float ratio = (M_PI * 30.0) / 360.0;\n //degs = linearInterp(range, domain, degs);\n degs = degs * ratio;\n float x = progress;\n float magnitude = mix(0.02, 0.09, smoothstep(0.0, 1.0, x));\n float offset = mix(40.0, 30.0, smoothstep(0.0, 1.0, x));\n float ease_degs = quadraticInOut(sin(degs));\n \n float deg_wave_pos = (ease_degs * magnitude) * sin(x * offset);\n return x + deg_wave_pos;\n}\n\nvoid main() {\n vec2 p = gl_FragCoord.xy / resolution.xy;\n \n if (progress == 0.0) {\n  gl_FragColor = texture2D(from, p);\n } else if (progress == 1.0) {\n  gl_FragColor = texture2D(to, p);\n } else {\n  float dist = distance(center, p);\n  float m = getGradient(getWave(p), dist);\n  if (m == -2.0) {\n   //gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);\n   //gl_FragColor = mix(texture2D(from, p), texture2D(to, p), -1.0);\n   gl_FragColor = mix(texture2D(from, p), vec4(0.0, 0.0, 0.0, 1.0), 0.75);\n  } else {\n   gl_FragColor = mix(texture2D(from, p), texture2D(to, p), m);  \n  }\n }\n \n}"
  },
  'STAR_WIPE': {
    "name": "Star Wipe",
    "icon": "crossfade",
    "duration": "1000",
    "uniforms": {},
    "frag": "// Why eat hamburger when you can have steak?\n// https://www.youtube.com/watch?v=lfgVMk36-Ek\n\n#ifdef GL_ES\nprecision highp float;\n#endif\nuniform sampler2D from, to;\nuniform float progress;\nuniform vec2 resolution;\n\nvec2 circlePoint( float ang )\n{\n ang += 6.28318 * 0.15;\n return vec2( cos(ang), sin(ang) ); \n}\n\nfloat cross2d( vec2 a, vec2 b )\n{\n return ( a.x * b.y - a.y * b.x );\n}\n\n// quickly knocked together with some math from http://www.pixeleuphoria.com/node/30\nfloat star( vec2 p, float size )\n{\n if( size <= 0.0 )\n {\n  return 0.0;\n }\n p /= size;\n \n vec2 p0 = circlePoint( 0.0 );\n vec2 p1 = circlePoint( 6.28318 * 1.0 / 5.0 );\n vec2 p2 = circlePoint( 6.28318 * 2.0 / 5.0 );\n vec2 p3 = circlePoint( 6.28318 * 3.0 / 5.0 );\n vec2 p4 = circlePoint( 6.28318 * 4.0 / 5.0 );\n \n // are we on this side of the line\n float s0 = ( cross2d( p1 - p0, p - p0 ) );\n float s1 = ( cross2d( p2 - p1, p - p1 ) );\n float s2 = ( cross2d( p3 - p2, p - p2 ) );\n float s3 = ( cross2d( p4 - p3, p - p3 ) );\n float s4 = ( cross2d( p0 - p4, p - p4 ) );\n \n // some trial and error math to get the star shape. I'm sure there's some elegance I'm missing.\n float s5 = min( min( min( s0, s1 ), min( s2, s3 ) ), s4 );\n float s = max( 1.0 - sign( s0 * s1 * s2 * s3 * s4 ) + sign(s5), 0.0 );\n s = sign( 2.6 - length(p) ) * s;\n \n return max( s, 0.0 );\n}\n\nvoid main() \n{\n vec2 p = ( gl_FragCoord.xy / resolution.xy );\n vec2 o = p * 2.0 - 1.0;\n \n float t = progress * 1.4;\n \n float c1 = star( o, t );\n float c2 = star( o, t - 0.1 );\n \n float border = max( c1 - c2, 0.0 );\n \n gl_FragColor = mix(texture2D(from, p), texture2D(to, p), c1) + vec4( border, border, border, 0.0 );\n}"
  },
  'CUBE': {
    "name": "cube",
    "icon": "cube",
    "duration": "1000",
    "uniforms": {
      // "persp": 0.7,
      // "unzoom": 0.3,
      // "reflection": 0.4,
      // "floating": 3
    },
    "frag": "#ifdef GL_ES\nprecision highp float;\n#endif\nuniform sampler2D from, to;\nuniform float progress;\nuniform vec2 resolution;\n\nfloat persp = 0.7;\nfloat unzoom = 0.3;\nfloat reflection = 0.4;\nfloat floating = 3.;\n\nvec2 project (vec2 p) {\n return p * vec2(1.0, -1.2) + vec2(0.0, -floating/100.);\n}\n\nbool inBounds (vec2 p) {\n return all(lessThan(vec2(0.0), p)) && all(lessThan(p, vec2(1.0)));\n}\n\nvec4 bgColor (vec2 p, vec2 pfr, vec2 pto) {\n vec4 c = vec4(0.0, 0.0, 0.0, 1.0);\n pfr = project(pfr);\n if (inBounds(pfr)) {\n  c += mix(vec4(0.0), texture2D(from, pfr), reflection * mix(1.0, 0.0, pfr.y));\n }\n pto = project(pto);\n if (inBounds(pto)) {\n  c += mix(vec4(0.0), texture2D(to, pto), reflection * mix(1.0, 0.0, pto.y));\n }\n return c;\n}\n\n// p : the position\n// persp : the perspective in [ 0, 1 ]\n// center : the xcenter in [0, 1] \\ 0.5 excluded\nvec2 xskew (vec2 p, float persp, float center) {\n float x = mix(p.x, 1.0-p.x, center);\n return (\n  (\n   vec2( x, (p.y - 0.5*(1.0-persp) * x) / (1.0+(persp-1.0)*x) )\n   - vec2(0.5-distance(center, 0.5), 0.0)\n  )\n  * vec2(0.5 / distance(center, 0.5) * (center<0.5 ? 1.0 : -1.0), 1.0)\n  + vec2(center<0.5 ? 0.0 : 1.0, 0.0)\n );\n}\n\nvoid main() {\n vec2 op = gl_FragCoord.xy / resolution.xy;\n float uz = unzoom * 2.0*(0.5-distance(0.5, progress));\n vec2 p = -uz*0.5+(1.0+uz) * op;\n vec2 fromP = xskew(\n  (p - vec2(progress, 0.0)) / vec2(1.0-progress, 1.0),\n  1.0-mix(progress, 0.0, persp),\n  0.0\n );\n vec2 toP = xskew(\n  p / vec2(progress, 1.0),\n  mix(pow(progress, 2.0), 1.0, persp),\n  1.0\n );\n if (inBounds(fromP)) {\n  gl_FragColor = texture2D(from, fromP);\n }\n else if (inBounds(toP)) {\n  gl_FragColor = texture2D(to, toP);\n }\n else {\n  gl_FragColor = bgColor(op, fromP, toP);\n }\n}"
  },
  'SWAP': {
    "name": "swap",
    "icon": "swap",
    "duration": "1000",
    "uniforms": {
      // "reflection": 0.4,
      // "perspective": 0.2,
      // "depth": 3
    },
    "frag": "#ifdef GL_ES\nprecision highp float;\n#endif\n \n// General parameters\nuniform sampler2D from;\nuniform sampler2D to;\nuniform float progress;\nuniform vec2 resolution;\n \n float reflection = 0.4;\nfloat perspective = 0.2;\nfloat depth = 3.;\n \nconst vec4 black = vec4(0.0, 0.0, 0.0, 1.0);\nconst vec2 boundMin = vec2(0.0, 0.0);\nconst vec2 boundMax = vec2(1.0, 1.0);\n \nbool inBounds (vec2 p) {\n return all(lessThan(boundMin, p)) && all(lessThan(p, boundMax));\n}\n \nvec2 project (vec2 p) {\n return p * vec2(1.0, -1.2) + vec2(0.0, -0.02);\n}\n \nvec4 bgColor (vec2 p, vec2 pfr, vec2 pto) {\n vec4 c = black;\n pfr = project(pfr);\n if (inBounds(pfr)) {\n  c += mix(black, texture2D(from, pfr), reflection * mix(1.0, 0.0, pfr.y));\n }\n pto = project(pto);\n if (inBounds(pto)) {\n  c += mix(black, texture2D(to, pto), reflection * mix(1.0, 0.0, pto.y));\n }\n return c;\n}\n \nvoid main() {\n vec2 p = gl_FragCoord.xy / resolution.xy;\n \n vec2 pfr, pto = vec2(-1.);\n \n float size = mix(1.0, depth, progress);\n float persp = perspective * progress;\n pfr = (p + vec2(-0.0, -0.5)) * vec2(size/(1.0-perspective*progress), size/(1.0-size*persp*p.x)) + vec2(0.0, 0.5);\n \n size = mix(1.0, depth, 1.-progress);\n persp = perspective * (1.-progress);\n pto = (p + vec2(-1.0, -0.5)) * vec2(size/(1.0-perspective*(1.0-progress)), size/(1.0-size*persp*(0.5-p.x))) + vec2(1.0, 0.5);\n \n bool fromOver = progress < 0.5;\n \n if (fromOver) {\n  if (inBounds(pfr)) {\n   gl_FragColor = texture2D(from, pfr);\n  }\n  else if (inBounds(pto)) {\n   gl_FragColor = texture2D(to, pto);\n  }\n  else {\n   gl_FragColor = bgColor(p, pfr, pto);\n  }\n }\n else {\n  if (inBounds(pto)) {\n   gl_FragColor = texture2D(to, pto);\n  }\n  else if (inBounds(pfr)) {\n   gl_FragColor = texture2D(from, pfr);\n  }\n  else {\n   gl_FragColor = bgColor(p, pfr, pto);\n  }\n }\n}"
  },
  'FLASH': {
    "name": "flash",
    "icon": "crossfade",
    "duration": "1000",
    "uniforms": {
      "flashPhase": 0.3,
      "flashIntensity": 3,
      "flashZoomEffect": 0.5
    },
    "frag": "#ifdef GL_ES\nprecision highp float;\n#endif\n \n// General parameters\nuniform sampler2D from;\nuniform sampler2D to;\nuniform float progress;\nuniform vec2 resolution;\n \nfloat flashPhase = 0.3; // if 0.0, the image directly turn grayscale, if 0.9, the grayscale transition phase is very important\nfloat flashIntensity = 3.0;\nfloat flashZoomEffect = .5;\n \nconst vec3 flashColor = vec3(1.0, 0.8, 0.3);\nconst float flashVelocity = 3.0;\n \nvoid main() {\n vec2 p = gl_FragCoord.xy / resolution.xy;\n vec4 fc = texture2D(from, p);\n vec4 tc = texture2D(to, p);\n float intensity = mix(1.0, 2.0*distance(p, vec2(0.5, 0.5)), flashZoomEffect) * flashIntensity * pow(smoothstep(flashPhase, 0.0, distance(0.5, progress)), flashVelocity);\n vec4 c = mix(texture2D(from, p), texture2D(to, p), smoothstep(0.5*(1.0-flashPhase), 0.5*(1.0+flashPhase), progress));\n c += intensity * vec4(flashColor, 1.0);\n gl_FragColor = c;\n}"
  },
  'BURN': {
    "name": "burn",
    "icon": "burn",
    "duration": "1000",
    "uniforms": {
      "color": [
        0.9,
        0.4,
        0.2
      ]
    },
    "frag": "#ifdef GL_ES\nprecision highp float;\n#endif\nuniform sampler2D from, to;\nuniform float progress;\nuniform vec2 resolution;\n\nuniform vec3 color;\n\nvoid main() {\n vec2 p = gl_FragCoord.xy / resolution.xy;\n gl_FragColor = mix(\n  texture2D(from, p) + vec4(progress*color, 1.0),\n  texture2D(to, p) + vec4((1.0-progress)*color, 1.0),\n  progress);\n}"
  },
  'RANDOM_SQUARES': {
    "name": "random squares",
    "icon": "random_squares",
    "duration": "1000",
    "uniforms": {
      "size": [
        10,
        10
      ],
      "smoothness": 0.5
    },
    "frag": "#ifdef GL_ES\nprecision highp float;\n#endif\n \n// General parameters\nuniform sampler2D from;\nuniform sampler2D to;\nuniform float progress;\nuniform vec2 resolution;\n \n// Custom parameters\nuniform ivec2 size;\nuniform float smoothness;\n \nfloat rand (vec2 co) {\n return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);\n}\n\nvoid main() {\n vec2 p = gl_FragCoord.xy / resolution.xy;\n float r = rand(floor(vec2(size) * p));\n float m = smoothstep(0.0, -smoothness, r - (progress * (1.0 + smoothness)));\n gl_FragColor = mix(texture2D(from, p), texture2D(to, p), m);\n}"
  },
  'CROSS_ZOOM': {
    "name": "Cross zoom",
    "icon": "cross_zoom",
    "duration": "1000",
    "uniforms": {
      "strength": 0.4
    },
    "frag": "// Converted from https://github.com/rectalogic/rendermix-basic-effects/blob/master/assets/com/rendermix/CrossZoom/CrossZoom.frag\n// Which is based on https://github.com/evanw/glfx.js/blob/master/src/filters/blur/zoomblur.js\n// With additional easing functions from https://github.com/rectalogic/rendermix-basic-effects/blob/master/assets/com/rendermix/Easing/Easing.glsllib\n\n#ifdef GL_ES\nprecision highp float;\n#endif\nuniform sampler2D from, to;\nuniform float progress;\nuniform vec2 resolution;\n\nuniform float strength;\n\nconst float PI = 3.141592653589793;\n\nfloat Linear_ease(in float begin, in float change, in float duration, in float time) {\n  return change * time / duration + begin;\n}\n\nfloat Exponential_easeInOut(in float begin, in float change, in float duration, in float time) {\n  if (time == 0.0)\n    return begin;\n  else if (time == duration)\n    return begin + change;\n  time = time / (duration / 2.0);\n  if (time < 1.0)\n    return change / 2.0 * pow(2.0, 10.0 * (time - 1.0)) + begin;\n  return change / 2.0 * (-pow(2.0, -10.0 * (time - 1.0)) + 2.0) + begin;\n}\n\nfloat Sinusoidal_easeInOut(in float begin, in float change, in float duration, in float time) {\n  return -change / 2.0 * (cos(PI * time / duration) - 1.0) + begin;\n}\n\n/* random number between 0 and 1 */\nfloat random(in vec3 scale, in float seed) {\n  /* use the fragment position for randomness */\n  return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);\n}\n\nvec3 crossFade(in vec2 uv, in float dissolve) {\n  return mix(texture2D(from, uv).rgb, texture2D(to, uv).rgb, dissolve);\n}\n\nvoid main() {\n  vec2 texCoord = gl_FragCoord.xy / resolution.xy;\n\n  // Linear interpolate center across center half of the image\n  vec2 center = vec2(Linear_ease(0.25, 0.5, 1.0, progress), 0.5);\n  float dissolve = Exponential_easeInOut(0.0, 1.0, 1.0, progress);\n\n  // Mirrored sinusoidal loop. 0->strength then strength->0\n  float strength = Sinusoidal_easeInOut(0.0, strength, 0.5, progress);\n\n  vec3 color = vec3(0.0);\n  float total = 0.0;\n  vec2 toCenter = center - texCoord;\n\n  /* randomize the lookup values to hide the fixed number of samples */\n  float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);\n\n  for (float t = 0.0; t <= 40.0; t++) {\n    float percent = (t + offset) / 40.0;\n    float weight = 4.0 * (percent - percent * percent);\n    color += crossFade(texCoord + toCenter * percent * strength, dissolve) * weight;\n    total += weight;\n  }\n  gl_FragColor = vec4(color / total, 1.0);\n}"
  },
  'DIRECTIONAL_WIPE': {
    "name": "directional wipe",
    "icon": "directional_wipe",
    "duration": "1000",
    "uniforms": {
      "direction": [
        1,
        -1
      ],
      "smoothness": 0.5
    },
    "frag": "#ifdef GL_ES\nprecision highp float;\n#endif\n \n// General parameters\nuniform sampler2D from;\nuniform sampler2D to;\nuniform float progress;\nuniform vec2 resolution;\n \nuniform vec2 direction;\nuniform float smoothness;\n \nconst vec2 center = vec2(0.5, 0.5);\n \nvoid main() {\n vec2 p = gl_FragCoord.xy / resolution.xy;\n vec2 v = normalize(direction);\n v /= abs(v.x)+abs(v.y);\n float d = v.x * center.x + v.y * center.y;\n float m = smoothstep(-smoothness, 0.0, v.x * p.x + v.y * p.y - (d-0.5+progress*(1.+smoothness)));\n gl_FragColor = mix(texture2D(to, p), texture2D(from, p), m);\n}"
  },
  'HEART': {
    "name": "heart",
    "icon": "crossfade",
    "duration": "1000",
    "uniforms": {},
    "frag": "#ifdef GL_ES\nprecision highp float;\n#endif\n \n// General parameters\nuniform sampler2D from;\nuniform sampler2D to;\nuniform float progress;\nuniform vec2 resolution;\n \nbool inHeart (vec2 p, vec2 center, float size) {\n if (size == 0.0) return false;\n vec2 o = (p-center)/(1.6*size);\n return pow(o.x*o.x+o.y*o.y-0.3, 3.0) < o.x*o.x*pow(o.y, 3.0);\n}\n \nvoid main() {\n vec2 p = gl_FragCoord.xy / resolution.xy;\n float m = inHeart(p, vec2(0.5, 0.4), progress) ? 1.0 : 0.0;\n gl_FragColor = mix(texture2D(from, p), texture2D(to, p), m);\n}"
  },
  'DOORWAY': {
    "name": "doorway",
    "icon": "doorway",
    "duration": "1000",
    "uniforms": {
      "reflection": 0.4,
      "perspective": 0.4,
      "depth": 3
    },
    "frag": "#ifdef GL_ES\nprecision highp float;\n#endif\n\n// General parameters\nuniform sampler2D from;\nuniform sampler2D to;\nuniform float progress;\nuniform vec2 resolution;\n \nuniform float reflection;\nuniform float perspective;\nuniform float depth;\n \nconst vec4 black = vec4(0.0, 0.0, 0.0, 1.0);\nconst vec2 boundMin = vec2(0.0, 0.0);\nconst vec2 boundMax = vec2(1.0, 1.0);\n \nbool inBounds (vec2 p) {\n return all(lessThan(boundMin, p)) && all(lessThan(p, boundMax));\n}\n \nvec2 project (vec2 p) {\n return p * vec2(1.0, -1.2) + vec2(0.0, -0.02);\n}\n \nvec4 bgColor (vec2 p, vec2 pto) {\n vec4 c = black;\n pto = project(pto);\n if (inBounds(pto)) {\n  c += mix(black, texture2D(to, pto), reflection * mix(1.0, 0.0, pto.y));\n }\n return c;\n}\n \nvoid main() {\n vec2 p = gl_FragCoord.xy / resolution.xy;\nif (progress == 0.) {gl_FragColor = texture2D(to, p); return;}\n vec2 pfr = vec2(-1.), pto = vec2(-1.);\n \n float middleSlit = 2.0 * abs(p.x-0.5) - progress;\n if (middleSlit > 0.0) {\n  pfr = p + (p.x > 0.5 ? -1.0 : 1.0) * vec2(0.5*progress, 0.0);\n  float d = 1.0/(1.0+perspective*progress*(1.0-middleSlit));\n  pfr.y -= d/2.;\n  pfr.y *= d;\n  pfr.y += d/2.;\n }\n \n float size = mix(1.0, depth, 1.-progress);\n pto = (p + vec2(-0.5, -0.5)) * vec2(size, size) + vec2(0.5, 0.5);\n \n if (inBounds(pfr)) {\n  gl_FragColor = texture2D(from, pfr);\n }\n else if (inBounds(pto)) {\n  gl_FragColor = texture2D(to, pto);\n }\n else {\n  gl_FragColor = bgColor(p, pto);\n }\n}"
  },
  'PAGE_CURL': {
    "name": "Page Curl",
    "icon": "page_curl",
    "duration": "1000",
    "uniforms": {},
    "frag": "#ifdef GL_ES\nprecision highp float;\n#endif\nuniform sampler2D from, to;\nuniform float progress;\nuniform vec2 resolution;\n\n// Adapted by Sergey Kosarevsky from:\n// http://rectalogic.github.io/webvfx/examples_2transition-shader-pagecurl_8html-example.html\n\n/*\nCopyright (c) 2010 Hewlett-Packard Development Company, L.P. All rights reserved.\n\nRedistribution and use in source and binary forms, with or without\nmodification, are permitted provided that the following conditions are\nmet:\n\n  * Redistributions of source code must retain the above copyright\n   notice, this list of conditions and the following disclaimer.\n  * Redistributions in binary form must reproduce the above\n   copyright notice, this list of conditions and the following disclaimer\n   in the documentation and/or other materials provided with the\n   distribution.\n  * Neither the name of Hewlett-Packard nor the names of its\n   contributors may be used to endorse or promote products derived from\n   this software without specific prior written permission.\n\nTHIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS\n\"AS IS\" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT\nLIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR\nA PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT\nOWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,\nSPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT\nLIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,\nDATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY\nTHEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT\n(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE\nOF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.\nin vec2 texCoord;\n*/\n\nconst float MIN_AMOUNT = -0.16;\nconst float MAX_AMOUNT = 1.3;\nfloat amount = progress * (MAX_AMOUNT - MIN_AMOUNT) + MIN_AMOUNT;\n\nconst float PI = 3.141592653589793;\n\nconst float scale = 512.0;\nconst float sharpness = 3.0;\n\nfloat cylinderCenter = amount;\n// 360 degrees * amount\nfloat cylinderAngle = 2.0 * PI * amount;\n\nconst float cylinderRadius = 1.0 / PI / 2.0;\n\nvec3 hitPoint(float hitAngle, float yc, vec3 point, mat3 rrotation)\n{\n\tfloat hitPoint = hitAngle / (2.0 * PI);\n\tpoint.y = hitPoint;\n\treturn rrotation * point;\n}\n\nvec4 antiAlias(vec4 color1, vec4 color2, float distanc)\n{\n\tdistanc *= scale;\n\tif (distanc < 0.0) return color2;\n\tif (distanc > 2.0) return color1;\n\tfloat dd = pow(1.0 - distanc / 2.0, sharpness);\n\treturn ((color2 - color1) * dd) + color1;\n}\n\nfloat distanceToEdge(vec3 point)\n{\n\tfloat dx = abs(point.x > 0.5 ? 1.0 - point.x : point.x);\n\tfloat dy = abs(point.y > 0.5 ? 1.0 - point.y : point.y);\n\tif (point.x < 0.0) dx = -point.x;\n\tif (point.x > 1.0) dx = point.x - 1.0;\n\tif (point.y < 0.0) dy = -point.y;\n\tif (point.y > 1.0) dy = point.y - 1.0;\n\tif ((point.x < 0.0 || point.x > 1.0) && (point.y < 0.0 || point.y > 1.0)) return sqrt(dx * dx + dy * dy);\n\treturn min(dx, dy);\n}\n\nvec4 seeThrough(float yc, vec2 p, mat3 rotation, mat3 rrotation)\n{\n\tfloat hitAngle = PI - (acos(yc / cylinderRadius) - cylinderAngle);\n\tvec3 point = hitPoint(hitAngle, yc, rotation * vec3(p, 1.0), rrotation);\n\tif (yc <= 0.0 && (point.x < 0.0 || point.y < 0.0 || point.x > 1.0 || point.y > 1.0))\n\t{\n\t vec2 texCoord = gl_FragCoord.xy / resolution.xy;\n\t\treturn texture2D(to, texCoord);\n\t}\n\n\tif (yc > 0.0) return texture2D(from, p);\n\n\tvec4 color = texture2D(from, point.xy);\n\tvec4 tcolor = vec4(0.0);\n\n\treturn antiAlias(color, tcolor, distanceToEdge(point));\n}\n\nvec4 seeThroughWithShadow(float yc, vec2 p, vec3 point, mat3 rotation, mat3 rrotation)\n{\n\tfloat shadow = distanceToEdge(point) * 30.0;\n\tshadow = (1.0 - shadow) / 3.0;\n\n\tif (shadow < 0.0) shadow = 0.0; else shadow *= amount;\n\n\tvec4 shadowColor = seeThrough(yc, p, rotation, rrotation);\n\tshadowColor.r -= shadow;\n\tshadowColor.g -= shadow;\n\tshadowColor.b -= shadow;\n\n\treturn shadowColor;\n}\n\nvec4 backside(float yc, vec3 point)\n{\n\tvec4 color = texture2D(from, point.xy);\n\tfloat gray = (color.r + color.b + color.g) / 15.0;\n\tgray += (8.0 / 10.0) * (pow(1.0 - abs(yc / cylinderRadius), 2.0 / 10.0) / 2.0 + (5.0 / 10.0));\n\tcolor.rgb = vec3(gray);\n\treturn color;\n}\n\nvec4 behindSurface(float yc, vec3 point, mat3 rrotation)\n{\n\tfloat shado = (1.0 - ((-cylinderRadius - yc) / amount * 7.0)) / 6.0;\n\tshado *= 1.0 - abs(point.x - 0.5);\n\n\tyc = (-cylinderRadius - cylinderRadius - yc);\n\n\tfloat hitAngle = (acos(yc / cylinderRadius) + cylinderAngle) - PI;\n\tpoint = hitPoint(hitAngle, yc, point, rrotation);\n\n\tif (yc < 0.0 && point.x >= 0.0 && point.y >= 0.0 && point.x <= 1.0 && point.y <= 1.0 && (hitAngle < PI || amount > 0.5))\n\t{\n\t\tshado = 1.0 - (sqrt(pow(point.x - 0.5, 2.0) + pow(point.y - 0.5, 2.0)) / (71.0 / 100.0));\n\t\tshado *= pow(-yc / cylinderRadius, 3.0);\n\t\tshado *= 0.5;\n\t}\n\telse\n\t{\n\t\tshado = 0.0;\n\t}\n\t\n\tvec2 texCoord = gl_FragCoord.xy / resolution.xy;\n\n\treturn vec4(texture2D(to, texCoord).rgb - shado, 1.0);\n}\n\nvoid main()\n{\n vec2 texCoord = gl_FragCoord.xy / resolution.xy;\n \n const float angle = 30.0 * PI / 180.0;\n\tfloat c = cos(-angle);\n\tfloat s = sin(-angle);\n\n\tmat3 rotation = mat3( c, s, 0,\n\t\t\t\t\t\t\t\t-s, c, 0,\n\t\t\t\t\t\t\t\t0.12, 0.258, 1\n\t\t\t\t\t\t\t\t);\n\tc = cos(angle);\n\ts = sin(angle);\n\n\tmat3 rrotation = mat3(\tc, s, 0,\n\t\t\t\t\t\t\t\t\t-s, c, 0,\n\t\t\t\t\t\t\t\t\t0.15, -0.5, 1\n\t\t\t\t\t\t\t\t);\n\n\tvec3 point = rotation * vec3(texCoord, 1.0);\n\n\tfloat yc = point.y - cylinderCenter;\n\n\tif (yc < -cylinderRadius)\n\t{\n\t\t// Behind surface\n\t\tgl_FragColor = behindSurface(yc, point, rrotation);\n\t\treturn;\n\t}\n\n\tif (yc > cylinderRadius)\n\t{\n\t\t// Flat surface\n\t\tgl_FragColor = texture2D(from, texCoord);\n\t\treturn;\n\t}\n\n\tfloat hitAngle = (acos(yc / cylinderRadius) + cylinderAngle) - PI;\n\n\tfloat hitAngleMod = mod(hitAngle, 2.0 * PI);\n\tif ((hitAngleMod > PI && amount < 0.5) || (hitAngleMod > PI/2.0 && amount < 0.0))\n\t{\n\t\tgl_FragColor = seeThrough(yc, texCoord, rotation, rrotation);\n\t\treturn;\n\t}\n\n\tpoint = hitPoint(hitAngle, yc, point, rrotation);\n\n\tif (point.x < 0.0 || point.y < 0.0 || point.x > 1.0 || point.y > 1.0)\n\t{\n\t\tgl_FragColor = seeThroughWithShadow(yc, texCoord, point, rotation, rrotation);\n\t\treturn;\n\t}\n\n\tvec4 color = backside(yc, point);\n\n\tvec4 otherColor;\n\tif (yc < 0.0)\n\t{\n\t\tfloat shado = 1.0 - (sqrt(pow(point.x - 0.5, 2.0) + pow(point.y - 0.5, 2.0)) / 0.71);\n\t\tshado *= pow(-yc / cylinderRadius, 3.0);\n\t\tshado *= 0.5;\n\t\totherColor = vec4(0.0, 0.0, 0.0, shado);\n\t}\n\telse\n\t{\n\t\totherColor = texture2D(from, texCoord);\n\t}\n\n\tcolor = antiAlias(color, otherColor, cylinderRadius - abs(yc));\n\n\tvec4 cl = seeThroughWithShadow(yc, texCoord, point, rotation, rrotation);\n\tfloat dist = distanceToEdge(point);\n\n\tgl_FragColor = antiAlias(color, cl, dist);\n}"
  },
  'SLIDE': {
    "name": "Slide",
    "icon": "slide",
    "duration": "1000",
    "uniforms": {
      "translateX": 1,
      "translateY": 0
    },
    "frag": "// Converted from https://github.com/rectalogic/rendermix-basic-effects/blob/master/assets/com/rendermix/Slide/Slide.frag\n\n#ifdef GL_ES\nprecision highp float;\n#endif\nuniform sampler2D from, to;\nuniform float progress;\nuniform vec2 resolution;\n\n// Slide Down: translateX = 0, translateY = -1\n// Slide Left: translateX = -1, translateY = 0\n// Slide Right: translateX = 1, translateY = 0\n// Slide Up: translateX = 0, translateY = 1\nuniform float translateX;\nuniform float translateY;\n\nvoid main() {\n  vec2 texCoord = gl_FragCoord.xy / resolution.xy;\n  float x = progress * translateX;\n  float y = progress * translateY;\n\n  if (x >= 0.0 && y >= 0.0) {\n    if (texCoord.x >= x && texCoord.y >= y) {\n      gl_FragColor = texture2D(from, texCoord - vec2(x, y));\n    }\n    else {\n      vec2 uv;\n      if (x > 0.0)\n        uv = vec2(x - 1.0, y);\n      else if (y > 0.0)\n        uv = vec2(x, y - 1.0);\n      gl_FragColor = texture2D(to, texCoord - uv);\n    }\n  }\n  else if (x <= 0.0 && y <= 0.0) {\n    if (texCoord.x <= (1.0 + x) && texCoord.y <= (1.0 + y))\n      gl_FragColor = texture2D(from, texCoord - vec2(x, y));\n    else {\n      vec2 uv;\n      if (x < 0.0)\n        uv = vec2(x + 1.0, y);\n      else if (y < 0.0)\n        uv = vec2(x, y + 1.0);\n      gl_FragColor = texture2D(to, texCoord - uv);\n    }\n  }\n  else\n    gl_FragColor = vec4(0.0);\n}"
  },
  'MOSAIC': {
    "name": "Mosaic",
    "icon": "mosaic",
    "duration": "1000",
    "uniforms": {
      "endx": 0,
      "endy": -1
    },
    "frag": "#ifdef GL_ES\nprecision highp float;\n#endif\n#define PI 3.14159265358979323\n#define POW2(X) X*X\n#define POW3(X) X*X*X\nuniform sampler2D from, to;\nuniform float progress;\nuniform vec2 resolution;\nuniform int endx;\nuniform int endy;\n\nfloat Rand(vec2 v) {\n return fract(sin(dot(v.xy ,vec2(12.9898,78.233))) * 43758.5453);\n}\nvec2 Rotate(vec2 v, float a) {\n mat2 rm = mat2(cos(a), -sin(a),\n         sin(a), cos(a));\n return rm*v;\n}\nfloat CosInterpolation(float x) {\n return -cos(x*PI)/2.+.5;\n}\nvoid main() {\n vec2 p = gl_FragCoord.xy / resolution.xy - .5;\n vec2 rp = p;\n float rpr = (progress*2.-1.);\n float z = -(rpr*rpr*2.) + 3.;\n float az = abs(z);\n rp *= az;\n rp += mix(vec2(.5, .5), vec2(float(endx) + .5, float(endy) + .5), POW2(CosInterpolation(progress)));\n vec2 mrp = mod(rp, 1.);\n vec2 crp = rp;\n bool onEnd = int(floor(crp.x))==endx&&int(floor(crp.y))==endy;\n if(!onEnd) {\n  float ang = float(int(Rand(floor(crp))*4.))*.5*PI;\n  mrp = vec2(.5) + Rotate(mrp-vec2(.5), ang);\n }\n if(onEnd || Rand(floor(crp))>.5) {\n  gl_FragColor = texture2D(to, mrp);\n } else {\n  gl_FragColor = texture2D(from, mrp);\n }\n}"
  },
  'SIMPLE_FLIP': {
    "name": "Simple Flip",
    "icon": "simple_flip",
    "duration": "1000",
    "uniforms": {},
    "frag": "#ifdef GL_ES\nprecision highp float;\n#endif\nuniform sampler2D from, to;\nuniform float progress;\nuniform vec2 resolution;\n\nvoid main() {\n vec2 p = gl_FragCoord.xy / resolution.xy;\n vec2 q = p;\n p.x = (p.x - 0.5)/abs(progress - 0.5)*0.5 + 0.5;\n vec4 a = texture2D(from, p);\n vec4 b = texture2D(to, p);\n gl_FragColor = vec4(mix(a, b, step(0.5, progress)).rgb * step(abs(q.x - 0.5), abs(progress - 0.5)), 1.0);\n}"
  },
  'SQUARE_SWIPE': {
    "name": "square swipe",
    "icon": "square_swipe",
    "duration": "1000",
    "uniforms": {
      "squares": [
        10,
        10
      ],
      "direction": [
        1,
        -0.5
      ],
      "smoothness": 1.6
    },
    "frag": "#ifdef GL_ES\nprecision highp float;\n#endif\nuniform sampler2D from, to;\nuniform float progress;\nuniform vec2 resolution;\n\nuniform ivec2 squares;\nuniform vec2 direction;\nuniform float smoothness;\n\nconst vec2 center = vec2(0.5, 0.5);\n\nvoid main() {\n vec2 p = gl_FragCoord.xy / resolution.xy;\nif (progress == 0.) { gl_FragColor = texture2D(from, p);return;} if (progress == 1.) {gl_FragColor = texture2D(to, p);return;}\n vec2 v = normalize(direction);\n if (v != vec2(0.0))\n  v /= abs(v.x)+abs(v.y);\n float d = v.x * center.x + v.y * center.y;\n float offset = smoothness;\n float pr = smoothstep(-offset, 0.0, v.x * p.x + v.y * p.y - (d-0.5+progress*(1.+offset)));\n vec2 squarep = fract(p*vec2(squares));\n vec2 squaremin = vec2(pr/2.0);\n vec2 squaremax = vec2(1.0 - pr/2.0);\n float a = all(lessThan(squaremin, squarep)) && all(lessThan(squarep, squaremax)) ? 1.0 : 0.0;\n gl_FragColor = mix(texture2D(from, p), texture2D(to, p), a);\n}"
  },
  'DREAMY': {
    "name": "Dreamy",
    "icon": "dreamy",
    "duration": "1000",
    "uniforms": {},
    "frag": "#ifdef GL_ES\nprecision highp float;\n#endif\nuniform sampler2D from, to;\nuniform float progress;\nuniform vec2 resolution;\n\nvec2 offset(float progress, float x, float theta) {\n float phase = progress*progress + progress + theta;\n float shifty = 0.03*progress*cos(10.0*(progress+x));\n return vec2(0, shifty);\n}\n\nvoid main() {\n vec2 p = gl_FragCoord.xy / resolution.xy;\n gl_FragColor = mix(texture2D(from, p + offset(progress, p.x, 0.0)), texture2D(to, p + offset(1.0-progress, p.x, 3.14)), progress);\n}"
  },
  'FOLD': {
    "name": "Fold",
    "icon": "fold",
    "duration": "1000",
    "uniforms": {},
    "frag": "#ifdef GL_ES\nprecision highp float;\n#endif\nuniform sampler2D from, to;\nuniform float progress;\nuniform vec2 resolution;\n\nvoid main() {\n vec2 p = gl_FragCoord.xy / resolution.xy;\n vec4 a = texture2D(from, (p - vec2(progress, 0.0)) / vec2(1.0-progress, 1.0));\n vec4 b = texture2D(to, p / vec2(progress, 1.0));\n gl_FragColor = mix(a, b, step(p.x, progress));\n}"
  },
  'SQUEEZE': {
    "name": "squeeze",
    "icon": "squeeze",
    "duration": "1000",
    "uniforms": {
      "colorSeparation": 0.02
    },
    "frag": "#ifdef GL_ES\nprecision highp float;\n#endif\n \n// General parameters\nuniform sampler2D from;\nuniform sampler2D to;\nuniform float progress;\nuniform vec2 resolution;\n \nuniform float colorSeparation;\n \nfloat progressY (float y) {\n return 0.5 + (y-0.5) / (1.0-progress);\n}\n \nvoid main() {\n vec2 p = gl_FragCoord.xy / resolution.xy;\n \n float y = progressY(p.y);\n if (y < 0.0 || y > 1.0) {\n  gl_FragColor = texture2D(to, p);\n }\n else {\n  vec2 fp = vec2(p.x, y);\n  vec3 c = vec3(\n   texture2D(from, fp - progress*vec2(0.0, colorSeparation)).r,\n   texture2D(from, fp).g,\n   texture2D(from, fp + progress*vec2(0.0, colorSeparation)).b\n  );\n  gl_FragColor = vec4(c, 1.0);\n }\n}"
  },
  'CIRCLE_OPEN': {
    "name": "Circle Open",
    "icon": "circle_open",
    "duration": "1000",
    "uniforms": {
      "smoothness": 0.3,
      "opening": true
    },
    "frag": "#ifdef GL_ES\nprecision highp float;\n#endif\n \n// General parameters\nuniform sampler2D from;\nuniform sampler2D to;\nuniform float progress;\nuniform vec2 resolution;\n \nuniform float smoothness;\nuniform bool opening;\n \nconst vec2 center = vec2(0.5, 0.5);\nconst float SQRT_2 = 1.414213562373;\n \nvoid main() {\n vec2 p = gl_FragCoord.xy / resolution.xy;\n float x = opening ? progress : 1.-progress;\n float m = smoothstep(-smoothness, 0.0, SQRT_2*distance(center, p) - x*(1.+smoothness));\n gl_FragColor = mix(texture2D(from, p), texture2D(to, p), opening ? 1.-m : m);\n}"
  },
  'RIPPLE': {
    "name": "ripple",
    "icon": "ripple",
    "duration": "1000",
    "uniforms": {
      "amplitude": 100,
      "speed": 50
    },
    "frag": "#ifdef GL_ES\nprecision highp float;\n#endif\n \n// General parameters\nuniform sampler2D from;\nuniform sampler2D to;\nuniform float progress;\nuniform vec2 resolution;\n \nuniform float amplitude;\nuniform float speed;\n \nvoid main()\n{\n vec2 p = gl_FragCoord.xy / resolution.xy;\n vec2 dir = p - vec2(.5);\n float dist = length(dir);\n vec2 offset = dir * (sin(progress * dist * amplitude - progress * speed) + .5) / 30.;\n gl_FragColor = mix(texture2D(from, p + offset), texture2D(to, p), smoothstep(0.2, 1.0, progress));\n}"
  },
});

export default GL.createComponent(({width, height, progress, transition, children}) => <GL.Node
    shader={shaders[transition]}
    width={width}
    height={height}
    uniforms={{
      progress,
      resolution:[width, height],
      ...shaders[transition].uniforms
    }}>
      {children}
    </GL.Node>);
