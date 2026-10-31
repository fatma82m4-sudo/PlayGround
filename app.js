const MAX_HAK = 5

const card = document.querySelector('#oyun')
const form = document.querySelector('#form')
const input = document.querySelector('#tahmin')
const button = document.querySelector('#tahmin-btn')
const dots = document.querySelector('#haklar')
const status = document.querySelector('#durum')
const history = document.querySelector('#gecmis')
const again = document.querySelector('#yeniden')

let hedef = 0
let kalan = MAX_HAK
let bitti = false
let tahminler = []

const hassasIsaretci = window.matchMedia('(hover: hover) and (pointer: fine)').matches

function odakla(options) {
  if (hassasIsaretci) input.focus(options)
}

function mesaj(text, tone = '') {
  status.textContent = text
  status.classList.remove('win', 'lose', 'hint', 'warn')
  if (tone) status.classList.add(tone)
}

function haklariCiz() {
  dots.replaceChildren(
    ...Array.from({ length: MAX_HAK }, (_, index) => {
      const dot = document.createElement('i')
      dot.classList.toggle('on', index < kalan)
      dot.classList.toggle('spent', index >= kalan)
      return dot
    })
  )
  dots.setAttribute('aria-label', `${kalan} hak kaldı`)
}

function gecmisiCiz() {
  if (!tahminler.length) {
    const empty = document.createElement('li')
    empty.className = 'empty'
    empty.textContent = 'Henüz tahmin yok.'
    history.replaceChildren(empty)
    return
  }

  history.replaceChildren(
    ...tahminler.map(({ sayi, sonuc }) => {
      const item = document.createElement('li')
      item.className = sonuc
      const icon = sonuc === 'up' ? '⬆' : sonuc === 'down' ? '⬇' : '✓'
      item.textContent = `${sayi} ${icon}`
      return item
    })
  )
}

function oyunuBitir(kazandi) {
  bitti = true
  card.dataset.state = kazandi ? 'won' : 'lost'
  input.disabled = true
  button.disabled = true
  again.hidden = false
  again.focus({ preventScroll: true })
}

function tahminEt() {
  if (bitti) return

  const raw = input.value.trim()
  if (!/^\d+$/.test(raw)) {
    mesaj('Lütfen 1 ile 100 arasında bir tam sayı gir.', 'warn')
    input.classList.add('shake')
    setTimeout(() => input.classList.remove('shake'), 400)
    odakla()
    return
  }

  const sayi = Number(raw)
  if (sayi < 1 || sayi > 100) {
    mesaj('Tahminin 1 ile 100 arasında olmalı.', 'warn')
    input.classList.add('shake')
    setTimeout(() => input.classList.remove('shake'), 400)
    odakla()
    input.select()
    return
  }

  if (tahminler.some((t) => t.sayi === sayi)) {
    mesaj(`${sayi} sayısını zaten denedin. Başka bir sayı seç.`, 'warn')
    odakla()
    input.select()
    return
  }

  kalan -= 1
  input.value = ''

  if (sayi === hedef) {
    tahminler.unshift({ sayi, sonuc: 'hit' })
    gecmisiCiz()
    haklariCiz()
    mesaj(`Tebrikler! ${sayi} sayısını ${MAX_HAK - kalan} tahminde buldun! 🏆`, 'win')
    oyunuBitir(true)
    return
  }

  const sonuc = sayi < hedef ? 'up' : 'down'
  tahminler.unshift({ sayi, sonuc })
  gecmisiCiz()
  haklariCiz()

  if (kalan === 0) {
    mesaj(`Hakkın bitti. Aklımdaki sayı ${hedef} idi. 😢`, 'lose')
    oyunuBitir(false)
    return
  }

  if (sayi < hedef) {
    mesaj(`Daha büyük bir sayı söyle ⬆️  (${kalan} hakkın kaldı)`, 'hint')
  } else {
    mesaj(`Daha küçük bir sayı söyle ⬇️  (${kalan} hakkın kaldı)`, 'hint')
  }

  odakla()
}

function yeniOyun() {
  hedef = Math.floor(Math.random() * 100) + 1
  kalan = MAX_HAK
  bitti = false
  tahminler = []
  card.dataset.state = 'playing'
  input.disabled = false
  button.disabled = false
  input.value = ''
  again.hidden = true
  mesaj('İlk tahminini yap, sana yön vereyim.')
  haklariCiz()
  gecmisiCiz()
  odakla({ preventScroll: true })
}

form.addEventListener('submit', (event) => {
  event.preventDefault()
  tahminEt()
})

again.addEventListener('click', yeniOyun)

yeniOyun()
