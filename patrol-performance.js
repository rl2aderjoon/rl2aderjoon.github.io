(() => {
  const section = document.getElementById('patrol-performance');
  const [chip, gate, gauge] = section.querySelectorAll('svg');
  const [loadValue, boardState, networkValue] = section.querySelectorAll('[data-reading]');
  const [before, after, replay] = section.querySelectorAll('button');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const ink = 'var(--fg)', muted = 'var(--fg-2)', track = 'var(--line)', accent = '#ff7850';
  const clamp = value => Math.max(0, Math.min(1, value));
  const label = (x, y, value, color = muted, anchor = 'start') =>
    '<text x="' + x + '" y="' + y + '" fill="' + color + '" text-anchor="' + anchor + '">' + value + '</text>';
  const bar = (x, y, width, height, color) =>
    '<rect x="' + x + '" y="' + y + '" width="' + width + '" height="' + height + '" fill="' + color + '"/>';
  const dot = (x, y, r, color) =>
    '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + color + '"/>';
  const wire = (d, color) => '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2"/>';

  function drawChip(load) {
    let tiles = '';
    for (let i = 0; i < 6; i++) {
      const x = 12 + i % 3 * 83, y = 14 + Math.floor(i / 3) * 36;
      tiles += bar(x, y, 74, 29, track) + bar(x, y, 74 * clamp(load - i), 29, accent);
      tiles += label(x + 5, y + 20, 'C' + (i + 1), ink);
    }
    chip.innerHTML = tiles + label(12, 103, '한 칸 = 평균 작업 1개');
  }

  function drawGate(time, optimized) {
    const phase = (4 * time + .58) % 1;
    const reading = !optimized && phase < .12;
    const wheel = optimized ? phase < .68 : phase >= .78;
    const start = optimized ? (wheel ? 0 : .68) : (wheel ? .78 : .12);
    const end = optimized ? (wheel ? .68 : 1) : (wheel ? 1 : .78);
    const color = wheel ? ink : accent;
    const inlet = wheel ? 72 : 27;
    let diagram = wire('M8 27 H60 L112 52 M8 72 H60 L112 52 H245', muted);
    if (!reading) diagram += wire('M8 ' + inlet + ' H60 L112 52 H245', color);
    diagram += bar(112, 43, 4, 18, reading ? muted : color) + dot(245, 52, 6, reading ? muted : color);
    if (reading) {
      diagram += bar(49, 23, 8, 8, accent) + dot(57, 72, 4.5, ink);
    } else {
      const x = 8 + 237 * clamp((phase - start) / ((end - start) * .92));
      const y = inlet + (52 - inlet) * clamp((x - 60) / 52);
      diagram += wheel ? bar(49, 23, 8, 8, accent) + dot(x, y, 5, ink)
        : dot(57, 72, 4.5, ink) + bar(x - 5, y - 5, 10, 10, accent);
    }
    const status = reading ? '열화상 한 장 판독 중' : wheel ? '바퀴 정보 송신' : optimized ? '열화상 조각 송신' : '열화상 한 장 송신';
    gate.innerHTML = diagram + label(6, 15, '열화상', accent) + label(6, 89, '바퀴 회전값') +
      label(250, 26, 'Orin 수신', muted, 'end') + label(250, 88, status, ink, 'end');
  }

  function drawGauge(rate) {
    const scale = 240 / 17, refX = 10 + 11.5 * scale;
    gauge.innerHTML = label(10, 17, '송신량 예시 · Mbps') + bar(10, 43, 240, 10, track) +
      bar(10, 43, rate * scale, 10, rate > 11.5 ? accent : ink) +
      bar(refX - 1, 31, 2, 35, accent) + label(refX, 81, '11.5 기준선', muted, 'middle') +
      label(10, 105, '0') + label(250, 105, '17 Mbps', muted, 'end');
  }

  function render(time) {
    const step = clamp((time - .4) / .21);
    const mix = step * step * (3 - 2 * step);
    const optimized = mix >= .5;
    const load = 5.44 - 3.70 * mix;
    const rate = 12.3 - 4.1 * mix;
    const wave = (time === 0 || time === 1) ? 0 :
      (1.75 - 1.05 * mix) * Math.sin(time * 24.3) + (.95 - .68 * mix) * Math.cos(time * 49.5);
    drawChip(load);
    drawGate(time, optimized);
    drawGauge(rate + wave);
    loadValue.textContent = optimized ? '1.74' : '5.44';
    boardState.textContent = optimized ? '바퀴 우선' : '순차 전송';
    networkValue.textContent = optimized ? '8.2 Mbps' : '12.3 Mbps';
    before.setAttribute('aria-pressed', String(time === 0));
    after.setAttribute('aria-pressed', String(time === 1));
  }

  let frame = 0;
  function show(time) {
    cancelAnimationFrame(frame);
    render(time);
  }
  before.onclick = () => show(0);
  after.onclick = () => show(1);
  replay.onclick = () => {
    if (reducedMotion.matches) return show(1);
    show(0);
    const start = performance.now();
    function advance(now) {
      const time = clamp((now - start) / 6200);
      render(time);
      if (time < 1) frame = requestAnimationFrame(advance);
    }
    frame = requestAnimationFrame(advance);
  };
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) show(1); });
  render(0);
})();
