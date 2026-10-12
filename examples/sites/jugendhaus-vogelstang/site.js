document.body.classList.add('js-enabled');

const menuButton = document.querySelector('.nav-toggle');
const navigation = document.querySelector('.nav');
if (menuButton && navigation) {
  const mobileMenu = window.matchMedia('(max-width: 700px)');
  const setMenu = (expanded) => {
    menuButton.setAttribute('aria-expanded', String(expanded));
    navigation.classList.toggle('is-open', expanded);
    navigation.inert = mobileMenu.matches && !expanded;
  };
  const closeMenu = () => setMenu(false);
  closeMenu();
  mobileMenu.addEventListener('change', closeMenu);
  menuButton.addEventListener('click', () => {
    setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
  });
  navigation.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) closeMenu();
  });
  document.addEventListener('click', (event) => {
    if (event.target instanceof Node && !menuButton.contains(event.target) && !navigation.contains(event.target)) closeMenu();
  });
  navigation.addEventListener('focusout', (event) => {
    if (event.relatedTarget instanceof Node && !navigation.contains(event.relatedTarget) && !menuButton.contains(event.relatedTarget)) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuButton.focus();
    }
  });
}

const filters = document.querySelectorAll('[data-filter]');
const program = document.querySelector('.program-grid') || document.querySelector('.week-grid');
const slots = program ? program.querySelectorAll('[data-audience]') : [];
const filterStatus = document.querySelector('#filter-status');
for (const button of filters) {
  button.addEventListener('click', () => {
    const audience = button.getAttribute('data-filter');
    for (const filter of filters) filter.setAttribute('aria-pressed', String(filter === button));
    let count = 0;
    for (const slot of slots) {
      const value = slot.getAttribute('data-audience');
      const group = value === 'Kinder' ? 'children' : value === 'Teens & junge Erwachsene' ? 'teens' : value;
      const visible = audience === 'all' || group === audience;
      slot.hidden = !visible;
      if (visible) count++;
    }
    if (program) {
      for (const offer of program.querySelectorAll('.program-offer')) {
        const offerSlots = [...offer.querySelectorAll('[data-audience]')];
        offer.hidden = offerSlots.length === 0 || offerSlots.every((slot) => slot.hidden);
      }
    }
    if (filterStatus) filterStatus.textContent = `${count} Programmeinträge angezeigt.`;
  });
}
if (filterStatus) filterStatus.textContent = `${slots.length} Programmeinträge angezeigt.`;
