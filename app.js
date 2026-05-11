(() => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');

  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
})();

(async () => {
  const mappingPath = 'image-mapping.json';
  const assetsBasePath = 'Assets';

  try {
    const response = await fetch(mappingPath);
    if (!response.ok) {
      throw new Error(`Image mapping konnte nicht geladen werden: ${response.status}`);
    }

    const imageMapping = await response.json();

    document.querySelectorAll('[data-image-key]').forEach((element) => {
      const imageKey = element.dataset.imageKey;
      const imageFile = imageMapping[imageKey];

      if (!imageFile) {
        console.warn(`Kein Bild für Key "${imageKey}" in ${mappingPath} gefunden.`);
        return;
      }

      if (element.tagName === 'IMG') {
        element.src = `${assetsBasePath}/${imageFile}`;
      } else {
        element.style.backgroundImage = `url("${assetsBasePath}/${imageFile}")`;
      }
    });
  } catch (error) {
    console.error('Fehler beim Laden der Bildzuordnung.', error);
  }
})();
