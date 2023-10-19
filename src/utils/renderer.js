import { createScopedThreejs } from 'threejs-miniprogram';


var THREE;
var camera;
var scene;
var renderer;
var canvasWidth, canvasHeight;
var requestId;


// 初始化Three.js场景
function initThree(canvas) {
  THREE = createScopedThreejs(canvas);
  initScene()
}

// 初始化Three.js场景中的相机、光照和渲染器
function initScene() {
  camera = new THREE.OrthographicCamera(1, 1, 1, 1, -1000, 1000);
  // 设置相机属性
  canvasWidth = canvas.width
  canvasHeight = canvas.height
  setSize();
  scene = new THREE.Scene();
  // 添加环境光
  scene.add(new THREE.AmbientLight(0xffffff));
  // 添加定向光源
  var directionallight = new THREE.DirectionalLight(0xffffff, 1);
  directionallight.position.set(0, 0, 1000);
  scene.add(directionallight);

  // 初始化渲染器
  renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
  });
  const devicePixelRatio = wx.getSystemInfoSync().pixelRatio;
  console.log('device pixel ratio', devicePixelRatio);
  renderer.setPixelRatio(devicePixelRatio);
  renderer.setSize(canvas.width, canvas.height);
}


// 设置相机的视口大小
function setSize() {
  if (!camera) {
      return;
  }
  const w = canvasWidth;
  const h = canvasHeight;
  camera.left = -0.5 * w;
  camera.right = 0.5 * w;
  camera.top = 0.5 * h;
  camera.bottom = -0.5 * h;
  camera.updateProjectionMatrix();
}

function drawShape(vertices) {
  let vertice_array = []
  for (let i = 0;i < vertices.length;i++) {
    const cur = vertices[i]
    vertice_array = vertice_array.concat([cur.x / 1000, cur.y / 1000, cur.z / 1000])
  }

  const shape = new THREE.Shape();

}

// 动画循环
function animate() {
  requestId = canvas.requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// 停止动画
function stopAnimate() {
  if (canvas && requestId) {
      canvas.cancelAnimationFrame(requestId);
  }
}

// 释放资源
function dispose() {
  camera = null;
  scene = null;
  renderer = null;
  THREE = null;
  requestId = null;
  canvasWidth = null;
  canvasHeight = null;
}

// 导出相关函数和变量，以便在其他地方使用
export {
  initThree,
  stopAnimate,
  dispose,
}
