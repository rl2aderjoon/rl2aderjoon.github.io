import * as THREE from "three";



const page = document.querySelector("main");
const homeName = document.querySelector(".home-name");
const stage = document.querySelector(".stage");
const fallback = stage.querySelector(".fallback");
const openProject = document.querySelector(".open-project");
const detail = document.querySelector(".project-detail");
const reading = document.querySelector(".inline-reading");
const readingToggle = document.querySelector(".reading-toggle");

const buttons = [...document.querySelectorAll(".project")];
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const particleCount = 4000;

const projects = {
  bbiyong: {
    name: "삐용",
    subtitle: "실내 자율 순찰 로봇",
    description: "라이다로 실내 지도를 만들고 지정된 지점을 순찰하며, 카메라가 화재와 연기를 포착하면 관제 화면에 알립니다. 차체 설계와 전원 배선, ESP32 펌웨어를 맡았습니다.",
    image: { src: "./assets/media/bbiyong-shell.jpg", alt: "흰색 외장 커버와 전면 카메라를 장착한 삐용" },
    label: "외장 커버를 씌운 삐용 차체의 입자 윤곽",
    build: rover,
  },
  gabolle: {
    name: "가볼래",
    subtitle: "부산 여행 추천 서비스",
    description: "취향과 예산, 경사·그늘·계단 같은 걷기 조건을 바탕으로 부산 일정을 짭니다. 장소 데이터를 정리하는 파이프라인과 개인화 추천 서버를 맡았습니다.",
    image: { src: "./assets/media/gabolle-live-home-desk.jpg", alt: "가볼래 데스크톱 홈 화면" },
    label: "가볼래 앱 아이콘과 광안대교를 따라 그린 입자 윤곽",
    build: bridgeIcon,
  },
  robotable: {
    name: "로보터블",
    subtitle: "조리 영상에서 동작이 바뀌는 구간 찾기",
    description: "조리 영상에서 동작이 바뀌는 후보를 먼저 찾고, 그 주변 프레임을 멀티모달 모델로 판독해 구간 라벨을 만듭니다. 경계 검출 연구와 라벨링 도구를 맡았습니다.",
    steps: ["영상에서 변화가 큰 지점 찾기", "후보 주변 프레임을 Gemini로 판독", "프레임별 결과를 동작 구간으로 묶기"],
    label: "불꽃 위 프라이팬과 피어오르는 김의 입자 윤곽",
    build: fryingPan,
  },
};

function stroke(points, color, width = 1, smooth = false, motion) {
  const vertices = points.map(([x, y]) => new THREE.Vector3(x, -y, 0));
  if (smooth) {
    return { curve: new THREE.CatmullRomCurve3(vertices), color, width, motion };
  }
  const curve = new THREE.CurvePath();
  for (let index = 1; index < vertices.length; index++) {
    curve.add(new THREE.LineCurve3(vertices[index - 1], vertices[index]));
  }
  return { curve, color, width, motion };
}

function arc(cx, cy, rx, ry, start = 0, end = Math.PI * 2, rotation = 0) {
  const steps = Math.max(8, Math.ceil(Math.abs(end - start) * 7));
  return Array.from({ length: steps + 1 }, (_, index) => {
    const t = THREE.MathUtils.lerp(start, end, index / steps);
    const x = rx * Math.cos(t);
    const y = ry * Math.sin(t);
    return [cx + x * Math.cos(rotation) - y * Math.sin(rotation),
      cy + x * Math.sin(rotation) + y * Math.cos(rotation)];
  });
}

