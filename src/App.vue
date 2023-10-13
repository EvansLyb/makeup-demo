<script>
import { fetchFunc } from "fetch-wechat";
import * as tf from '@tensorflow/tfjs-core';
import * as fm from '@mediapipe/face_mesh'
import * as webgl from '@tensorflow/tfjs-backend-webgl';
const plugin = requirePlugin("tfjsPlugin");

const ENABLE_DEBUG = true;

export default {
  onLaunch: function () {
    plugin.configPlugin({
      // polyfill fetch function
      fetchFunc: fetchFunc(),
      // inject tfjs runtime
      tf,
      // inject webgl backend
      webgl,
      // provide webgl canvas
      canvas: wx.createOffscreenCanvas()
    }, ENABLE_DEBUG);
  },
  onShow: function () {
    console.log("App Show");
  },
  onHide: function () {
    console.log("App Hide");
  }
};
</script>

<style>
/*每个页面公共css */
</style>
<!-- https://tfhub.dev/mediapipe/tfjs-model/face_landmarks_detection/face_mesh/1/model.json?tfjs-format=file -->
<!-- https://tfhub.dev/mediapipe/tfjs-model/face_detection/short/1/model.json?tfjs-format=file -->
<!-- "iPad Simulator;iPhone Simulator;iPod Simulator;iPad;iPhone;iPod".split(";").includes(navigator.platform) || navigator.userAgent.includes("Mac") && "ontouchend" in document -->