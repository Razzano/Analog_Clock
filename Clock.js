// ==UserScript==
// @name         Analog Clock
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Displays Draggable/Resizeable Analog Clock with Seconds Hand and Light/Dark Themes
// @author       Sonny Razzano a.k.a. srazzano
// @match        https://www.google.com/*
// @match        https://google.com/*
// @exclude      https://www.google.com/search*
// @exclude      https://google.com/search*
// @icon         https://raw.githubusercontent.com/srazzano/Images/master/googleicon64.png
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
  'use strict';

  const style = document.createElement('style');
  style.textContent = `
    .ClockContainer {
      display: inline-block !important;
      position: absolute !important;
      cursor: move !important;
      user-select: none !important;
      z-index: 9999 !important;
      left: 50px;
      top: 100px;
      font-family: system-ui, Arial, sans-serif !important;
    }
    .Analog-Bigclock {
      width: var(--clock-size, 260px) !important;
      height: var(--clock-size, 260px) !important;
    }
    .Analog {
      width: 100% !important;
      height: 100% !important;
      background: radial-gradient(circle at 50% 50%, #f8f9fa 0%, #e9ecef 100%) !important;
      /*border: 16px solid #2c3e50 !important;*/
      border-radius: 50% !important;
      box-shadow: inset 0 0 25px rgba(0,0,0,0.08), 0 15px 35px rgba(0,0,0,0.25) !important;
    }
    .Analog-Hour-Hand, .Analog-Minute-Hand, .Analog-Second-Hand {
      transform-origin: 50% 50% !important;
    }
    .Analog-Hour-Hand   {
      transform: rotate(var(--hourDeg, 0deg)) !important;
    }
    .Analog-Minute-Hand {
      transform: rotate(var(--minuteDeg, 0deg)) !important;
    }
    .Analog-Second-Hand {
      transform: rotate(var(--secondDeg, 0deg)) !important;
      /*transition: transform 0.05s linear !important;*/
    }
    .Analog-Hour-Hand {
      fill: #2c3e50 !important;
      stroke: #2c3e50 !important;
      stroke-linecap: round !important;
      stroke-width: 4 !important;
    }
    .Analog-Minute-Hand {
      fill: #34495e !important;
      stroke: #34495e !important;
      stroke-linecap: round !important;
      stroke-width: 2 !important;
    }
    .Analog-Second-Hand {
      fill: #e74c3c!important;
      stroke: #e74c3c !important;
      stroke-linecap: round !important;
      stroke-width: 1 !important;
    }
    .Analog-Number {
      fill: #2c3e50 !important;
      font-family: system-ui, Arial, sans-serif !important;
      font-size: 6.8px !important;
      font-weight: 700 !important;
      paint-order: stroke fill !important;
      stroke: none !important;
    }
    .Analog-CenterCutout {
      fill: #2c3e50 !important;
      stroke: white !important;
      stroke-width: 3 !important;
    }
    .Analog-Bigclock.dark .Analog {
      background: radial-gradient(circle at 50% 50%, #2c3e50 0%, #1a252f 100%) !important;
      border-color: #ecf0f1 !important;
    }
    .Analog-Bigclock.dark .Analog-Number {
      fill: #fff !important;
    }
    .Analog-Bigclock.dark .Analog-Hour-Hand,
    .Analog-Bigclock.dark .Analog-Minute-Hand {
      fill: #ecf0f1 !important;
      stroke: #ecf0f1 !important;
    }
    .Analog-Bigclock.dark .Analog-Second-Hand {
      fill: #ff6b6b !important;
      stroke: #ff6b6b !important;
    }
    .Analog-Bigclock.dark .Analog-CenterCutout {
      fill: #ecf0f1 !important;
      stroke: #2c3e50 !important;
    }
    .scaler-controls {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      background: #1e2224 !important;
      padding: 6px 12px !important;
      border-radius: 6px !important;
      gap: 12px !important;
      width: fit-content !important;
      margin: 42px 0px 0px 0px !important;
      float: right !important;
    }
    .scaler-reset {
      background: none !important;
      border: none !important;
      color: #7a8287 !important;
      font-size: 14px !important;
      cursor: pointer !important;
      padding: 0 !important;
      font-weight: 500 !important;
      margin: 4px !important;
    }
    .scaler-reset:hover {
      color: #ffffff !important;
    }
    .scaler-btn {
      background: none !important;
      border: none !important;
      color: #ffffff !important;
      font-size: 18px !important;
      cursor: pointer !important;
      padding: 0px 4px !important;
      line-height: 1 !important;
    }
    .scaler-btn:hover {
      opacity: 0.8 !important;
    }
    .scaler-text {
      color: #5294e2 !important;
      cursor: pointer !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      min-width: 45px !important;
      pointer-events: none !important;
      text-align: center !important;
    }
    .ClockThemeToggle {
      background: #34495e !important;
      border: none !important;
      border-radius: 30px !important;
      color: white !important;
      cursor: pointer !important;
      font-size: 14px !important;
      padding: 7px 8px !important;
      margin: 43px 0 0 0 !important;
      text-align: center !important;
      width: 70px !important;
    }
  `;
  document.head.appendChild(style);

  function $c(tag, props = {}, ...children) {
    const svgTags = ['svg','g','path','circle','text','line'];
    const el = document.createElementNS(
      svgTags.includes(tag) ? 'http://www.w3.org/2000/svg' : 'http://www.w3.org/1999/xhtml',
      tag
    );
    if (props.className) el.setAttribute('class', props.className);
    if (props.style) Object.assign(el.style, props.style);
    if (props.textContent !== undefined) el.textContent = props.textContent;

    Object.keys(props).forEach(key => {
      if (!['className','style','textContent','onclick'].includes(key)) {
        el.setAttribute(key, props[key]);
      }
    });
    if (props.onclick) el.onclick = props.onclick;

    children.flat().forEach(child => child && el.appendChild(child));
    return el;
  }

  const hourNumbers = [];
  const ticks = [];
  for (let i = 0; i < 12; i++) {
    const hour = (i === 0) ? 12 : i;
    const angleDeg = i * 30 - 90;
    const rad = angleDeg * Math.PI / 180;
    const radius = 37;

    const x = 50 + radius * Math.cos(rad);
    const y = 50 + radius * Math.sin(rad);

    ticks.push($c('line', {
      x1: 50 + 42 * Math.cos(rad),
      y1: 50 + 42 * Math.sin(rad),
      x2: 50 + 47 * Math.cos(rad),
      y2: 50 + 47 * Math.sin(rad),
      stroke: '#2c3e50',
      'stroke-width': '1',
      'stroke-linecap': 'round'
    }));

    hourNumbers.push($c('text', {
      className: 'Analog-Number',
      x: x.toFixed(3),
      y: (y + 2.8).toFixed(3),
      textContent: hour,
      'text-anchor': 'middle',
      'dominant-baseline': 'middle'
    }));
  }

  const svg = $c('svg', { className: 'Analog', viewBox: '0 0 100 100' },
    $c('circle', { cx: 50, cy: 50, r: 47, fill: 'none', stroke: '#ccc', 'stroke-width': 2 }),
    ...ticks,
    ...hourNumbers,
    $c('line', { className: 'Analog-Hour-Hand', x1: 50, y1: 50, x2: 50, y2: 30 }),
    $c('line', { className: 'Analog-Minute-Hand', x1: 50, y1: 50, x2: 50, y2: 22 }),
    $c('line', { className: 'Analog-Second-Hand', x1: 50, y1: 55, x2: 50, y2: 15 }),
    $c('circle', { className: 'Analog-CenterCutout', cx: 50, cy: 50, r: 3 })
  );

  const Clock = $c('div', { className: 'Analog-Bigclock' }, svg);

  const BASE_SIZE = 260;
  let currentPercent = 100;

  const percentageDisplay = $c('span', { className: 'scaler-text', textContent: '100 %' });

  function setClockPercentage(percent) {
    // Keep sizes limited within reasonable bounds (e.g., 40% to 200%)
    currentPercent = Math.max(40, Math.min(200, percent));

    const pixelSize = Math.round((currentPercent / 100) * BASE_SIZE);
    Clock.style.setProperty('--clock-size', pixelSize + 'px');
    percentageDisplay.textContent = currentPercent + ' %';

    localStorage.setItem('clockSizePercent', currentPercent);
  }

  const scalerControls = $c('div', { className: 'scaler-controls' },
    $c('button', { className: 'scaler-reset', textContent: 'Reset', onclick: () => setClockPercentage(100) }),
    $c('button', { className: 'scaler-btn', textContent: '-', onclick: () => setClockPercentage(currentPercent - 5) }),
    percentageDisplay,
    $c('button', { className: 'scaler-btn', textContent: '+', onclick: () => setClockPercentage(currentPercent + 5) })
  );

  const themeBtn = $c('button', {
    className: 'ClockThemeToggle',
    textContent: '🌙 Dark',
    onclick() {
      const dark = Clock.classList.toggle('dark');
      themeBtn.textContent = dark ? '☀️ Light' : '🌙 Dark';
    }
  });

  const savedPercent = localStorage.getItem('clockSizePercent');
  if (savedPercent) {
    setClockPercentage(parseInt(savedPercent, 10));
  } else {
    setClockPercentage(100);
  }

  const container = $c('div', { className: 'ClockContainer' }, Clock, themeBtn, scalerControls);

  let isDragging = false;
  let offsetX = 0, offsetY = 0;

  function startDrag(e) {
    if (e.target.closest('.ClockThemeToggle') || e.target.closest('.scaler-controls')) return;
    isDragging = true;
    const rect = container.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    container.style.transition = 'none';
    container.style.cursor = 'grabbing';
  }

  function doDrag(e) {
    if (!isDragging) return;
    e.preventDefault();
    container.style.left = (e.clientX - offsetX) + 'px';
    container.style.top = (e.clientY - offsetY) + 'px';
  }

  function stopDrag() {
    if (!isDragging) return;
    isDragging = false;
    container.style.transition = '';
    container.style.cursor = 'move';

    const left = parseInt(container.style.left) || 50;
    const top = parseInt(container.style.top) || 100;
    localStorage.setItem('clockPosition', JSON.stringify({ left, top }));
  }

  const savedPos = localStorage.getItem('clockPosition');
  if (savedPos) {
    const pos = JSON.parse(savedPos);
    container.style.left = pos.left + 'px';
    container.style.top = pos.top + 'px';
  }

  container.addEventListener('mousedown', startDrag);
  document.addEventListener('mousemove', doDrag);
  document.addEventListener('mouseup', stopDrag);

  container.addEventListener('touchstart', e => {
    if (e.target.closest('.ClockThemeToggle') || e.target.closest('.scaler-controls')) return;
    const touch = e.touches[0];
    startDrag({ clientX: touch.clientX, clientY: touch.clientY });
  });
  document.addEventListener('touchmove', e => {
    if (isDragging) {
      const touch = e.touches[0];
      doDrag({ clientX: touch.clientX, clientY: touch.clientY });
    }
  });
  document.addEventListener('touchend', stopDrag);

  document.body.appendChild(container);

  let displayedSecondDeg = 0;
  function updateClock() {
    const now = new Date();
    const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
    const secondDeg = seconds * 6;
    Clock.style.setProperty('--secondDeg', `${secondDeg}deg`);
    let targetDeg = seconds * 6;
    if (targetDeg < displayedSecondDeg - 180) targetDeg += 360;
    displayedSecondDeg = targetDeg;
    const minuteDeg = now.getMinutes() * 6 + seconds * 0.1;
    const hourDeg = (now.getHours() % 12) * 30 + now.getMinutes() * 0.5 + seconds * (0.5 / 60);
    Clock.style.setProperty('--secondDeg', `${displayedSecondDeg}deg`);
    Clock.style.setProperty('--minuteDeg', `${minuteDeg}deg`);
    Clock.style.setProperty('--hourDeg', `${hourDeg}deg`);
  }

  setInterval(updateClock, 16);
  updateClock();
})();
