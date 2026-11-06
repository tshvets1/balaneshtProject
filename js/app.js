// RATES, CURRENCY_LABELS, VOLUMES, RATES_UPDATED_AT приходят из rates.js,
// который подключён перед этим файлом в index.html (обычные <script>, без
// import/export — так страница работает и при открытии через file://).

const currencyInput = document.getElementById("currencyInput");
const currencyToggle = document.getElementById("currencyToggle");
const bottlesInput = document.getElementById("bottlesInput");
const odometerDisplay = document.getElementById("odometerDisplay");
const swapBtn = document.getElementById("swapBtn");
const volumeToggle = document.getElementById("volumeToggle");
const volumeButtons = volumeToggle.querySelectorAll(".volume-btn");
const fractionCheckbox = document.getElementById("fractionCheckbox");
const rateDateEl = document.getElementById("rateDate");
const bottleVisual = document.getElementById("bottleVisual");
const bottleRow = document.getElementById("bottleRow");
const changeLine = document.getElementById("changeLine");
const themeToggle = document.getElementById("themeToggle");
const tickerTrack = document.getElementById("tickerTrack");

// Какое поле было отредактировано последним — оно считается "источником",
// второе поле всегда пересчитывается от него.
let lastEdited = "currency";
let currentVolume = VOLUMES[0];
let currentCurrency = Object.keys(CURRENCY_LABELS)[0];
let odometerChars = [];
let lastWholeBottles = 0;
const MAX_BOTTLE_ICONS = 30;

function renderCurrencyButtons() {
  currencyToggle.innerHTML = "";
  for (const code of Object.keys(CURRENCY_LABELS)) {
    const { flagSvg, name } = CURRENCY_LABELS[code];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "currency-btn";
    btn.dataset.currency = code;
    btn.title = name;
    btn.innerHTML = `<span class="flag-icon">${flagSvg}</span><span class="currency-code">${code}</span>`;
    btn.addEventListener("click", () => setCurrency(code));
    currencyToggle.appendChild(btn);
  }
}

function setCurrency(code) {
  currentCurrency = code;
  currencyToggle.querySelectorAll(".currency-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.currency === code);
  });
  recalc();
}

function getRate() {
  return RATES[currentCurrency][currentVolume];
}

function trimNumber(str) {
  if (!str.includes(".")) return str;
  return str.replace(/0+$/, "").replace(/\.$/, "");
}

function formatBottles(bottles) {
  const safe = Number.isFinite(bottles) && bottles > 0 ? bottles : 0;
  return fractionCheckbox.checked ? trimNumber(safe.toFixed(2)) : Math.floor(safe).toString();
}

function setBottlesDisplay(bottles) {
  bottlesInput.value = formatBottles(bottles);
  pulse(bottlesInput);
}

function setCurrencyDisplay(amount) {
  const safe = Number.isFinite(amount) && amount > 0 ? amount : 0;
  currencyInput.value = trimNumber(safe.toFixed(2));
  pulse(currencyInput);
}

function pulse(el) {
  el.classList.remove("pulse");
  // reflow, чтобы анимацию можно было перезапустить
  void el.offsetWidth;
  el.classList.add("pulse");
}

// --- Одометр: крутящиеся разряды над bottlesInput ---

function buildOdometerCell(ch) {
  const isDigit = ch >= "0" && ch <= "9";
  const cell = document.createElement("span");
  cell.className = isDigit ? "odometer-digit" : "odometer-digit punct";
  const strip = document.createElement("span");
  strip.className = "strip";
  if (isDigit) {
    strip.style.setProperty("--d", ch);
    for (let d = 0; d <= 9; d++) {
      const s = document.createElement("span");
      s.textContent = String(d);
      strip.appendChild(s);
    }
  } else {
    strip.textContent = ch;
  }
  cell.appendChild(strip);
  return cell;
}

