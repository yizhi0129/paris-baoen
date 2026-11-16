const slides = [
  {
    zh: ['TEMPLE BAO’EN · PARIS', '巴黎报恩寺', '在巴黎，一起学习佛法、交流文化，也为日常留一刻安静。', '认识报恩寺'],
    fr: ['巴黎报恩寺', 'Temple Bao’en', 'À Paris, étudier le bouddhisme, partager des cultures et trouver un moment de calme.', 'Découvrir le temple'],
    href: '#about',
  },
  {
    zh: ['PROGRAMME', '从学习开始', '了解阿毗达磨与生活、中文教学两项课程。', '浏览课程'],
    fr: ['课程', 'Le plaisir d’apprendre', 'Découvrez les enseignements sur l’Abhidharma et les cours de chinois.', 'Voir le programme'],
    href: '#programme',
  },
  {
    zh: ['ACTIVITÉS', '相聚在巴黎', '看看烛光之夜、养老院探访和音乐会。', '浏览活动'],
    fr: ['寺院活动', 'Se retrouver à Paris', 'Des rencontres à la lueur des bougies, en maison de retraite ou autour d’un concert.', 'Voir les activités'],
    href: '#activities',
  },
];

// Add confirmed events as { date: 'YYYY-MM-DD', time: 'HH:mm', zh: '…', fr: '…' }.
const events = [];

const byId = (id) => document.getElementById(id);
const languageButtons = document.querySelectorAll('[data-lang]');
const dots = [...document.querySelectorAll('[data-slide]')];
const navigation = byId('navigation');
const menuToggle = document.querySelector('.menu-toggle');
const dropdowns = [...navigation.querySelectorAll('details')];
const localizedLabels = [
  ['nav', '主导航', 'Navigation principale'],
  ['.hero', '巴黎报恩寺', 'Temple Bao’en'],
  ['.slide-dots', '轮播', 'Diaporama'],
  ['[data-step="-1"]', '上一张', 'Diapositive précédente'],
  ['[data-step="1"]', '下一张', 'Diapositive suivante'],
  ['[data-month="-1"]', '上个月', 'Mois précédent'],
  ['[data-month="1"]', '下个月', 'Mois suivant'],
];
const timeZone = 'Europe/Paris';
const todayParts = new Intl.DateTimeFormat('en-CA', {
  timeZone, year: 'numeric', month: 'numeric', day: 'numeric',
}).formatToParts(new Date());
const parisPart = (type) => Number(todayParts.find((part) => part.type === type).value);
const today = new Date(Date.UTC(parisPart('year'), parisPart('month') - 1, parisPart('day')));
const dateKey = (date) => date.toISOString().slice(0, 10);
let selected = today;
let month = monthStart(today);
let slide = 0;
let language = 'zh';

try {
  if (localStorage.getItem('baoen-language') === 'fr') language = 'fr';
} catch {
  // Language switching also works when browser storage is unavailable.
}

function monthStart(date, offset = 0) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1));
}

function formatDate(date, options) {
  return new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'fr-FR', {
    ...options, timeZone: 'UTC',
  }).format(date);
}

function renderSlide() {
  const current = slides[slide];
  const [label, title, description, action] = current[language];
  byId('hero-label').textContent = label;
  byId('hero-title').textContent = title;
  byId('hero-description').textContent = description;
  byId('hero-action').textContent = action;
  byId('hero-link').href = current.href;
  document.querySelector('.hero').dataset.slide = slide;
  dots.forEach((dot, index) => {
    dot.setAttribute('aria-label', slides[index][language][1]);
    if (index === slide) dot.setAttribute('aria-current', 'true');
    else dot.removeAttribute('aria-current');
  });
}

