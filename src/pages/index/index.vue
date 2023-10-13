<template>
  <!-- Vue 3 模板部分 -->
  <view class="page">
    <view>
      <camera
        id="camera"
        device-position="front"
        resolution="medium"
        flash="off"
        frame-size="medium"
        binderror="error"
      >
        <canvas
          id="canvasWebGL"
          class="canvasWebGL"
          type="webgl2"
          disable-scroll="true"
        >
        </canvas>
      </camera>
      <button type="default" bindtap="changeDirection" class="marginTop10">
        change camera direction
      </button>
    </view>
    <view class="page__bd page__bd_spacing"> </view>
  </view>
</template>

<script setup>
// 使用 Vue 3 的 script setup 语法来组织代码

import { ref, onMounted, onUnmounted } from "vue";
import { loadModel, detect } from "@/utils/faceBusiness";

const devicePosition = ref("front"); // 设备相机方向，默认为前置摄像头
const frameSize = ref({ width: 640, height: 480 }); // 帧的尺寸
let listener = null; // 相机监听器

const cameraFrameMax = 3; // 相机帧的最大数量
const camera = uni.createCameraContext(); // 创建相机上下文对象
const context = uni.createCanvasContext("canvasWebGL");

// const drawLine = (
//   lineArr = [],
//   lineWidth = 2,
//   color = "lime",
//   isFill = false
// ) => {
//   try {
//     context.beginPath();
//     context.lineCap = "round";
//     context.lineJoin = "round";
//     context.strokeStyle = color;
//     context.lineWidth = lineWidth;
//     lineArr.forEach((e, index) => {
//       if (index > 0) {
//         context.lineTo(e.x, e.y);
//       } else {
//         context.moveTo(e.x, e.y);
//       }
//     });
//     context.stroke();
//     context.closePath();
//     if (isFill) {
//       context.fillStyle = "blue";
//       context.fill();
//     }
//   } catch (err) {
//     console.log(err);
//   }
// };

const setLipsColor = keypoints => {
  const bottom_lips = [
    61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 292, 308, 324, 318, 402,
    317, 14, 87, 178, 88, 95, 78, 62, 61
  ]; //下
  const top_lips = [
    61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 292, 308, 415, 310, 311,
    312, 13, 82, 81, 80, 191, 78, 62, 61
  ]; //上
  const color = "#000000";
  const bottom_points = bottom_lips.map(idx => keypoints[idx]);
  const top_points = top_lips.map(idx => keypoints[idx]);
  // drawLine(bottom_points, 1, color, true);
  // drawLine(top_points, 1, color, true);
};

// 启动人脸追踪
const startTracking = async () => {
  let count = 0;
  console.log("startTracking")
  listener = camera.onCameraFrame(async res => {
    console.log("count", count)
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
    console.log("frame")
    console.log(frame)

    // 使用 TensorFlow.js 进行人脸检测
    const result = await detect(frame);
    
    console.log("result")
    console.log(result)

    if (result && result.face) {
      console.log('???')
    } else {
      const message = "No results.";
      // uni.showToast({
      //   title: message,
      //   icon: "none"
      // });
    }
  });

  listener.start();
  setTimeout(() => {
    listener.stop()
  }, 6000)
};

// 停止人脸追踪
const stopTracking = () => {
  if (listener) {
    listener.stop();
  }
};

// 切换相机方向
const changeDirection = () => {
  listener && listener.stop()
  // devicePosition.value = devicePosition.value === "back" ? "front" : "back";
};

// 当组件被挂载时执行的操作
onMounted(async () => {
  await loadModel()
  // uni.hideLoading();
  // initThree("canvasWebGL", modelUrl); // 初始化 Three.js 场景
  startTracking(); // 启动人脸追踪
});

// 当组件被卸载时执行的操作
onUnmounted(() => {
  stopTracking(); // 停止人脸追踪
  // stopAnimate(); // 停止动画
  // dispose(); // 释放资源
});
</script>

<style>
/* 样式部分，定义了页面的布局和相机的样式 */
.page__bd {
  padding-bottom: 0;
}
.page__bd_spacing {
  padding-top: 10px;
}
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
