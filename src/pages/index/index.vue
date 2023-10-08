<template>
  <!-- Vue 3 模板部分 -->
  <view class="page">
    <view>
      <camera
        device-position="{{devicePosition}}"
        flash="off"
        frame-size="small"
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
import {
  initThree,
  stopAnimate,
  dispose,
  setModel
} from "@/utils/modelBusiness";

import * as tf_face from "@tensorflow-models/face-landmarks-detection";

const devicePosition = ref("front"); // 设备相机方向，默认为前置摄像头
const frameSize = ref({ width: 640, height: 480 }); // 帧的尺寸
let listener = null; // 相机监听器

const modelUrl = "https://m.sanyue.red/demo/gltf/sunglass.glb"; // 3D 模型的 URL
const cameraFrameMax = 3; // 相机帧的最大数量
const context = uni.createCameraContext(); // 创建相机上下文对象

// 启动人脸追踪
const startTracking = async () => {
  let count = 0;
  listener = context.onCameraFrame(async res => {
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

    // const model = await tf_face.load(
    //   tf_face.SupportedPackages.mediapipeFacemesh,
    //   {
    //     shouldLoadIrisModel: true
    //   }
    // );
    // const predictions = await model.estimateFaces({
    //   input: frame // 您的图像帧或视频帧
    // });

    // // 检测到的嘴唇关键点
    // const lipKeyPoints = predictions[0].annotations.lipsUpperInner.concat(
    //   predictions[0].annotations.lipsLowerInner
    // );
    
    // 使用 TensorFlow.js 进行人脸检测
    const result = await detect(frame);

    if (result && result.prediction) {
      const canvasWidth = frame.width;
      const canvasHeight = frame.height;
      setModel(result.prediction, canvasWidth, canvasHeight); // 更新 3D 模型的位置、旋转和缩放
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
  if (listener) {
    listener.stop();
  }
};

// 切换相机方向
const changeDirection = () => {
  devicePosition.value = devicePosition.value === "back" ? "front" : "back";
};

// 当组件被挂载时执行的操作
onMounted(async () => {
  loadModel().then(() => {
    uni.hideLoading();
    initThree("canvasWebGL", modelUrl); // 初始化 Three.js 场景
    startTracking(); // 启动人脸追踪
  });
});

// 当组件被卸载时执行的操作
onUnmounted(() => {
  stopTracking(); // 停止人脸追踪
  stopAnimate(); // 停止动画
  dispose(); // 释放资源
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
