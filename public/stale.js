// Served instead of any /_astro/ file that no longer exists (rule in public/_redirects).
// Only a page kept in the browser cache from an earlier deploy asks for such a file: it would
// render without styles. Fetch the page again past the cache, then reload once.
(() => {
  const key = 'qarip:stale-reload';
  try {
    if (Date.now() - Number(sessionStorage.getItem(key) || 0) < 30000) return;
    sessionStorage.setItem(key, String(Date.now()));
  } catch {
    return;
  }
  fetch(location.href, { cache: 'reload', credentials: 'same-origin' })
    .catch(() => {})
    .finally(() => location.reload());
})();