function updateOdometerCell(cell, ch) {
  const isDigit = ch >= "0" && ch <= "9";
  const wasDigit = cell.classList.contains("odometer-digit") && !cell.classList.contains("punct");
  if (isDigit && wasDigit) {
    cell.firstChild.style.setProperty("--d", ch);
  } else {
    cell.replaceWith(buildOdometerCell(ch));
  }
}

function renderOdometer(str) {
  const chars = str.split("");
  if (chars.length !== odometerChars.length) {
    odometerDisplay.innerHTML = "";
    chars.forEach((ch) => odometerDisplay.appendChild(buildOdometerCell(ch)));
  } else {
    chars.forEach((ch, i) => {
      if (ch !== odometerChars[i]) {
        updateOdometerCell(odometerDisplay.children[i], ch);
      }
    });
  }
  odometerChars = chars;
}

// --- Декоративная бутылка с волной на главном экране ---

function updateBottleVisual(bottles) {
  const whole = bottles > 0 ? Math.floor(bottles) : 0;
  const frac = bottles > 0 ? bottles - whole : 0;
  bottleVisual.style.setProperty("--fill", frac.toFixed(3));
}

// --- Ряд иконок-бутылок в результате ---

function renderBottleRow(bottles) {
  bottleRow.innerHTML = "";
  const whole = bottles > 0 ? Math.floor(bottles) : 0;
  const frac = bottles > 0 ? bottles - whole : 0;
  const showPartial = fractionCheckbox.checked && frac > 0.01;
  const totalIcons = whole + (showPartial ? 1 : 0);
  const shown = Math.min(totalIcons, MAX_BOTTLE_ICONS);
  const shownWhole = showPartial ? Math.max(shown - 1, 0) : shown;

  for (let i = 0; i < shownWhole; i++) {
    const span = document.createElement("span");
    span.className = "bottle-icon";
    span.textContent = "🍾";
    bottleRow.appendChild(span);
  }

  if (showPartial && shown > shownWhole) {
    const span = document.createElement("span");
    span.className = "bottle-icon";
    span.textContent = "🍾";
    span.style.clipPath = `inset(${((1 - frac) * 100).toFixed(1)}% 0 0 0)`;
    span.style.opacity = "0.9";
    bottleRow.appendChild(span);
  }

  if (totalIcons > MAX_BOTTLE_ICONS) {
    const extra = document.createElement("span");
    extra.className = "overflow-count";
    extra.textContent = `+${totalIcons - MAX_BOTTLE_ICONS}`;
    bottleRow.appendChild(extra);
  }
}

function renderChangeLine(amount, rate, bottles) {
  const whole = bottles > 0 ? Math.floor(bottles) : 0;
  const remainder = amount - whole * rate;
  if (remainder > 0.01) {
    const symbol = CURRENCY_LABELS[currentCurrency].symbol;
    changeLine.textContent = `Осталось ${trimNumber(remainder.toFixed(2))} ${symbol}, хватит на лимон 🍋`;
  } else {
    changeLine.textContent = "";
  }
}

// --- Конфетти (самодельное, без зависимостей) ---

function fireConfettiIfNeeded(whole) {
  if (whole >= 1 && lastWholeBottles < 1) {
    fireConfetti();
  }
  lastWholeBottles = whole;
}

function fireConfetti() {
  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "999";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const colors = ["#e8a33d", "#ffd27a", "#fbe9d0", "#c9771f", "#ffffff"];
  const particles = Array.from({ length: 80 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height * 0.3,
    size: 4 + Math.random() * 5,
    speedY: 2 + Math.random() * 3,
    speedX: -1.5 + Math.random() * 3,
    rotation: Math.random() * 360,
    rotationSpeed: -6 + Math.random() * 12,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));

  const start = performance.now();
  function frame(now) {
    const elapsed = now - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.rotation += p.rotationSpeed;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });
    if (elapsed < 1600) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  }
  requestAnimationFrame(frame);
}

