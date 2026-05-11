// Scroll + Vorauswahl der passenden Option für alle CTA-Buttons.
const offerButtons = document.querySelectorAll('.js-select-offer');
const contactSection = document.getElementById('kontakt');
const optionService = document.getElementById('option-service');
const optionSaas = document.getElementById('option-saas');

function selectOfferAndScroll(offer) {
  if (offer === 'service') optionService.checked = true;
  if (offer === 'saas') optionSaas.checked = true;

  contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

offerButtons.forEach((button) => {
  button.addEventListener('click', () => {
    selectOfferAndScroll(button.dataset.offer);
  });
});

// Lead-Formular: clientseitige Validierung + Erfolgsmeldung ohne Backend.
const leadForm = document.getElementById('leadForm');
const messageEl = document.getElementById('formMessage');

leadForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const selectedOffer = leadForm.querySelector('input[name="angebot"]:checked');
  const firstName = document.getElementById('firstName');
  const email = document.getElementById('email');

  if (!selectedOffer || !firstName.value.trim() || !email.value.trim()) {
    messageEl.textContent = 'Bitte füllen Sie alle Felder aus.';
    messageEl.className = 'form-message error';
    return;
  }

  if (!leadForm.checkValidity()) {
    messageEl.textContent = 'Bitte prüfen Sie Ihre Angaben.';
    messageEl.className = 'form-message error';
    return;
  }

  messageEl.textContent = 'Vielen Dank. Wir melden uns zeitnah bei Ihnen.';
  messageEl.className = 'form-message success';

  leadForm.reset();
});

// Dezente Scroll-Reveal-Animation per IntersectionObserver.
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);

reveals.forEach((el) => observer.observe(el));


// Branding-Uploads: Favicon + Kopfbereich-Logo im Browser speichern.
const faviconEl = document.getElementById("favicon");
const heroLogoEl = document.getElementById("heroLogo");
const faviconUpload = document.getElementById("faviconUpload");
const heroLogoUpload = document.getElementById("heroLogoUpload");

function applyStoredBranding() {
  const storedFavicon = localStorage.getItem("customFavicon");
  const storedHeroLogo = localStorage.getItem("customHeroLogo");

  if (storedFavicon) faviconEl.href = storedFavicon;
  if (storedHeroLogo) heroLogoEl.src = storedHeroLogo;
}

function fileToDataURL(file, callback) {
  const reader = new FileReader();
  reader.onload = () => callback(reader.result);
  reader.readAsDataURL(file);
}

faviconUpload?.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  fileToDataURL(file, (dataUrl) => {
    faviconEl.href = dataUrl;
    localStorage.setItem("customFavicon", dataUrl);
  });
});

heroLogoUpload?.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  fileToDataURL(file, (dataUrl) => {
    heroLogoEl.src = dataUrl;
    localStorage.setItem("customHeroLogo", dataUrl);
  });
});

applyStoredBranding();
