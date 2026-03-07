// store/theme.js — gerencia dark/light mode
export function getTheme() {
  return localStorage.getItem('teachly_theme') || 'dark';
}
export function setTheme(t) {
  localStorage.setItem('teachly_theme', t);
  document.documentElement.setAttribute('data-theme', t);
}
export function initTheme() {
  const t = getTheme();
  document.documentElement.setAttribute('data-theme', t);
  return t;
}
