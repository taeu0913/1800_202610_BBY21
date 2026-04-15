const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  document.documentElement.setAttribute('data-theme', savedTheme);
}

const darkBtn = document.getElementById('darkModeBtn');
const lightBtn = document.getElementById('lightModeBtn');

if (darkBtn) {
  darkBtn.addEventListener('click', () => {
    localStorage.setItem('theme', 'dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  });
}

if (lightBtn) {
  lightBtn.addEventListener('click', () => {
    localStorage.setItem('theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
  });
}