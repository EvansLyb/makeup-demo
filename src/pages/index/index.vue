<template>
  <view class="page">
    <view>
      <camera
        id="camera"
        device-position="front"
        resolution="low"
        flash="off"
        frame-size="low"
        binderror="error"
      >
        <canvas
          id="canvasWebGL"
          class="canvasWebGL"
          type="webgl"
          disable-scroll="true"
        >
        </canvas>
      </camera>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { loadModel, detect } from "@/utils/faceBusiness";

const frameSize = ref({ width: 640, height: 480 }); // 帧的尺寸
let listener = null; // 相机监听器

const cameraFrameMax = 3; // 相机帧的最大数量
const camera = uni.createCameraContext(); // 创建相机上下文对象
let gl = null; // WebGL实例

const getGl = () => {
  return new Promise((resolve, reject) => {
    wx.createSelectorQuery()
    .select('#canvasWebGL')
    .node()
    .exec((res) => {
      const canvas = res[0].node
      console.log('canvas', canvas)
      gl = canvas.getContext('webgl', {
        premultipliedAlpha: true,
        alpha: true
      })
      if (!gl) {
        console.error('webgl未受支持')
        reject()
      }

      resolve()

      // // 检查所有支持的扩展
      // const available_extensions = gl.getSupportedExtensions();
      // console.log('available_extensions', available_extensions)
    })
  })
}


const VShader = `
  attribute vec4 a_Position;
  void main() {
    gl_Position = a_Position;
  }
`
const FShader = `
  precision mediump float;

  void main() {
    vec3 base = vec3(1.0, 0.0, 0.0);
    vec3 blend = vec3(0.333, 0.333, 0.333);
    float op = 0.268;
    vec3 blendMultiply = (base * blend * op) + base * (1.0 - op);

    gl_FragColor = vec4(blendMultiply, 0.5);
  }
`

const loadShader = (gl, type, source) => {
  const shader = gl.createShader(type)
  if (shader === null) {
    console.error('unable to create shader')
    return null
  }

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
  if (!compiled) {
    gl.getShaderInfoLog(shader)
    console.error('Failed to compile shader')
    gl.deleteShader(shader)
    return null
  }

  return shader
}
const createGlProgram = () => {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, VShader)
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, FShader)
  if (!vertexShader || !fragmentShader) {
    return null
  }

  const program = gl.createProgram()
  if (!program) {
    return null
  }

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)

  gl.linkProgram(program)
  const linked = gl.getProgramParameter(program, gl.LINK_STATUS)
  if (!linked) {
    const error = gl.getProgramInfoLog(program)
    console.error('Failed to link program: ', error)
    gl.deleteProgram(program)
    gl.deleteShader(fragmentShader)
    gl.deleteShader(vertexShader)
    return null
  }
  gl.useProgram(program)
  gl.program = program
}

const draw = (vertices) => {
  let vertice_array = []

  // 设置顶点坐标数据
  for (let i = 0;i < vertices.length;i++) {
    /**
     * 关于z坐标
     * z-coordinate: estimation of AI divided by amount of columns (frame width)
     * link: https://github.com/google/mediapipe/issues/1895
     */
    const cur = vertices[i]
    vertice_array = vertice_array.concat([(cur.x - 240) / 240, (cur.y - 320) / -320, cur.z / 240])
  }

  // 将顶点坐标数据传入缓冲区
  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertice_array), gl.STATIC_DRAW)

  // 获取顶点着色器中的变量位置
  const positionAttributeLocation = gl.getAttribLocation(gl.program, 'a_Position')

  // 启用顶点属性
  gl.enableVertexAttribArray(positionAttributeLocation)

  // 将缓冲区中的数据传入顶点着色器
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0)

  // 清空画布
  gl.clearColor(1.0, 1.0, 1.0, 0.0)
  gl.clear(gl.COLOR_BUFFER_BIT)

  // gl.drawArrays(gl.TRIANGLES, 0, 3)
  // gl.drawArrays(gl.TRIANGLES, 0, 25)
  gl.drawArrays(gl.TRIANGLES, 0, (vertice_array.length / 3))
}