function renderAgenda() {
  byId('selected-date').textContent = formatDate(selected, {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  const container = byId('agenda-events');
  const scheduled = events.filter((event) => event.date === dateKey(selected))
    .sort((first, second) => first.time.localeCompare(second.time));
  if (!scheduled.length) {
    const message = document.createElement('p');
    message.textContent = language === 'zh'
      ? '这一天暂无已公布的安排。'
      : 'Aucun événement annoncé pour cette date.';
    container.replaceChildren(message);
    return;
  }
  const list = document.createElement('ul');
  for (const event of scheduled) {
    const item = document.createElement('li');
    item.textContent = [event.time, event[language]].filter(Boolean).join(' · ');
    list.append(item);
  }
  container.replaceChildren(list);
}

function renderCalendar() {
  byId('month').textContent = formatDate(month, { year: 'numeric', month: 'long' });
  const weekdays = (language === 'zh' ? '一 二 三 四 五 六 日' : 'Lun Mar Mer Jeu Ven Sam Dim').split(' ');
  byId('week').replaceChildren(...weekdays.map((weekday) => {
    const cell = document.createElement('span');
    cell.textContent = weekday;
    return cell;
  }));

  const cells = document.createDocumentFragment();
  const firstWeekday = (month.getUTCDay() + 6) % 7;
  for (let index = 0; index < firstWeekday; index++) {
    const blank = document.createElement('span');
    blank.setAttribute('aria-hidden', 'true');
    cells.append(blank);
  }
  const monthLength = new Date(monthStart(month, 1).getTime() - 86400000).getUTCDate();
  for (let day = 1; day <= monthLength; day++) {
    const date = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), day));
    const value = dateKey(date);
    const button = document.createElement('button');
    button.className = 'day';
    button.type = 'button';
    button.textContent = day;
    button.dataset.date = value;
    button.setAttribute('aria-label', formatDate(date, { dateStyle: 'full' }));
    button.setAttribute('aria-pressed', String(value === dateKey(selected)));
    if (value === dateKey(today)) button.setAttribute('aria-current', 'date');
    cells.append(button);
  }
  byId('days').replaceChildren(cells);
  renderAgenda();
}

function renderLanguage() {
  document.documentElement.lang = language === 'zh' ? 'zh-Hans' : 'fr';
  document.title = language === 'zh' ? '巴黎报恩寺 · Temple Bao’en Paris' : 'Temple Bao’en Paris · 巴黎报恩寺';
  document.querySelectorAll('[data-copy]').forEach((element) => {
    element.textContent = element.dataset.copy.split('|')[language === 'zh' ? 0 : 1];
  });
  localizedLabels.forEach(([selector, zh, fr]) => {
    document.querySelector(selector).setAttribute('aria-label', language === 'zh' ? zh : fr);
  });
  languageButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.lang === language)));
  renderSlide();
  renderCalendar();
}

function closeNavigation() {
  menuToggle.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
  dropdowns.forEach((dropdown) => { dropdown.open = false; });
}

for (const button of languageButtons) {
  button.addEventListener('click', () => {
    language = button.dataset.lang;
    try {
      localStorage.setItem('baoen-language', language);
    } catch {
      // The current selection is still available for this page.
    }
    renderLanguage();
  });
}

for (const dot of dots) {
  dot.addEventListener('click', () => {
    slide = Number(dot.dataset.slide);
    renderSlide();
  });
}

document.querySelectorAll('[data-step]').forEach((button) => {
  button.addEventListener('click', () => {
    slide = (slide + Number(button.dataset.step) + slides.length) % slides.length;
    renderSlide();
  });
});

document.querySelectorAll('[data-month]').forEach((button) => {
  button.addEventListener('click', () => {
    month = monthStart(month, Number(button.dataset.month));
    selected = month.getTime() === monthStart(today).getTime() ? today : month;
    renderCalendar();
  });
});

byId('days').addEventListener('click', (event) => {
  const button = event.target.closest('[data-date]');
  if (!button) return;
  const previous = byId('days').querySelector('[aria-pressed="true"]');
  if (previous) previous.setAttribute('aria-pressed', 'false');
  selected = new Date(button.dataset.date);
  button.setAttribute('aria-pressed', 'true');
  renderAgenda();
});

menuToggle.addEventListener('click', () => {
  if (navigation.classList.contains('is-open')) {
    closeNavigation();
  } else {
    menuToggle.setAttribute('aria-expanded', 'true');
    navigation.classList.add('is-open');
  }
});

for (const dropdown of dropdowns) {
  dropdown.addEventListener('toggle', () => {
    if (!dropdown.open) return;
    dropdowns.filter((other) => other !== dropdown).forEach((other) => { other.open = false; });
  });
}

document.addEventListener('click', (event) => {
  if (event.target.closest('nav a') || !event.target.closest('.header-inner')) closeNavigation();
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const openDropdown = dropdowns.find((dropdown) => dropdown.open);
  if (openDropdown) {
    openDropdown.open = false;
    openDropdown.querySelector('summary').focus();
  } else if (navigation.classList.contains('is-open')) {
    closeNavigation();
    menuToggle.focus();
  }
});

byId('year').textContent = today.getUTCFullYear();
renderLanguage();
