<template>
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
import { ref, onMounted, onUnmounted } from "vue";
import { loadModel, detect } from "@/utils/faceBusiness";
import {
  initThree,
  stopAnimate,
  dispose,
  setModel
} from "@/utils/modelBusiness";

import * as tf_face from "@tensorflow-models/face-landmarks-detection";

const devicePosition = ref("front");
const frameSize = ref({ width: 640, height: 480 });
let listener = null;

const modelUrl = "https://m.sanyue.red/demo/gltf/sunglass.glb";
// const modelUrl = 'cloud://makeup-8gv7cr62279c77b1.6d61-makeup-8gv7cr62279c77b1-1321468729/model/facemesh/model.json'
const cameraFrameMax = 3;
const context = uni.createCameraContext();

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

    const result = await detect(frame);

    if (result && result.prediction) {
      const canvasWidth = frame.width;
      const canvasHeight = frame.height;
      // console.log(result.prediction, canvasWidth, canvasHeight)
      setModel(result.prediction, canvasWidth, canvasHeight);
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

const stopTracking = () => {
  if (listener) {
    listener.stop();
  }
};

const changeDirection = () => {
  devicePosition.value = devicePosition.value === "back" ? "front" : "back";
};

onMounted(async () => {
  // const model = await tf_face.load(
  //   tf_face.SupportedPackages.mediapipeFacemesh,
  //   {
  //     //detectorModelUrl:'https://tfhub.dev/mediapipe/tfjs-model/facemesh/1/default/1',
  //     detectorModelUrl:
  //       "https://6d61-makeup-8gv7cr62279c77b1-1321468729.tcb.qcloud.la/model/facemesh/model.json?sign=a44b997deb096395da1b70c09650d685&t=1696751655",
  //     //irisModelUrl:'https://tfhub.dev/mediapipe/tfjs-model/iris/1/default/2',
  //     irisModelUrl:
  //       "https://6d61-makeup-8gv7cr62279c77b1-1321468729.tcb.qcloud.la/model/iris/model.json?sign=38f8db2df09c4d6d381068ed4767556e&t=1696751497",
  //     //modelUrl:'https://tfhub.dev/tensorflow/tfjs-model/blazeface/1/default/1'
  //     modelUrl:
  //       "https://6d61-makeup-8gv7cr62279c77b1-1321468729.tcb.qcloud.la/model/blazeface/model.json?sign=69a64281c4efc23d504c3d8fd2f5860b&t=1696751631"
  //   }
  // );
  // console.log("===============", model);
  // model.estimateFaces({
  //   input: context//document.querySelector("video")
  // })
  loadModel().then(() => {
    uni.hideLoading();
    initThree("canvasWebGL", modelUrl);
    startTracking();
  });
});

onUnmounted(() => {
  stopTracking();
  stopAnimate();
  dispose();
});
</script>

<style>
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
