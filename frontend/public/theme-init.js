try {
  if (localStorage.getItem('ca-theme') === 'dark') {
    document.documentElement.classList.add('dark');
  }
} catch {
  // The default theme remains active if browser storage is unavailable.
}
