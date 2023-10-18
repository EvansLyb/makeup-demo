<script>
import { fetchFunc } from "fetch-wechat";
import * as tf from '@tensorflow/tfjs-core';
import * as webgl from '@tensorflow/tfjs-backend-webgl';
const plugin = requirePlugin("tfjsPlugin");

const ENABLE_DEBUG = true;

export default {
  onLaunch: function () {
    /**
     * https://github.com/tensorflow/tfjs-wechat
     * 注意: 在微信开发者工具 v1.02.19070300 中，你需要在通用设置中打开硬件加速，从而在TensorFlow.js中启用WebGL加速。 
     * 更新说明
     * 0.0.2 plugin不再映射TensorFlow.js API库，由小程序端提供。
     * 0.0.3 使用offscreen canvas，小程序无需加入plugin component。
     * 0.0.5 修改例子程序使用tfjs分包来降低小程序大小。
     * 0.0.6 支持 tfjs-core版本1.2.7。
     * 0.0.7 允许用户设置webgl backend name, 这可以解决小程序offscreen canvas会失效的问题。
     * 0.0.8 加入localStorage支持，允许小于10M模型在localStorage内缓存。
     * 0.0.9 加入fileSystem支持，允许小于10M模型在local file system内缓存。fixed missing kernel bug.
     * 0.1.0 支持 tfjs版本2.0.x。
     * 0.2.0 支持 tfjs版本3.x。
     */
    /**
     * 优化参考资料:
     * - https://github.com/deepkolos/wxmp-tensorflow
     * - https://my.oschina.net/u/4662964/blog/4922850
     */
    plugin.configPlugin({
      // polyfill fetch function
      fetchFunc: fetchFunc(),
      // inject tfjs runtime
      tf,
      // inject webgl backend
      webgl,
      // provide webgl canvas
      canvas: wx.createOffscreenCanvas(),
      backendName: 'tfjs-backend'
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