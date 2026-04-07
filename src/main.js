
const theme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', theme);

document.getElementById('darkModeBtn').addEventListener('click', () => {
  localStorage.setItem('theme', 'dark');
  document.documentElement.setAttribute('data-theme', 'dark');
  // optionally still save to Firestore for cross-device sync
});

document.getElementById('lightModeBtn').addEventListener('click', () => {
  localStorage.setItem('theme', 'light');
  document.documentElement.setAttribute('data-theme', 'light');
});