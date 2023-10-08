// 引入必要的模块和函数
import { createScopedThreejs } from 'threejs-miniprogram';
import { registerGLTFLoader } from './GLTFLoader.js';

// 初始化缩放因子
const initScale = 0.19;

// 定义用于跟踪面部关键点的索引
const trackPointA = 168;
const trackPointB = 122;
const trackPointC = 351;

// 声明全局变量
var camera, scene, renderer;
var canvas;
var THREE;
var mainModel, requestId;
var canvasWidth, canvasHeight;

// 初始化Three.js场景
function initThree(canvasId, modelUrl) {
    wx.createSelectorQuery()
        .select('#' + canvasId)
        .node()
        .exec((res) => {
            canvas = res[0].node;
            THREE = createScopedThreejs(canvas);

            initScene();
            loadModel(modelUrl);
        });
}

// 初始化Three.js场景中的相机、光照和渲染器
function initScene() {
    camera = new THREE.OrthographicCamera(1, 1, 1, 1, -1000, 1000);
    // 设置相机属性
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

    // 启动动画循环
    animate();
}

// 加载3D模型
function loadModel(modelUrl) {
    registerGLTFLoader(THREE);
    var loader = new THREE.GLTFLoader();
    wx.showLoading({
        title: 'Loading 3D...',
    });
    loader.load(modelUrl,
        function (gltf) {
            console.log('loadModel', 'success');
            var model = gltf.scene;
            model.scale.setScalar(initScale);
            // 保存模型
            mainModel = model;
            scene.add(model);
            wx.hideLoading();
        },
        null,
        function (error) {
            console.log('loadModel', error);
            wx.hideLoading();
            wx.showToast({
                title: 'Loading model failed.',
                icon: 'none',
                duration: 3000,
            });
        });
}

// 更新3D模型
function updateModel(modelUrl) {
    var loader = new THREE.GLTFLoader();
    // 加载模型
    wx.showLoading({
        title: 'Loading 3D...',
    });
    loader.load(modelUrl,
        function (gltf) {
            console.log('updateModel', 'success');
            var model = gltf.scene;
            model.scale.setScalar(initScale);
            // 移除旧模型
            scene.remove(mainModel);
            // 保存新模型
            mainModel = model;
            // 添加新模型
            scene.add(model);
            wx.hideLoading();
        },
        null,
        function (error) {
            console.log('updateModel', error);
            wx.hideLoading();
            wx.showToast({
                title: 'Loading model failed.',
                icon: 'none',
                duration: 3000,
            });
        });

    wx.hideLoading();
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

// 设置3D模型的位置、旋转和缩放
function setModel(prediction, _canvasWidth, _canvasHeight) {
    if (!mainModel) {
        // 如果模型未加载，不执行任何操作
        return;
    }

    if (_canvasWidth !== canvasWidth) {
        canvasWidth = _canvasWidth;
        canvasHeight = _canvasHeight;
        setSize();
    }

    // 计算模型的位置、旋转和缩放信息
    const result = calcTriangle(prediction, trackPointA, trackPointB, trackPointC);

    // 应用计算结果到模型
    mainModel.rotation.setFromRotationMatrix(result.rotation);
    mainModel.position.copy(result.position);
    mainModel.scale.setScalar(initScale * result.scale);
}

// 获取特定关键点的位置
function getPosition(prediction, id) {
    var p = prediction.scaledMesh[id];
    var x = p[0] - 0.5 * canvasWidth;
    var y = 0.5 * canvasHeight - p[1];
    var z = p[2];
    return new THREE.Vector3(x, y, z);
}

// 计算缩放比例
function getScale(prediction, id1, id2) {
    var p1 = prediction.mesh[id1];
    var p1_scaled = prediction.scaledMesh[id1];
    var p2 = prediction.mesh[id2];
    var p2_scaled = prediction.scaledMesh[id2];

    var a = p2[0] - p1[0];
    var b = p2_scaled[0] - p1_scaled[0];
    return b / a;
}

// 计算三角形的位置、旋转和缩放
function calcTriangle(prediction, id0, id1, id2) {
    var p0 = getPosition(prediction, id0);
    var p1 = getPosition(prediction, id1);
    var p2 = getPosition(prediction, id2);

    // 创建一个三角形对象
    var triangle = new THREE.Triangle();
    triangle.set(p0, p1, p2);
    const center = new THREE.Vector3();
    triangle.getMidpoint(center);

    // 计算旋转矩阵
    const rotation = new THREE.Matrix4();
    const x = p1.clone().sub(p2).normalize();
    const y = p1.clone().sub(p0).normalize();
    const z = new THREE.Vector3().crossVectors(x, y);
    const y2 = new THREE.Vector3().crossVectors(x, z).normalize();
    const z2 = new THREE.Vector3().crossVectors(x, y2).normalize();
    rotation.makeBasis(x, y2, z2);

    // 计算缩放比例
    var scale = getScale(prediction, id1, id2);

    return {
        position: center,
        rotation: rotation,
        scale: scale,
    };
}

// 设置场景的背景
function setSceneBackground(frame) {
    var texture = new THREE.DataTexture(frame.data,
        frame.width,
        frame.height,
        THREE.RGBAFormat);
    texture.flipY = true;
    texture.needsUpdate = true;
    scene.background = texture;
}

// 清除场景背景
function clearSceneBackground() {
    scene.background = null;
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
    canvas = null;
    THREE = null;
    mainModel = null;
    requestId = null;
    canvasWidth = null;
    canvasHeight = null;
}

// 导出相关函数和变量，以便在其他地方使用
export {
    initThree,
    stopAnimate,
    updateModel,
    setModel,
    setSceneBackground,
    clearSceneBackground,
    dispose,
}
