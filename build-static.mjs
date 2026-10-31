// Build a dependency-free static deployment for the number guessing game.
// Usage: node build-static.mjs [output-directory]
import { mkdirSync, writeFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const projectRoot = resolve(import.meta.dirname)
const output = resolve(projectRoot, process.argv[2] || 'dist')
if (output !== projectRoot && !output.startsWith(projectRoot + '/')) {
  throw new Error('Build output must stay inside the project directory.')
}

const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0b1020">
<meta name="description" content="1 ile 100 arasında sayı tahmin oyunu: 5 hakkında sayıyı bul.">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%8E%AF%3C/text%3E%3C/svg%3E">
<title>Sayı Tahmin Oyunu</title>
<style>
  * { box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    margin: 0;
    min-height: 100svh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom));
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #eaf0ff;
    background:
      radial-gradient(1000px 600px at 12% -10%, rgba(99, 102, 241, .35), transparent 60%),
      radial-gradient(900px 600px at 108% 112%, rgba(16, 185, 129, .22), transparent 60%),
      #0b1020;
  }
  .app { width: 100%; max-width: 470px; }
  .card {
    position: relative;
    overflow: hidden;
    padding: clamp(20px, 5vw, 32px);
    border-radius: 26px;
    border: 1px solid rgba(148, 163, 184, .22);
    background: linear-gradient(160deg, rgba(30, 41, 59, .92), rgba(15, 23, 42, .96));
    box-shadow: 0 30px 80px rgba(2, 6, 23, .65), inset 0 1px 0 rgba(255, 255, 255, .06);
  }
  .card::before {
    content: "";
    position: absolute;
    inset: -40% -20% auto;
    height: 60%;
    background: radial-gradient(closest-side, rgba(129, 140, 248, .30), transparent);
    pointer-events: none;
  }
  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 14px;
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: #c7d2fe;
    background: rgba(99, 102, 241, .16);
    border: 1px solid rgba(129, 140, 248, .35);
  }
  .dot { width: 7px; height: 7px; border-radius: 50%; background: #34d399; box-shadow: 0 0 12px #34d399; }
  h1 { margin: 0; font-size: clamp(27px, 7vw, 36px); line-height: 1.08; letter-spacing: -.02em; }
  .lead { margin: 10px 0 0; color: #a8b4cc; font-size: 15px; line-height: 1.55; }
  .stats {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 22px 0 16px;
    padding: 13px 16px;
    border-radius: 16px;
    background: rgba(15, 23, 42, .7);
    border: 1px solid rgba(148, 163, 184, .16);
  }
  .stats-label { font-size: 13px; color: #94a3b8; font-weight: 600; }
  .dots { display: flex; gap: 7px; }
  .pip {
    width: 13px; height: 13px; border-radius: 50%;
    border: 1.5px solid rgba(148, 163, 184, .55);
    background: transparent;
    transition: background .2s, border-color .2s, transform .2s;
  }
  .pip.used { background: #64748b; border-color: #64748b; transform: scale(.86); }
  .pip.current { border-color: #818cf8; box-shadow: 0 0 0 4px rgba(129, 140, 248, .14); }
  .feedback {
    display: flex;
    align-items: center;
    gap: 13px;
    min-height: 76px;
    margin-bottom: 18px;
    padding: 14px 16px;
    border-radius: 16px;
    background: rgba(30, 41, 59, .55);
    border: 1px solid rgba(148, 163, 184, .14);
    transition: border-color .2s, background .2s;
  }
  .feedback.hot { border-color: rgba(251, 191, 36, .45); background: rgba(120, 53, 15, .22); }
  .feedback.cold { border-color: rgba(56, 189, 248, .4); background: rgba(12, 74, 110, .22); }
  .feedback.win { border-color: rgba(52, 211, 153, .5); background: rgba(6, 78, 59, .28); }
  .feedback.lose { border-color: rgba(248, 113, 113, .45); background: rgba(127, 29, 29, .24); }
  .feedback-icon { font-size: 30px; line-height: 1; flex: none; }
  .feedback-text { min-width: 0; }
  .feedback-title { margin: 0; font-size: 15px; font-weight: 700; }
  .feedback-hint { margin: 3px 0 0; font-size: 13px; color: #a8b4cc; }
  .row { display: flex; gap: 10px; }
  input[type="number"] {
    flex: 1 1 auto;
    min-width: 0;
    height: 54px;
    padding: 0 16px;
    border-radius: 14px;
    border: 1px solid rgba(148, 163, 184, .3);
    background: rgba(2, 6, 23, .62);
    color: #f8fafc;
    font: inherit;
    font-size: 18px;
    font-weight: 700;
    outline: none;
    transition: border-color .2s, box-shadow .2s;
  }
  input[type="number"]::placeholder { color: #64748b; font-weight: 500; }
  input[type="number"]:focus { border-color: #818cf8; box-shadow: 0 0 0 4px rgba(129, 140, 248, .16); }
  input[type="number"]:disabled { opacity: .55; }
  button {
    flex: none;
    height: 54px;
    padding: 0 20px;
    border: 0;
    border-radius: 14px;
    font: inherit;
    font-size: 15px;
    font-weight: 800;
    color: #0b1020;
    background: linear-gradient(180deg, #a5b4fc, #818cf8);
    box-shadow: 0 10px 24px rgba(99, 102, 241, .35);
    cursor: pointer;
    transition: transform .15s, filter .15s, opacity .15s;
    -webkit-tap-highlight-color: transparent;
  }
  button:hover { filter: brightness(1.06); }
  button:active { transform: translateY(1px) scale(.99); }
  button:focus-visible { outline: 3px solid rgba(199, 210, 254, .7); outline-offset: 2px; }
  button:disabled { opacity: .45; cursor: default; box-shadow: none; }
  .history { display: flex; flex-wrap: wrap; gap: 7px; margin: 16px 0 0; min-height: 28px; }
  .chip {
    padding: 5px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    color: #cbd5e1;
    background: rgba(51, 65, 85, .6);
    border: 1px solid rgba(148, 163, 184, .18);
  }
  .chip.up { color: #fcd34d; border-color: rgba(251, 191, 36, .3); }
  .chip.down { color: #7dd3fc; border-color: rgba(56, 189, 248, .3); }
  .chip.win { color: #6ee7b7; border-color: rgba(52, 211, 153, .4); }
  .footer {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 18px;
    padding-top: 16px;
    border-top: 1px solid rgba(148, 163, 184, .12);
    font-size: 12px;
    color: #7f8ea8;
  }
  .footer kbd {
    padding: 2px 6px;
    border-radius: 6px;
    border: 1px solid rgba(148, 163, 184, .3);
    background: rgba(2, 6, 23, .6);
    font: inherit;
    font-size: 11px;
    color: #cbd5e1;
  }
  @media (max-width: 420px) {
    .card { border-radius: 22px; }
    .row { flex-direction: column; }
    button { width: 100%; }
    .footer { flex-direction: column; gap: 6px; }
  }
  @media (prefers-reduced-motion: reduce) {
    * { transition: none !important; }
  }
</style>
</head>
<body>
  <main class="app">
    <section class="card" aria-labelledby="title">
      <p class="eyebrow"><span class="dot" aria-hidden="true"></span> 1 – 100 arası</p>
      <h1 id="title">Sayı Tahmin Oyunu</h1>
      <p class="lead">Aklımdan 1 ile 100 arasında bir sayı tuttum. <strong>5 tahmin hakkın</strong> var. Bakalım bulabilecek misin?</p>

      <div class="stats">
        <span class="stats-label">Kalan hak</span>
        <div class="dots" id="dots" aria-label="Kalan tahmin hakkı"></div>
      </div>

      <div class="feedback" id="feedback" role="status" aria-live="polite">
        <span class="feedback-icon" id="feedback-icon" aria-hidden="true">🎯</span>
        <div class="feedback-text">
          <p class="feedback-title" id="feedback-title">Hazır mısın?</p>
          <p class="feedback-hint" id="feedback-hint">İlk tahminini girerek başla.</p>
        </div>
      </div>

      <form id="form" autocomplete="off">
        <div class="row">
          <input id="guess" type="number" inputmode="numeric" pattern="[0-9]*" min="1" max="100" step="1" placeholder="1 – 100" aria-label="Tahminin" required>
          <button id="submit" type="submit">Tahmin Et</button>
        </div>
      </form>

      <div class="history" id="history" aria-label="Tahmin geçmişi"></div>

      <div class="footer">
        <span>İpucu: her tahminden sonra yön söylerim.</span>
        <span><kbd>Enter</kbd> ile gönder</span>
      </div>
    </section>
  </main>

<script>
(function () {
  var MIN = 1, MAX = 100, MAX_ATTEMPTS = 5;
  var secret, attempts, history, over;

  var form = document.getElementById('form');
  var input = document.getElementById('guess');
  var submit = document.getElementById('submit');
  var dots = document.getElementById('dots');
  var feedback = document.getElementById('feedback');
  var icon = document.getElementById('feedback-icon');
  var title = document.getElementById('feedback-title');
  var hint = document.getElementById('feedback-hint');
  var historyEl = document.getElementById('history');

  function randomSecret() {
    if (window.crypto && window.crypto.getRandomValues) {
      var buffer = new Uint32Array(1);
      var limit = Math.floor(4294967296 / (MAX - MIN + 1)) * (MAX - MIN + 1);
      do { window.crypto.getRandomValues(buffer); } while (buffer[0] >= limit);
      return MIN + (buffer[0] % (MAX - MIN + 1));
    }
    return MIN + Math.floor(Math.random() * (MAX - MIN + 1));
  }

  function setFeedback(state, emoji, heading, message) {
    feedback.className = 'feedback' + (state ? ' ' + state : '');
    icon.textContent = emoji;
    title.textContent = heading;
    hint.textContent = message;
  }

  function renderDots() {
    dots.innerHTML = '';
    var remaining = MAX_ATTEMPTS - attempts;
    for (var i = 0; i < MAX_ATTEMPTS; i++) {
      var pip = document.createElement('span');
      pip.className = 'pip' + (i < attempts ? ' used' : '') + (i === attempts && !over ? ' current' : '');
      dots.appendChild(pip);
    }
    dots.setAttribute('aria-label', remaining + ' tahmin hakkı kaldı');
  }

  function addChip(text, kind) {
    var chip = document.createElement('span');
    chip.className = 'chip' + (kind ? ' ' + kind : '');
    chip.textContent = text;
    historyEl.appendChild(chip);
  }

  function finish(won) {
    over = true;
    input.disabled = true;
    submit.textContent = 'Tekrar Oyna';
    submit.dataset.replay = '1';
    if (won) {
      setFeedback('win', '🏆', 'Tebrikler, kazandın!', 'Sayıyı ' + attempts + ' tahminde buldun.');
      addChip(secret + ' ✓', 'win');
    } else {
      setFeedback('lose', '😢', 'Hakkın bitti.', 'Tuttuğum sayı ' + secret + ' idi. Tekrar dene!');
    }
  }

  function reset() {
    secret = randomSecret();
    attempts = 0;
    history = [];
    over = false;
    historyEl.innerHTML = '';
    input.value = '';
    input.disabled = false;
    submit.disabled = false;
    submit.textContent = 'Tahmin Et';
    delete submit.dataset.replay;
    setFeedback('', '🎯', 'Hazır mısın?', 'İlk tahminini girerek başla.');
    renderDots();
    input.focus();
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (over) { reset(); return; }

    var value = Number(input.value);
    if (!Number.isInteger(value) || value < MIN || value > MAX) {
      setFeedback('cold', '⚠️', 'Geçersiz tahmin.', 'Lütfen ' + MIN + ' ile ' + MAX + ' arasında bir tam sayı gir.');
      input.value = '';
      input.focus();
      return;
    }
    if (history.indexOf(value) !== -1) {
      setFeedback('cold', '🔁', 'Bu sayıyı zaten denedin.', 'Farklı bir tahmin gir.');
      input.select();
      return;
    }

    history.push(value);
    attempts += 1;
    renderDots();

    if (value === secret) {
      addChip(String(value), 'win');
      finish(true);
      return;
    }

    if (value < secret) {
      addChip(value + ' ↑', 'up');
      setFeedback('hot', '⬆️', 'Daha büyük bir sayı söyle.', 'Tuttuğum sayı ' + value + ' sayısından büyük.');
    } else {
      addChip(value + ' ↓', 'down');
      setFeedback('cold', '⬇️', 'Daha küçük bir sayı söyle.', 'Tuttuğum sayı ' + value + ' sayısından küçük.');
    }

    input.value = '';
    if (attempts >= MAX_ATTEMPTS) {
      finish(false);
    } else {
      input.focus();
    }
  });

  submit.addEventListener('click', function (event) {
    if (over) { event.preventDefault(); reset(); }
  });

  reset();
})();
</script>
</body>
</html>
`

mkdirSync(output, { recursive: true })
writeFileSync(`${output}/index.html`, html)
writeFileSync(`${output}/.build-complete`, `${new Date().toISOString()}\n`)
console.log(`Built ${output}/index.html (${statSync(`${output}/index.html`).size} bytes)`)
