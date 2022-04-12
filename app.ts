
import { AnimationLoop, Model } from '@luma.gl/engine';
import { Buffer, clear } from '@luma.gl/webgl';

const INFO_HTML = `
Instanced triangles using luma.gl's high-level API
`;

const colorShaderModule = {
  name: 'color',
  vs: `
    varying vec3 color_vColor;
    varying vec2 center;

    void color_setColor(vec3 color) {
      color_vColor = color;
    }
    void setCenter(vec2 c) {
      center = c;
    }
  `,
  fs: `
    varying vec3 color_vColor;
    varying vec2 center;

    vec3 color_getColor() {
      return color_vColor;
    }
    vec2 getCenter() {
      return center;
    }
  `
};

export default class AppAnimationLoop extends AnimationLoop {
  constructor() {
    super({ debug: true });
  }

  static getInfo() {
    return INFO_HTML;
  }

  onInitialize({ gl }) {
    const instanceSize = 0.1;
    const vertexBuffer = new Buffer(gl, new Float32Array(
      [-0.1, -0.1,
        0.1, -0.1,
        0.1, 0.1,
      -0.1, -0.1,
        0.1, 0.1,
      -0.1, 0.1
      ]));

    const instanceCount = 20;
    const radius = 0.1;

    const magic = 137.5 * Math.PI / 180;
    const c = 0.2;
    // const colorBuffer = new Buffer(
    //   gl,
    //   new Float32Array([1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 0.0])
    // );


    const offsetsData = new Array(instanceCount * 2);

    let colorsData = new Array(instanceCount * 3);

    for (let i = 0; i < instanceCount; i++) {

      const angle = magic * i;
      const r = c * Math.sqrt(i);

      const idx = i * 2;
      offsetsData[i * 2] = r * Math.cos(angle);
      offsetsData[i * 2 + 1] = r * Math.sin(angle);
      colorsData[i * 3] = 0.5;
      colorsData[i * 3 + 1] = 0.5;
      colorsData[i * 3 + 2] = 0.5;
    }

    const offsetBuffer = new Buffer(
      gl,
      new Float32Array(offsetsData)
    );

    const colorBuffer = new Buffer(
      gl,
      new Float32Array(colorsData)
    );

    const model = new Model(gl, {
      vs: `
        attribute vec2 position;
        attribute vec3 color;
        attribute vec2 offset;

        void main() {
          color_setColor(color);
          setCenter(position);
          gl_Position = vec4(position + offset, 0.0, 1.0);
        }
      `,
      fs: `
        void main() {
          float d = distance(getCenter(), gl_FragCoord.xy / 1000.0);
          gl_FragColor = vec4(d, d, d, 1.0);
        }
      `,
      modules: [colorShaderModule],
      attributes: {
        position: vertexBuffer,
        color: [colorBuffer, { divisor: 1 }],
        offset: [offsetBuffer, { divisor: 1 }]
      },
      vertexCount: 6,
      instanceCount: instanceCount,
      isInstanced: true
    });

    return { model, positionBuffer: vertexBuffer, colorBuffer, offsetBuffer };
  }

  onRender({ gl, model }) {
    clear(gl, { color: [0, 0, 0, 1] });
    model.draw();
  }

  onFinalize({ gl, model, positionBuffer, colorBuffer, offsetBuffer }) {
    model.delete();
    positionBuffer.delete();
    colorBuffer.delete();
    offsetBuffer.delete();
  }
}

// @ts-ignore
if (typeof window !== 'undefined' && !window.website) {
  const animationLoop = new AppAnimationLoop();
  animationLoop.start();
}