function rover() {
  // Trace the covered vehicle in the project's welcome-hero.png.
  const shell = 0x63379f;
  const seam = 0x8551bd;
  const hardware = 0x43256f;
  return [
    stroke([[86,802],[83,719],[80,644],[91,618],[128,590],[243,526],[324,483],
      [350,476],[394,482],[520,503],[619,521],[650,538],[662,560],[657,645],[649,687]], shell, 1.1, true),
    stroke([[86,802],[98,828],[135,846],[267,886],[397,920],[447,920],[477,910],
      [508,882],[563,826],[609,779]], shell, 1.05, true),
    stroke([[92,626],[125,640],[258,673],[400,704],[451,701],[493,681],[554,619],[647,542]], seam, .72, true),
    stroke([[91,800],[144,819],[260,854],[390,886],[438,886],[481,869],[543,813],[610,749]], seam, .69, true),

    stroke([[322,555],[270,587],[421,617],[499,559],[454,551]], seam, .76),
    stroke(arc(386,511,60,20,0,Math.PI * 2,-.03), hardware, 1.03),
    stroke([[326,512],[326,540],[330,554],[349,565],[387,574],[423,565],[444,550],[446,512]], hardware, .96, true),
    stroke([[326,552],[318,563],[321,578],[348,589],[386,594],[432,583],[451,566],[445,549]], hardware, .78, true),

    stroke([[158,755],[158,730],[162,717],[178,719],[305,750],[316,761],[319,859]], seam, .76, true),
    stroke([[150,774],[168,756],[191,753],[271,772],[294,785],[306,809],[301,831],
      [281,844],[263,844],[181,823],[159,814],[146,795],[150,774]], hardware, 1.01, true),
    stroke(arc(207,801,16,21,0,Math.PI * 2,.25), hardware, .74),
    stroke([[613,744],[628,702],[643,685],[650,690],[655,711],[650,747],
      [639,772],[622,795],[609,802],[601,791],[605,772],[613,744]], hardware, .95, true),
    stroke(arc(633,745,11,39,0,Math.PI * 2,.27), hardware, .66),
  ];
}
function bridgeIcon() {
  const outer = 0x2e665f;
  const bridge = 0x087d70;
  const cable = 0x378c80;
  const corner = 49;
  const edge = 156;
  const step = edge - corner;
  const outline = [
    ...arc(step, -step, corner, corner, -Math.PI / 2, 0),
    ...arc(step, step, corner, corner, 0, Math.PI / 2),
    ...arc(-step, step, corner, corner, Math.PI / 2, Math.PI),
    ...arc(-step, -step, corner, corner, Math.PI, 1.5 * Math.PI),
  ];
  outline.push(outline[0]);

  const lines = [
    stroke(outline, outer, .98),
    stroke([[-132,42],[132,42]], bridge, 1.03),
    stroke([[-118,54],[118,54]], bridge, .66),
    stroke([[-130,30],[-109,13],[-84,-15],[-79,-20]], cable, .73, true),
    stroke([[-79,-20],[-50,4],[-25,22],[0,27],[25,22],[50,4],[79,-20]], cable, .81, true),
    stroke([[79,-20],[84,-15],[109,13],[130,30]], cable, .73, true),
  ];
  for (const x of [-79, 79]) {
    lines.push(stroke([[x - 5,65],[x - 5,-22],[x + 5,-22],[x + 5,65]], bridge, .8));
  }
  for (const [x,y] of [[-108,11],[-57,-1],[-38,14],[-19,23],[0,27],[19,23],[38,14],[57,-1],[108,11]]) {
    lines.push(stroke([[x,y],[x,42]], cable, .57));
  }
  return lines;
}

