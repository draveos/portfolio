/* 블로그 임베드 전용 동작. main.js 뒤에 실행되며 main.js 의 전역(viewer, scene, clock)을 그대로 쓴다.
   원본 drone_world_tour 에는 없는 파일. */
(function () {
  if (typeof viewer === "undefined" || typeof clock === "undefined") return;

  var mobile = window.innerWidth < 600;
  var coarse = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);

  // 터치 기기에서는 Cesium 카메라 입력이 페이지 스크롤을 가로채므로 끈다. 카메라는 CINE 모드가 움직인다.
  if (coarse || mobile) scene.screenSpaceCameraController.enableInputs = false;
  if (mobile) {
    viewer.resolutionScale = 0.75;
    viewer.targetFrameRate = 30;
  }

  // 기본 배속 2배: 도시 하나를 40초에 선회한다. HUD 의 속도 표시는 시뮬레이션 실속도 그대로다.
  var speed2 = document.querySelector('#speedGroup button[data-speed="2"]');
  if (speed2) speed2.click();

  // 부모(블로그)가 보내는 가시성 신호. 보이지 않을 때는 렌더 루프를 멈춰 GPU 를 쓰지 않는다.
  var wasAnimating = clock.shouldAnimate;
  window.addEventListener("message", function (e) {
    if (e.origin !== window.location.origin) return;
    var d = e.data;
    if (!d || d.type !== "portfolio:visible") return;
    if (d.visible) {
      if (viewer.useDefaultRenderLoop) return;
      viewer.useDefaultRenderLoop = true;
      // 멈춰 있던 실시간이 한 번에 더해지지 않도록, 첫 틱이 지난 뒤에 애니메이션을 다시 켠다.
      var once = function () {
        clock.onTick.removeEventListener(once);
        clock.shouldAnimate = wasAnimating;
      };
      clock.onTick.addEventListener(once);
    } else {
      if (!viewer.useDefaultRenderLoop) return;
      wasAnimating = clock.shouldAnimate;
      clock.shouldAnimate = false;
      viewer.useDefaultRenderLoop = false;
    }
  });
})();
