// Add confirmed events as { date: 'YYYY-MM-DD', time: 'HH:mm', zh: '…', fr: '…' }.
const events = [];

const byId = (id) => document.getElementById(id);
const languageButtons = document.querySelectorAll('[data-lang]');
const navigation = byId('navigation');
const menuToggle = document.querySelector('.menu-toggle');
const dropdowns = [...navigation.querySelectorAll('details')];
const localizedLabels = [
  ['.hero-controls', '首图轮播', 'Diaporama d’accueil'],
  ['nav', '主导航', 'Navigation principale'],
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
  const pageTitles = byId('main').dataset.title?.split('|');
  document.title = pageTitles?.[language === 'zh' ? 0 : 1]
    ?? (language === 'zh' ? '巴黎报恩寺 · Temple Bao’en Paris' : 'Temple Bao’en Paris · 巴黎报恩寺');
  document.querySelectorAll('[data-copy]').forEach((element) => {
    element.textContent = element.dataset.copy.split('|')[language === 'zh' ? 0 : 1];
  });
  localizedLabels.forEach(([selector, zh, fr]) => {
    document.querySelector(selector)?.setAttribute('aria-label', language === 'zh' ? zh : fr);
  });
  languageButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.lang === language)));
  updateCarouselLanguage?.();
  if (byId('calendar')) renderCalendar();
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

document.querySelectorAll('[data-month]').forEach((button) => {
  button.addEventListener('click', () => {
    month = monthStart(month, Number(button.dataset.month));
    selected = month.getTime() === monthStart(today).getTime() ? today : month;
    renderCalendar();
  });
});

byId('days')?.addEventListener('click', (event) => {
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

function initializeCarousel(track) {
  const carousel = track.closest('.hero');
  const play = byId('hero-play');
  const heroDots = [...carousel.querySelectorAll('[data-hero-slide]')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const slideCount = track.children.length;
  const firstSlide = track.firstElementChild.cloneNode();
  firstSlide.removeAttribute('fetchpriority');
  track.append(firstSlide);
  track.prepend(track.children[slideCount - 1].cloneNode());
  let currentSlide = 0;
  let paused = reducedMotion.matches;
  let slideAnimation;
  let slideTimer;
  let swipeStart;

  function slidePosition(index) {
    return `translateX(-${(index + 1) * 100}%)`;
  }

  function moveHero(step) {
    if (slideAnimation) return;
    const next = currentSlide + step;
    const from = slidePosition(currentSlide);
    const to = slidePosition(next);
    currentSlide = (next + slideCount) % slideCount;
    track.style.transform = slidePosition(currentSlide);
    updateHeroDots();
    if (reducedMotion.matches) return;
    slideAnimation = track.animate([{ transform: from }, { transform: to }], {
      duration: 550,
      easing: 'ease-in-out',
    });
    slideAnimation.onfinish = () => { slideAnimation = undefined; };
  }

  function updatePlaybackLabel() {
    play.setAttribute('aria-label', language === 'zh'
      ? (paused ? '播放轮播' : '暂停轮播')
      : (paused ? 'Lire le diaporama' : 'Mettre le diaporama en pause'));
    play.dataset.paused = String(paused);
    updateHeroDots();
  }

  function scheduleHero() {
    clearInterval(slideTimer);
    if (!paused && !document.hidden && !carousel.matches(':hover, :focus-within')) {
      slideTimer = setInterval(() => moveHero(1), 4000);
    }
  }

  function manualSlide(step) {
    moveHero(step);
    scheduleHero();
  }

  function updateHeroDots() {
    heroDots.forEach((dot, index) => {
      dot.setAttribute('aria-label', language === 'zh' ? `第 ${index + 1} 张照片` : `Photo ${index + 1}`);
      if (index === currentSlide) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  }

  heroDots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      if (index !== currentSlide) manualSlide(index - currentSlide);
    });
  });
  play.addEventListener('click', () => {
    paused = !paused;
    updatePlaybackLabel();
    scheduleHero();
  });

  carousel.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0 || event.target.closest('a, button')) return;
    swipeStart = event;
    carousel.setPointerCapture(event.pointerId);
  });
  carousel.addEventListener('pointerup', (event) => {
    if (swipeStart?.pointerId !== event.pointerId) return;
    const x = event.clientX - swipeStart.clientX;
    const y = event.clientY - swipeStart.clientY;
    swipeStart = undefined;
    if (Math.abs(x) > 40 && Math.abs(x) > Math.abs(y)) manualSlide(x < 0 ? 1 : -1);
  });
  carousel.addEventListener('pointercancel', () => { swipeStart = undefined; });
  carousel.addEventListener('mouseenter', scheduleHero);
  carousel.addEventListener('mouseleave', scheduleHero);
  carousel.addEventListener('focusin', scheduleHero);
  carousel.addEventListener('focusout', () => setTimeout(scheduleHero, 0));
  document.addEventListener('visibilitychange', scheduleHero);
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) paused = true;
    updatePlaybackLabel();
    scheduleHero();
  });

  track.style.transform = slidePosition(currentSlide);
  scheduleHero();
  return updatePlaybackLabel;
}

const heroTrack = document.querySelector('.hero-track');
const updateCarouselLanguage = heroTrack ? initializeCarousel(heroTrack) : null;
renderLanguage();