function fryingPan() {
  const color = 0x9c2f56;
  const rim = 0xb94b71;
  const steam = 0x98516c;
  const fire = 0xc54821;
  const flame = [
    [-39,166],[-66,165],[-82,158],[-87,148],[-84,138],[-79,129],[-75,118],
    [-70,127],[-65,136],[-57,140],[-49,133],[-44,126],[-39,118],
    [-34,127],[-28,136],[-21,140],[-13,134],[-8,126],[-3,118],
    [2,129],[8,140],[9,151],[3,160],[-14,165],[-39,166],
  ];
  return [
    stroke(arc(-31,19,108,71,.0,2*Math.PI,-.16), color, 1.12),
    stroke(arc(-31,25,100,63,.10,Math.PI + .06,-.16), rim, .62),
    stroke([[-134,39],[-119,65],[-88,83],[-48,93],[-5,90],[34,76],[63,56],[77,30]], color, .89, true),
    stroke([[61,-32],[83,-55],[139,-101],[158,-115],[173,-114],[180,-106],[179,-95],[129,-49],[88,-16],[74,-7]], color, 1, true),
    stroke(arc(162,-100,6,4,0,2*Math.PI,-.72), rim, .65),
    stroke([[-63,-75],[-70,-90],[-68,-103],[-58,-119],[-57,-132],[-64,-147]],
      steam, .83, true, { type: "steam", delay: .2 }),
    stroke([[-14,-71],[-22,-86],[-21,-100],[-10,-116],[-9,-130],[-17,-147]],
      steam, .83, true, { type: "steam", delay: 1.45 }),
    stroke(flame, fire, .98, true, { type: "fire" }),
  ];
}
function seededRandom(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function spatialOrder(point) {
  const cell = point.toArray().map((value) => THREE.MathUtils.clamp(Math.floor((value + 3) * 42), 0, 255));
  let order = 0;
  for (let bit = 0; bit < 8; bit++) {
    order |= ((cell[0] >> bit) & 1) << (bit * 3 + 2);
    order |= ((cell[1] >> bit) & 1) << (bit * 3 + 1);
    order |= ((cell[2] >> bit) & 1) << (bit * 3);
  }
  return order;
}

function fitStrokes(strokes) {
  const bounds = new THREE.Box3();
  for (const { curve } of strokes) {
    for (const point of curve.getPoints(64)) bounds.expandByPoint(point);
  }
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  return { center, size, scale: Math.min(4.12 / size.x, 3.48 / size.y) };
}

function sampleShape(project) {
  const strokes = project.build();
  const { center, size, scale } = fitStrokes(strokes);
  const random = seededRandom(3817);
  let length = 0;
  const paths = strokes.map(({ curve, color, width, motion }) => {
    const start = length;
    length += curve.getLength() * width;
    return { curve, color: new THREE.Color(color), width, motion, start, end: length };
  });

  const points = [];
  let pathIndex = 0;
  const tangent = new THREE.Vector3();
  for (let index = 0; index < particleCount; index++) {
    const distance = (index + .5) * length / particleCount;
    while (distance > paths[pathIndex].end) pathIndex++;
    const { curve, color, width, motion, start, end } = paths[pathIndex];
    const fraction = (distance - start) / (end - start);
    const point = curve.getPointAt(fraction);
    const flameHeight = motion?.type === "fire" ? THREE.MathUtils.smoothstep(point.y, -157, -118) : 0;
    point.sub(center).multiplyScalar(scale);
    curve.getTangentAt(fraction, tangent);

    const offset = (random() - .5) * .049 * width;
    point.x -= tangent.y * offset;
    point.y += tangent.x * offset;
    point.z = (random() - .5) * .056 * width;
    points.push({
      point,
      color: color.clone().multiplyScalar(.81 + random() * .32),
      order: spatialOrder(point),
      motion,
      fraction,
      flameHeight,
    });
  }
  points.sort((a, b) => a.order - b.order);
  const moving = points.flatMap((point, index) => point.motion ? [index] : []);
  return { points, moving, width: size.x * scale, height: size.y * scale };
}

function moveCookingParticle(body, sample, seconds, strength) {
  body.point.copy(sample.point);
  body.visibility = 1;
  if (sample.motion.type === "fire") {
    const flicker = sample.flameHeight * strength;
    const phase = seconds * 7.4 + sample.fraction * 3.5;
    body.point.x += Math.sin(phase) * .075 * flicker;
    const lift = Math.sin(seconds * 7.4 + .8) * .043 + Math.sin(seconds * 12) * .014;
    body.point.y += (lift + Math.sin(phase) * .008) * flicker;
    return;
  }

  const duration = 2.65;
  const life = ((seconds + sample.motion.delay + .11 * sample.fraction) % duration) / duration;
  const appear = THREE.MathUtils.smoothstep(life, 0, .19);
  const fade = 1 - THREE.MathUtils.smoothstep(life, .42, .96);
  body.point.y += (.47 * life - .075) * strength;
  body.point.x += Math.sin(life * Math.PI * 2 + sample.fraction * 2) * .09 * life * strength;
  body.visibility = THREE.MathUtils.lerp(1, Math.max(.001, appear * fade), strength);
}

function placeDetailButton(x, y, width, height) {
  if (!reading.hidden) return;
  const hitWidth = Math.max(44, width + 16);
  const hitHeight = Math.max(44, height + 16);
  openProject.style.transform = `translate(${x - hitWidth / 2}px, ${y - hitHeight / 2}px)`;
  openProject.style.width = `${hitWidth}px`;
  openProject.style.height = `${hitHeight}px`;
  openProject.hidden = false;
}

function splitShape(shape, bodies, camera) {
  const stageBounds = stage.getBoundingClientRect();
  const articleBounds = reading.getBoundingClientRect();
  const pixels = stageBounds.width / (camera.right - camera.left);
  const outside = Math.min(32, (stageBounds.width - articleBounds.width) / 3);
  const yStart = articleBounds.top - stageBounds.top + 10;
  const yEnd = articleBounds.bottom - stageBounds.top - 10;
  const middleX = stageBounds.left + stageBounds.width / 2;

  const order = shape.points.map((sample, index) => ({ sample, index }))
    .sort((a, b) => a.sample.point.x - b.sample.point.x);
  const middle = Math.floor(order.length / 2);
  const sides = [order.slice(0, middle), order.slice(middle)];
  const goal = new Array(order.length);
  for (const [side, particles] of sides.entries()) {
    const edge = side === 0 ? articleBounds.left - outside : articleBounds.right + outside;
    const anchor = camera.position.x + (edge - middleX) / pixels;
    particles.sort((a, b) => b.sample.point.y - a.sample.point.y);
    for (const [rank, { sample, index }] of particles.entries()) {
      const across = rank / (particles.length - 1);
      const { drift } = bodies[index];
      const y = (stageBounds.height / 2 - THREE.MathUtils.lerp(yStart, yEnd, across)) / pixels;
      const bend = Math.sin(across * Math.PI * 3 + side) * .072;
      goal[index] = {
        point: new THREE.Vector3(anchor + bend + drift.x * .12, y + drift.y * .048, sample.point.z),
        color: sample.color,
        visibility: .55 + .38 * Math.sin(across * Math.PI),
      };
    }
  }
  return goal;
}

function createStage() {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  stage.append(canvas);

  const scene = new THREE.Scene();
  const ambient = new THREE.HemisphereLight(0xffffff, 0xc3b5da, 1.9);
  const key = new THREE.DirectionalLight(0xfff0df, 3.1);
  key.position.set(-4, 6, 7);
  const rim = new THREE.DirectionalLight(0xe6dbff, .95);
  rim.position.set(5, 3, -3);
  scene.add(ambient, key, rim);

  const camera = new THREE.OrthographicCamera(-4, 4, 3, -3, .1, 32);
  camera.position.z = 12;
  const cloud = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 1),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .74, flatShading: true }),
    particleCount,
  );
  cloud.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  cloud.frustumCulled = false;
  scene.add(cloud);

  const random = seededRandom(9012);
  const bodies = Array.from({ length: particleCount }, () => ({
    radius: .012 + random() ** 1.25 * .021,
    drift: new THREE.Vector3(random() * 1.65 - .825, random() * 1.9 - .95, random() * 2 - 1),
    point: new THREE.Vector3(),
    color: new THREE.Color(),
    visibility: 1,
  }));

  const shapes = new Map();
  const matrix = new THREE.Matrix4();
  let request = 0;
  let current;
  let shape;
  let morphing = false;
  let split = false;
  let goal;

  function resizeDetailButton() {
    if (!shape || canvas.hidden || split) return;
    const { clientWidth: width, clientHeight: height } = stage;
    if (!width || !height) return;
    const pixels = width / (camera.right - camera.left);
    const headroom = shape.moving.length && !reducedMotion.matches ? .42 : 0;
    placeDetailButton(width / 2 - camera.position.x * pixels, (height - headroom * pixels) / 2,
      shape.width * pixels, (shape.height + headroom) * pixels);
  }

  function updateMatrix(index) {
    const { point, radius, visibility } = bodies[index];
    const visibleRadius = radius * visibility;
    matrix.makeScale(visibleRadius, visibleRadius, visibleRadius);
    matrix.setPosition(point);
    cloud.setMatrixAt(index, matrix);
  }

  function draw() {
    if (canvas.hidden) return;
    for (let index = 0; index < bodies.length; index++) {
      updateMatrix(index);
      cloud.setColorAt(index, bodies[index].color);
    }
    cloud.instanceMatrix.needsUpdate = true;
    cloud.instanceColor.needsUpdate = true;
    renderer.render(scene, camera);
  }

  function startCooking() {
    if (split || !shape?.moving.length || reducedMotion.matches || canvas.hidden) return;
    const start = performance.now();
    function cook(now) {
      if (canvas.hidden) return;
      const seconds = (now - start) / 1000;
      const strength = THREE.MathUtils.smoothstep(seconds, 0, .35);
      for (const index of shape.moving) {
        moveCookingParticle(bodies[index], shape.points[index], seconds, strength);
        updateMatrix(index);
      }
      cloud.instanceMatrix.needsUpdate = true;
      renderer.render(scene, camera);
      request = requestAnimationFrame(cook);
    }
    request = requestAnimationFrame(cook);
  }

  reducedMotion.addEventListener("change", () => {
    resizeDetailButton();
    if (split || morphing || !shape?.moving.length) return;
    cancelAnimationFrame(request);
    if (!reducedMotion.matches) {
      startCooking();
      return;
    }
    for (const index of shape.moving) {
      bodies[index].point.copy(shape.points[index].point);
      bodies[index].visibility = 1;
    }
    draw();
  });

  function settle() {
    for (const [index, body] of bodies.entries()) {
      body.point.copy(goal[index].point);
      body.color.copy(goal[index].color);
      body.visibility = goal[index].visibility ?? 1;
    }
    draw();
  }

  function resize() {
    const { clientWidth: width, clientHeight: height } = stage;
    if (!width || !height) return;

    const aspect = width / height;
    const halfHeight = Math.max(2.68, 3.35 / aspect);
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.left = -halfHeight * aspect;
    camera.right = -camera.left;
    camera.position.x = width > 700 ? -.64 : -.43;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    renderer.setSize(width, height, false);
    if (split) {
      goal = splitShape(shape, bodies, camera);
      if (!morphing) {
        settle();
        return;
      }
    }
    resizeDetailButton();
    if (current) draw();
  }

  window.addEventListener("resize", resize);
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    canvas.hidden = true;
    showFallback(current);
  });
  canvas.addEventListener("webglcontextrestored", () => {
    canvas.hidden = false;
    fallback.hidden = true;
    delete stage.dataset.fallback;
    resize();
    if (!morphing) {
      cancelAnimationFrame(request);
      startCooking();
    }
  });
  resize();

  return (id, project, showReading) => {
    if (project === current && showReading === split) return;
    cancelAnimationFrame(request);
    if (!shapes.has(id)) shapes.set(id, sampleShape(project));
    shape = shapes.get(id);
    const first = !current;
    current = project;
    split = showReading;
    goal = split ? splitShape(shape, bodies, camera) : shape.points;
    if (canvas.hidden) showFallback(project);
    else fallback.hidden = true;
    resizeDetailButton();

    if (first || reducedMotion.matches) {
      morphing = false;
      settle();
      startCooking();
      return;
    }

    morphing = true;
    const origin = bodies.map(({ point, color, visibility }) => ({
      point: point.clone(), color: color.clone(), visibility,
    }));
    const start = performance.now();
    function morph(now) {
      const duration = split ? 680 : 910;
      const progress = reducedMotion.matches ? 1 : THREE.MathUtils.clamp((now - start) / duration, 0, 1);
      const eased = progress * progress * (3 - 2 * progress);
      const spread = Math.sin(Math.PI * eased);
      bodies.forEach((body, index) => {
        const target = goal[index];
        body.point.lerpVectors(origin[index].point, target.point, eased)
          .multiplyScalar(1 - .24 * spread)
          .addScaledVector(body.drift, spread);
        body.color.copy(origin[index].color).lerp(target.color, eased);
        body.visibility = THREE.MathUtils.lerp(origin[index].visibility, target.visibility ?? 1, eased);
      });
      draw();
      if (progress < 1) {
        request = requestAnimationFrame(morph);
      } else {
        morphing = false;
        startCooking();
      }
    }
    request = requestAnimationFrame(morph);
  };
}
let fallbackSize;
function resizeFallbackButton() {
  if (fallback.hidden || !fallbackSize) return;
  const image = fallback.getBoundingClientRect();
  const stageBounds = stage.getBoundingClientRect();
  const scale = Math.min(image.width / fallback.width, image.height / fallback.height);
  placeDetailButton(image.left - stageBounds.left + image.width / 2,
    image.top - stageBounds.top + image.height / 2, fallbackSize.x * scale, fallbackSize.y * scale);
}

