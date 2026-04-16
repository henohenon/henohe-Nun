const link = document.getElementById('favicon') as HTMLLinkElement | null;
if (link) {
  const base = link.href.replace(/favicon\/favicon\.ico$/, '');
  const frames = [1, 2, 3, 4].map((i) => `${base}favicon/wave0${i}.png`);
  let i = 0;
  setInterval(() => {
    link.href = frames[i];
    i = (i + 1) % frames.length;
  }, 667);
}
