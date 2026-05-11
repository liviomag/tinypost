// Scroll + Vorauswahl der passenden Option für alle CTA-Buttons.
const offerButtons = document.querySelectorAll('.js-select-offer');
const contactSection = document.getElementById('kontakt');
offerButtons.forEach((button) => {
  button.addEventListener('click', () => {
    contactSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

const scrollButtons = document.querySelectorAll('.js-scroll-target');

scrollButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const targetId = button.dataset.target;
    const targetEl = document.getElementById(targetId);
    if (!targetEl) return;
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// Lead-Formular: clientseitige Validierung + Webhook-Übertragung.
const leadForm = document.getElementById('leadForm');
const messageEl = document.getElementById('formMessage');

let runtimeConfigPromise;

async function getRuntimeConfig() {
  if (!runtimeConfigPromise) {
    runtimeConfigPromise = fetch('webhook-config.json', { cache: 'no-store' }).then(async (response) => {
      if (!response.ok) {
        throw new Error('Konfiguration konnte nicht geladen werden.');
      }

      return response.json();
    });
  }

  return runtimeConfigPromise;
}

async function getWebhookUrl() {
  const config = await getRuntimeConfig();

  if (!config.webhookUrl || typeof config.webhookUrl !== 'string') {
    throw new Error('Webhook-URL fehlt in der Konfiguration.');
  }

  return config.webhookUrl;
}

const proofImageFields = {
  furniture: {
    before: document.getElementById('proof-furniture-before'),
    after: document.getElementById('proof-furniture-after')
  },
  rendering: {
    before: document.getElementById('proof-render-before'),
    after: document.getElementById('proof-render-after')
  },
  volumeModel: {
    before: document.getElementById('proof-volume-before'),
    after: document.getElementById('proof-volume-after')
  }
};

function applyProofImage(targetEl, imageUrl, fallbackLabel) {
  if (!targetEl) return;
  if (imageUrl && typeof imageUrl === 'string') {
    targetEl.src = imageUrl;
    return;
  }

  const label = encodeURIComponent(fallbackLabel);
  targetEl.src = `https://placehold.co/640x420/eceff1/1b2024?text=${label}`;
}

async function applyProofImagesFromConfig() {
  try {
    const config = await getRuntimeConfig();
    const proofImages = config.proofImages || {};

    applyProofImage(proofImageFields.furniture.before, proofImages.furniture?.before, 'Vorher');
    applyProofImage(proofImageFields.furniture.after, proofImages.furniture?.after, 'Nachher');

    applyProofImage(proofImageFields.rendering.before, proofImages.rendering?.before, 'Vorher');
    applyProofImage(proofImageFields.rendering.after, proofImages.rendering?.after, 'Nachher');

    applyProofImage(proofImageFields.volumeModel.before, proofImages.volumeModel?.before, 'Vorher');
    applyProofImage(proofImageFields.volumeModel.after, proofImages.volumeModel?.after, 'Nachher');
  } catch (error) {
    applyProofImage(proofImageFields.furniture.before, '', 'Vorher');
    applyProofImage(proofImageFields.furniture.after, '', 'Nachher');
    applyProofImage(proofImageFields.rendering.before, '', 'Vorher');
    applyProofImage(proofImageFields.rendering.after, '', 'Nachher');
    applyProofImage(proofImageFields.volumeModel.before, '', 'Vorher');
    applyProofImage(proofImageFields.volumeModel.after, '', 'Nachher');
  }
}

leadForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const firstName = document.getElementById('firstName');
  const email = document.getElementById('email');

  if (!firstName.value.trim() || !email.value.trim()) {
    messageEl.textContent = 'Bitte füllen Sie alle Felder aus.';
    messageEl.className = 'form-message error';
    return;
  }

  if (!leadForm.checkValidity()) {
    messageEl.textContent = 'Bitte prüfen Sie Ihre Angaben.';
    messageEl.className = 'form-message error';
    return;
  }

  const payload = {
    firstName: firstName.value.trim(),
    email: email.value.trim(),
    interestedIn: 'Dienstleistung'
  };

  try {
    const webhookUrl = await getWebhookUrl();
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!webhookResponse.ok) {
      throw new Error('Webhook konnte nicht versendet werden.');
    }

    messageEl.textContent = 'Vielen Dank. Wir melden uns zeitnah bei Ihnen.';
    messageEl.className = 'form-message success';
    leadForm.reset();
  } catch (error) {
    messageEl.textContent = 'Fehler beim Senden. Bitte später erneut versuchen.';
    messageEl.className = 'form-message error';
  }
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
applyProofImagesFromConfig();
