const defaultBaseUrl = 'http://localhost:3001';
const storageKey = 'romlekDesktopBaseUrl';

const frame = document.querySelector('#romlek-frame');
const navItems = Array.from(document.querySelectorAll('.nav-item'));
const pageTitle = document.querySelector('#page-title');
const pageUrl = document.querySelector('#page-url');
const reloadButton = document.querySelector('#reload-frame');
const serverForm = document.querySelector('#server-form');
const serverInput = document.querySelector('#server-url');

let baseUrl = localStorage.getItem(storageKey) || defaultBaseUrl;
let activePath = '/feed';

function normalizeBaseUrl(value) {
  return value.trim().replace(/\/+$/, '') || defaultBaseUrl;
}

function getPageLabel(path) {
  const activeItem = navItems.find((item) => item.dataset.path === path);
  return activeItem ? activeItem.textContent.trim() : 'Romlek';
}

function renderFrame(path) {
  activePath = path;
  const targetUrl = `${baseUrl}${path}`;

  navItems.forEach((item) => {
    item.classList.toggle('active', item.dataset.path === path);
  });

  pageTitle.textContent = getPageLabel(path);
  pageUrl.textContent = targetUrl;
  frame.src = targetUrl;
}

serverInput.value = baseUrl;

navItems.forEach((item) => {
  item.addEventListener('click', () => {
    renderFrame(item.dataset.path);
  });
});

reloadButton.addEventListener('click', () => {
  frame.src = frame.src;
});

serverForm.addEventListener('submit', (event) => {
  event.preventDefault();
  baseUrl = normalizeBaseUrl(serverInput.value);
  localStorage.setItem(storageKey, baseUrl);
  serverInput.value = baseUrl;
  renderFrame(activePath);
});

renderFrame(activePath);