function showFallback(project) {
  const strokes = project.build();
  const { center, size, scale } = fitStrokes(strokes);
  const horizontal = fallback.width / 2;
  const vertical = fallback.height / 2;
  const pixels = scale * 85;
  const ink = fallback.getContext("2d");
  ink.clearRect(0, 0, fallback.width, fallback.height);
  ink.lineJoin = ink.lineCap = "round";
  for (const { curve, color, width } of strokes) {
    ink.strokeStyle = new THREE.Color(color).getStyle();
    ink.lineWidth = 3.8 * width;
    ink.beginPath();
    for (const [index, point] of curve.getPoints(64).entries()) {
      const x = horizontal + (point.x - center.x) * pixels;
      const y = vertical - (point.y - center.y) * pixels;
      if (index === 0) ink.moveTo(x, y);
      else ink.lineTo(x, y);
    }
    ink.stroke();
  }
  fallbackSize = size.multiplyScalar(pixels);
  stage.dataset.fallback = "";
  fallback.hidden = false;
  resizeFallbackButton();
}

function populateProject(container, project) {
  container.querySelector("[data-project-title]").textContent = project.name;
  container.querySelector("[data-project-subtitle]").textContent = project.subtitle;
  container.querySelector("[data-project-description]").textContent = project.description;
  const detailImage = container.querySelector(".detail-image");
  const detailSteps = container.querySelector(".detail-steps");
  detailImage.hidden = !project.image;
  if (project.image) {
    detailImage.src = project.image.src;
    detailImage.alt = project.image.alt;
  } else {
    detailImage.removeAttribute("src");
    detailImage.alt = "";
  }
  detailSteps.replaceChildren(...(project.steps ?? []).map((step) => {
    const item = document.createElement("li");
    item.textContent = step;
    return item;
  }));
  detailSteps.hidden = !project.steps;
}

