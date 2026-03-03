// Context-aware greeting from ashtakaliya-lila, ekadasi, and festivals
// FEATURE: greeting — dashboard header in app/index.html

const LILA = [
  [22.8, 3.6,  ['The rasa-lila unfolds in the deepest hours. You keep vigil.', 'Past midnight — rare and precious dedication.', 'Night watch, like the devotees at the gates of Vrindavan.']],
  [3.6,  6,    ['Before the world stirs — this hour belongs to Hari.', 'Mangala hour. The lotus opens first.', 'In Vrindavan, the cowherd boys just stirred. So did you.']],
  [6,    8.4,  ['The gopas blow their horns. Vrindavan wakes. Your seva begins.', 'Morning — the calves are let loose. Fresh seva, most pure.', 'The cowherd boys go singing into the forest. Where does your devotion lead?']],
  [8.4,  10.8, ['Midmorning in Vrindavan. The calves play; the devotees serve.', 'The forenoon deepens. So does service, offered with care.']],
  [10.8, 15.6, ['High noon. Offer the fruits of your morning.', 'Afternoon stretches long. Fill it well.', 'The noon sun is strong. So is steady devotion.']],
  [15.6, 18,   ['The cowherd boys return, singing, dust on their feet. The afternoon gathers.', 'Late afternoon — good time to review, reflect, and serve.']],
  [18,   20.4, ['Sandhya-arati in Vrindavan. The lamps are lit.', 'Evening comes. Light a lamp, even a small one.', 'The Yamuna reflects the setting sun. What will you offer tonight?']],
  [20.4, 22.8, ['The temple lamps burn low but steady. So does your service.', 'Night deepens. Krishna rests; devotees read and chant.']],
]

const FESTIVALS = {
  '2026-01-31': 'Nityananda Trayodashi',
  '2026-03-03': 'Gaura Purnima',
  '2026-03-27': 'Sri Rama Navami',
  '2026-04-20': 'Akshaya Tritiya',
  '2026-04-30': 'Narasimha Chaturdasi',
  '2026-06-27': 'Panihati Chida-dahi Utsava',
  '2026-07-16': 'Ratha Yatra',
  '2026-07-29': 'Guru Purnima',
  '2026-09-04': 'Sri Krishna Janmashtami',
  '2026-09-05': 'Srila Prabhupada Appearance',
  '2026-09-19': 'Radhashtami',
  '2026-11-10': 'Govardhana Puja',
  '2026-11-13': 'Srila Prabhupada Disappearance',
  '2026-11-24': 'Damodara Purnima',
}

const FESTIVAL_PHRASES = {
  'Nityananda Trayodashi': "Nityananda Trayodashi — Lord Nitai's compassion knows no condition.",
  'Gaura Purnima': "Gaura Purnima — Lord Caitanya appeared to fill every heart with the Holy Name.",
  'Sri Rama Navami': "Sri Rama Navami — may Lord Ramacandra's steadfast virtue guide your service today.",
  'Akshaya Tritiya': "Akshaya Tritiya — whatever is offered today multiplies without end.",
  'Narasimha Chaturdasi': "Narasimha Chaturdasi — He who appeared from a pillar to protect His devotee. Jai Narasimha!",
  'Panihati Chida-dahi Utsava': "Panihati festival — in the spirit of Raghunatha dasa, serve prasad freely.",
  'Ratha Yatra': "Ratha Yatra! Lord Jagannatha rides out to meet His devotees in the street.",
  'Guru Purnima': "Guru Purnima — honor the one who carries you across the ocean of ignorance.",
  'Sri Krishna Janmashtami': "Sri Krishna Janmashtami — fast until midnight. The Lord of all worlds is about to appear.",
  'Srila Prabhupada Appearance': "Vyasa-puja — Srila Prabhupada's appearance day. His books are the law books for the next ten thousand years.",
  'Radhashtami': "Radhashtami — Srimati Radharani's appearance. She who embodies pure devotional service.",
  'Govardhana Puja': "Govardhana Puja — one who shelters the devotees is always worshipable.",
  'Srila Prabhupada Disappearance': "Srila Prabhupada's disappearance day — his mercy is still pouring. Read, chant, serve.",
  'Damodara Purnima': "Damodara Purnima — Mother Yashoda's love bound the Unlimited.",
}

const EKADASI_PHRASES = [
  'Hari Hari — Ekadasi arrived. Fast light, pray deep.',
  'Ekadasi: step lightly on the earth, heavily in devotion.',
  'Today Vishnu is most pleased with fasting and hearing. Seize it.',
  'Ekadasi — the day that cuts the material knot. Offer it fully.',
]

const SUNDAY_PHRASES = [
  'Sunday feast — when the doors are widest open.',
  'Feast day. The kitchen is a temple today.',
]

const RETURN_PHRASES = {
  first:  'First step in the temple. May it be the first of thousands.',
  month:  'A month of Vaikuntha time passed. The service continues.',
  week:   'A week away. The service continues whether or not we show up.',
  recent: 'You were just here. The spirit does not sleep.',
}

const pick = a => a[Math.floor(Math.random() * a.length)]

function tithi(date) {
  const JD = +date / 86400000 + 2440587.5
  const T = (JD - 2451545) / 36525
  const D = ((297.85036 + 445267.11480 * T - 0.0019142 * T * T) % 360 + 360) % 360
  return Math.floor(D / 12) % 30 + 1
}

function isEkadasi(date) { const t = tithi(date); return t === 11 || t === 26 }

function localDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function festival(date) { return FESTIVALS[localDate(date)] || null }

function lilaPhases(h) {
  for (const [start, end, phrases] of LILA)
    if (start < end ? h >= start && h < end : h >= start || h < end) return phrases
  return LILA[3][2]
}

export function greeting(date, vis) {
  const fest = festival(date)
  if (fest) return FESTIVAL_PHRASES[fest] || `${fest} — may this day deepen your devotion.`
  if (isEkadasi(date)) return pick(EKADASI_PHRASES)

  const pool = [...lilaPhases(date.getHours())]
  if (date.getDay() === 0) pool.push(pick(SUNDAY_PHRASES))
  if (vis === Infinity || vis == null) pool.push(RETURN_PHRASES.first)
  else if (vis > 720) pool.push(RETURN_PHRASES.month)
  else if (vis > 168) pool.push(RETURN_PHRASES.week)
  else if (vis > 0 && vis < 2) pool.push(RETURN_PHRASES.recent)

  return pick(pool)
}