// --- Главный пересчёт ---

function recalc() {
  const rate = getRate();
  let amount;
  let bottles;

  if (lastEdited === "bottles") {
    const raw = parseFloat(bottlesInput.value);
    bottles = Number.isFinite(raw) && raw > 0 ? raw : 0;
    amount = bottles * rate;
    setCurrencyDisplay(amount);
  } else {
    const raw = parseFloat(currencyInput.value);
    amount = Number.isFinite(raw) && raw > 0 ? raw : 0;
    bottles = amount / rate;
    setBottlesDisplay(bottles);
  }

  renderOdometer(formatBottles(bottles));
  updateBottleVisual(bottles);
  renderBottleRow(bottles);
  renderChangeLine(amount, rate, bottles);
  fireConfettiIfNeeded(bottles > 0 ? Math.floor(bottles) : 0);
}

function setVolume(volume) {
  currentVolume = volume;
  volumeToggle.dataset.volume = volume;
  volumeButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.volume === volume);
  });
  recalc();
}

function updateSwapRotation() {
  swapBtn.classList.toggle("flipped", lastEdited === "bottles");
}

function swapDirection() {
  if (lastEdited === "currency") {
    bottlesInput.value = "";
    lastEdited = "bottles";
    bottlesInput.focus();
  } else {
    currencyInput.value = "";
    lastEdited = "currency";
    currencyInput.focus();
  }
  updateSwapRotation();
  recalc();
}

// --- Тема: вечерняя (тёмная) / утренняя (светлая) ---

function getStoredTheme() {
  try {
    return localStorage.getItem("balanesht-theme");
  } catch (e) {
    return null;
  }
}

function storeTheme(theme) {
  try {
    localStorage.setItem("balanesht-theme", theme);
  } catch (e) {
    // localStorage недоступен (например, строгий file:// песочница) — просто не сохраняем
  }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeToggle.textContent = theme === "morning" ? "☀️" : "🌙";
  storeTheme(theme);
}

// --- Бегущая строка с курсом внизу страницы ---

function buildTicker() {
  const parts = [];
  for (const code of Object.keys(RATES)) {
    const { symbol } = CURRENCY_LABELS[code];
    for (const vol of VOLUMES) {
      const rate = RATES[code][vol];
      const perUnit = (1 / rate).toFixed(3);
      parts.push(`1 ${code} (${symbol}) = ${perUnit} 🍾 бут. (${vol} л)`);
    }
  }
  const text = parts.join("  ·  ");
  tickerTrack.innerHTML = "";
  for (let i = 0; i < 2; i++) {
    const seg = document.createElement("div");
    seg.className = "ticker-seg";
    seg.textContent = text;
    tickerTrack.appendChild(seg);
  }
}

// --- Слушатели ---

currencyInput.addEventListener("input", () => {
  lastEdited = "currency";
  updateSwapRotation();
  recalc();
});

bottlesInput.addEventListener("input", () => {
  lastEdited = "bottles";
  updateSwapRotation();
  recalc();
});

bottlesInput.addEventListener("focus", () => odometerDisplay.classList.add("hidden"));
bottlesInput.addEventListener("blur", () => odometerDisplay.classList.remove("hidden"));

fractionCheckbox.addEventListener("change", recalc);

volumeButtons.forEach((btn) => {
  btn.addEventListener("click", () => setVolume(btn.dataset.volume));
});

swapBtn.addEventListener("click", swapDirection);

themeToggle.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "morning" ? "evening" : "morning";
  applyTheme(next);
});

// --- Инициализация ---

renderCurrencyButtons();
buildTicker();
rateDateEl.textContent = RATES_UPDATED_AT;
applyTheme(getStoredTheme() || "evening");
currencyInput.value = "100";
setCurrency(currentCurrency);
setVolume(VOLUMES[0]);
updateSwapRotation();