const setLipsColor = ({ keypoints }) => {
  const bottom_lips = [
    61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 292, 308, 324, 318, 402,
    317, 14, 87, 178, 88, 95, 78, 62, 61
  ]; //下
  const top_lips = [
    61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 292, 308, 415, 310, 311,
    312, 13, 82, 81, 80, 191, 78, 62, 61
  ]; //上
  const topListTangle = [
    61,
    185,
    184,
    61,
    184,
    76,
    76,
    184,
    183,
    76,
    183,
    62,
    62,
    183,
    191,
    62,
    191,
    78,
    185,
    40,
    74,
    185,
    74,
    184,
    184,
    74,
    42,
    184,
    42,
    183,
    183,
    42,
    80,
    183,
    80,
    191,
    40,
    39,
    73,
    40,
    73,
    74,
    74,
    73,
    41,
    74,
    41,
    42,
    42,
    41,
    81,
    42,
    81,
    80,
    39,
    37,
    72,
    39,
    72,
    73,
    73,
    72,
    38,
    73,
    38,
    41,
    41,
    38,
    82,
    41,
    82,
    81,
    37,
    0,
    11,
    37,
    11,
    72,
    72,
    11,
    12,
    72,
    12,
    38,
    38,
    12,
    13,
    38,
    13,
    82,
    0,
    267,
    302,
    0,
    302,
    11,
    11,
    302,
    268,
    11,
    268,
    12,
    12,
    268,
    312,
    12,
    312,
    13,
    267,
    269,
    303,
    267,
    303,
    302,
    302,
    303,
    271,
    302,
    271,
    268,
    268,
    271,
    311,
    268,
    311,
    312,
    269,
    270,
    304,
    269,
    304,
    303,
    303,
    304,
    272,
    303,
    272,
    271,
    271,
    272,
    310,
    271,
    310,
    311,
    270,
    409,
    408,
    270,
    408,
    304,
    304,
    408,
    407,
    304,
    407,
    272,
    272,
    407,
    415,
    272,
    415,
    310,
    409,
    291,
    306,
    409,
    306,
    408,
    408,
    306,
    292,
    408,
    292,
    407,
    407,
    292,
    308,
    407,
    308,
    415
  ];
  const bottomListTangle = [
    78,
    95,
    96,
    78,
    96,
    62,
    62,
    96,
    77,
    62,
    77,
    76,
    76,
    77,
    146,
    76,
    146,
    61,
    95,
    88,
    89,
    95,
    89,
    96,
    96,
    89,
    90,
    96,
    90,
    77,
    77,
    90,
    91,
    77,
    91,
    146,
    88,
    178,
    179,
    88,
    179,
    89,
    89,
    179,
    180,
    89,
    180,
    90,
    90,
    180,
    181,
    90,
    181,
    91,
    178,
    87,
    86,
    178,
    86,
    179,
    179,
    86,
    85,
    179,
    85,
    180,
    180,
    85,
    84,
    180,
    84,
    181,
    87,
    14,
    15,
    87,
    15,
    86,
    86,
    15,
    16,
    86,
    16,
    85,
    85,
    16,
    17,
    85,
    17,
    84,
    14,
    317,
    316,
    14,
    316,
    15,
    15,
    316,
    315,
    15,
    315,
    16,
    16,
    315,
    314,
    16,
    314,
    17,
    317,
    402,
    403,
    317,
    403,
    316,
    316,
    403,
    404,
    316,
    404,
    315,
    315,
    404,
    405,
    315,
    405,
    314,
    402,
    318,
    319,
    402,
    319,
    403,
    403,
    319,
    320,
    403,
    320,
    404,
    404,
    320,
    321,
    404,
    321,
    405,
    318,
    324,
    325,
    318,
    325,
    319,
    319,
    325,
    307,
    319,
    307,
    320,
    320,
    307,
    375,
    320,
    375,
    321,
    324,
    308,
    292,
    324,
    292,
    325,
    325,
    292,
    306,
    325,
    306,
    307,
    307,
    306,
    291,
    307,
    291,
    375
  ]

  const bottom_points = bottomListTangle.map(idx => keypoints[idx]);
  const top_points = topListTangle.map(idx => keypoints[idx]);

  draw(top_points.concat(bottom_points))
};

// 启动人脸追踪
const startTracking = async () => {
  let count = 0;
  console.log("startTracking")
  listener = camera.onCameraFrame(async res => {
    if (count < cameraFrameMax) {
      count++;
      return;
    }
    count = 0;

    const frame = {
      data: new Uint8Array(res.data),
      width: res.width,
      height: res.height
    };

    // 使用 TensorFlow.js 进行人脸检测
    const result = await detect(frame);

    if (result && result.face) {
      setLipsColor(result.face)
    } else {
      const message = "No results.";
      uni.showToast({
        title: message,
        icon: "none"
      });
    }
  });

  listener.start();
};

// 停止人脸追踪
const stopTracking = () => {
  listener && listener.stop()
};

// 当组件被挂载时执行的操作
onMounted(async () => {
  await loadModel()
  await getGl()
  createGlProgram()
  startTracking(); // 启动人脸追踪
});

// 当组件被卸载时执行的操作
onUnmounted(() => {
  stopTracking(); // 停止人脸追踪
});
</script>

<style>
camera {
  width: 375px;
  height: 500px;
  z-index: 1;
  margin: auto;
}
.canvasWebGL {
  width: 100%;
  height: 100%;
  z-index: 3;
  margin: auto;
}
</style>
