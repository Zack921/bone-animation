// import * as THREE from './three/three.module.js'; // 新版本 THREE.SkinnedMesh no longer supports THREE.Geometry. Use THREE.BufferGeometry instead.
import { OrbitControls } from './three/orbitcontrols.js';
import { GUI } from './three/dat.gui.module.js';

let domElement = document.getElementById("avatarDom");
let canvasW = domElement.clientWidth;
let canvasH = domElement.clientHeight;

let renderer = new THREE.WebGLRenderer();
domElement.appendChild(renderer.domElement);

renderer.setSize(canvasW, canvasH);

let scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(45, 500 / 500, 1, 2000);
camera.position.z = 400;
camera.lookAt(scene.position);
camera.aspect = canvasW / canvasH;
camera.updateProjectionMatrix();
scene.add(camera);
scene.background = new THREE.Color(0xa0a0a0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 25, 0);
controls.update();

const axisHelper = new THREE.AxisHelper(100);
scene.add(axisHelper);

/**
 * 创建骨骼网格模型SkinnedMesh
 */
// 创建一个圆柱几何体，高度120，顶点坐标y分量范围[-60,60]
let geometry = new THREE.CylinderGeometry(5, 10, 120, 50, 300);
geometry.translate(0, 60, 0); //平移后，y分量范围[0,120]
console.log("name", geometry.vertices); //控制台查看顶点坐标

/**
 * 设置几何体对象Geometry的蒙皮索引skinIndices、权重skinWeights属性
 * 实现一个模拟腿部骨骼运动的效果
 */
//遍历几何体顶点，为每一个顶点设置蒙皮索引、权重属性
//根据y来分段，0~60一段、60~100一段、100~120一段
for (let i = 0; i < geometry.vertices.length; i++) {
  let vertex = geometry.vertices[i]; //第i个顶点
  if (vertex.y <= 60) {
    // 设置每个顶点蒙皮索引属性  受根关节Bone1(0)影响
    geometry.skinIndices.push(new THREE.Vector4(0, 0, 0, 0));
    // 设置每个顶点蒙皮权重属性
    // 影响该顶点关节Bone1对应权重是1-vertex.y/60
    geometry.skinWeights.push(new THREE.Vector4(1 - vertex.y / 60, 0, 0, 0));
  } else if (60 < vertex.y && vertex.y <= 60 + 40) {
    // Vector4(1, 0, 0, 0)表示对应顶点受关节Bone2影响
    geometry.skinIndices.push(new THREE.Vector4(1, 0, 0, 0));
    // 影响该顶点关节Bone2对应权重是1-(vertex.y-60)/40
    geometry.skinWeights.push(new THREE.Vector4(1 - (vertex.y - 60) / 40, 0, 0, 0));
  } else if (60 + 40 < vertex.y && vertex.y <= 60 + 40 + 20) {
    // Vector4(2, 0, 0, 0)表示对应顶点受关节Bone3影响
    geometry.skinIndices.push(new THREE.Vector4(2, 0, 0, 0));
    // 影响该顶点关节Bone3对应权重是1-(vertex.y-100)/20
    geometry.skinWeights.push(new THREE.Vector4(1 - (vertex.y - 100) / 20, 0, 0, 0));
  }
}
// 材质对象
var material = new THREE.MeshPhongMaterial({
  skinning: true, //允许蒙皮动画
  wireframe: true,
});
// 创建骨骼网格模型
var SkinnedMesh = new THREE.SkinnedMesh(geometry, material);

SkinnedMesh.position.set(50, 120, 50); //设置网格模型位置
SkinnedMesh.rotateX(Math.PI); //旋转网格模型
scene.add(SkinnedMesh); //网格模型添加到场景中

/**
 * 骨骼系统
 */
var Bone1 = new THREE.Bone(); //关节1，用来作为根关节
var Bone2 = new THREE.Bone(); //关节2
var Bone3 = new THREE.Bone(); //关节3
// 设置关节父子关系   多个骨头关节构成一个树结构
Bone1.add(Bone2);
Bone2.add(Bone3);
// 设置关节之间的相对位置
//根关节Bone1默认位置是(0,0,0)
Bone2.position.y = 60; //Bone2相对父对象Bone1位置
Bone3.position.y = 40; //Bone3相对父对象Bone2位置

// 所有Bone对象插入到Skeleton中，全部设置为.bones属性的元素
var skeleton = new THREE.Skeleton([Bone1, Bone2, Bone3]); //创建骨骼系统
console.log('Bone1: ', Bone1);

//骨骼关联网格模型
SkinnedMesh.add(Bone1); //根骨头关节添加到网格模型
SkinnedMesh.bind(skeleton); //网格模型绑定到骨骼系统
console.log('SkinnedMesh: ', SkinnedMesh);
/**
 * 骨骼辅助显示
 */
var skeletonHelper = new THREE.SkeletonHelper(SkinnedMesh);
scene.add(skeletonHelper);

// 转动关节带动骨骼网格模型出现弯曲效果  好像腿弯曲一样
// skeleton.bones[1].rotation.x = 0.5;
// skeleton.bones[2].rotation.x = 0.5;

// 渲染函数
function render() {
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}
render();


// 准备效果控制条
const gui = new GUI({ width: 300 });

var folder;

var bones = skeleton.bones;

for ( var i = 0; i < bones.length; i ++ ) {

    var bone = bones[ i ];

    folder = gui.addFolder( "Bone " + i );

    folder.add( bone.position, 'x', - 10 + bone.position.x, 10 + bone.position.x );
    folder.add( bone.position, 'y', - 10 + bone.position.y, 10 + bone.position.y );
    folder.add( bone.position, 'z', - 10 + bone.position.z, 10 + bone.position.z );

    folder.add( bone.rotation, 'x', - Math.PI * 0.5, Math.PI * 0.5 );
    folder.add( bone.rotation, 'y', - Math.PI * 0.5, Math.PI * 0.5 );
    folder.add( bone.rotation, 'z', - Math.PI * 0.5, Math.PI * 0.5 );

    folder.add( bone.scale, 'x', 0, 2 );
    folder.add( bone.scale, 'y', 0, 2 );
    folder.add( bone.scale, 'z', 0, 2 );

    folder.__controllers[ 0 ].name( "position.x" ).onChange(function (e) {
      console.log('Bone1: ', Bone1);
    });;
    folder.__controllers[ 1 ].name( "position.y" );
    folder.__controllers[ 2 ].name( "position.z" );

    folder.__controllers[ 3 ].name( "rotation.x" );
    folder.__controllers[ 4 ].name( "rotation.y" );
    folder.__controllers[ 5 ].name( "rotation.z" );

    folder.__controllers[ 6 ].name( "scale.x" );
    folder.__controllers[ 7 ].name( "scale.y" );
    folder.__controllers[ 8 ].name( "scale.z" );

}
