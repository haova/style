import 'virtual:uno.css';

const root = document.documentElement;
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

document.querySelector('#toggle-scheme')?.addEventListener('click', () => {
  const current =
    root.dataset.theme ?? (prefersDark.matches ? 'dark' : 'light');
  root.dataset.theme = current === 'dark' ? 'light' : 'dark';
});

document.querySelector('#default-scheme')?.addEventListener('click', () => {
  delete root.dataset.theme;
});
