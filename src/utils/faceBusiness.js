import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-backend-webgl';

const detectionConfidence = 0.8;
const maxFaces = 1;
var detector;

async function loadModel() {
  console.log('---')

  detector = await faceLandmarksDetection.createDetector(
    faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh, {
      runtime: 'tfjs',
      // solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
      detectorModelUrl: 'https://www.linkendtech.com/tfjs-model/detector/model.json',
      landmarkModelUrl: 'https://www.linkendtech.com/tfjs-model/landmark/model.json'
    }
  )
  // detector = await faceLandmarksDetection.createDetector(
  //   faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh, {
  //     runtime: 'mediapipe',
  //     solutionPath: '../../node_modules/@mediapipe/face_mesh',
  //   }
  // )
  // detector = await faceLandmarksDetection.load(
  //   faceLandmarksDetection.SupportedPackages.mediapipeFacemesh, {
  //     shouldLoadIrisModel: false,
  //     maxFaces: 1,
  //     modelUrl: 'https://www.linkendtech.com/tfjs-model/landmark/model.json'
  //   }
  // )
  console.log('facemesh model is loaded.');
}

async function detect(frame) {
  if (!detector) {
    console.log('facemesh model has not been loaded.');
    return;
  }

  try {
    // const faces = await detector.estimateFaces({
    //   input: frame,
    //   predictIrises: false,
    //   flipHorizontal: false
    // });
    const faces = await detector.estimateFaces(frame, {flipHorizontal: false})

    return { face: faces[0] };
  } catch(e) {
    console.log('error')
    console.log(e)
    return { face: {} }
  }
}

export { loadModel, detect };