function showDetail() {
  populateProject(detail, projects[page.dataset.project]);
  detail.showModal();
  detail.scrollTop = 0;
}

function toggleReading() {
  const open = reading.hidden;
  page.toggleAttribute("data-reading", open);
  reading.hidden = !open;
  openProject.hidden = open;
  readingToggle.setAttribute("aria-expanded", String(open));
  readingToggle.setAttribute("aria-label", open ? "프로젝트 글 닫기" : "프로젝트 글 열기");
  selectProject(page.dataset.project);
  if (open) reading.focus({ preventScroll: true });
  else readingToggle.focus({ preventScroll: true });
}

let renderProject;
function selectProject(id) {
  const project = projects[id];
  for (const button of buttons) {
    button.setAttribute("aria-pressed", String(button.dataset.project === id));
  }
  page.dataset.project = id;
  const readingOpen = !reading.hidden;
  stage.setAttribute("aria-label", readingOpen ? "글 양옆을 흐르는 파티클" : project.label);
  openProject.setAttribute("aria-label", `${project.name} 상세 보기`);
  if (readingOpen) {
    populateProject(reading, project);
    reading.scrollTop = 0;
  }
  if (renderProject) renderProject(id, project, readingOpen);
  else showFallback(project);
}

for (const button of buttons) {
  button.addEventListener("click", () => selectProject(button.dataset.project));
}
homeName.addEventListener("click", () => selectProject("bbiyong"));
openProject.addEventListener("click", showDetail);
readingToggle.addEventListener("click", toggleReading);
page.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !reading.hidden) toggleReading();
});
detail.addEventListener("close", () => openProject.focus({ preventScroll: true }));
window.addEventListener("resize", resizeFallbackButton);

try {
  renderProject = createStage();
} catch (error) {
  console.warn("WebGL을 사용할 수 없어 평면 윤곽으로 표시합니다.", error);
}
selectProject("bbiyong");
