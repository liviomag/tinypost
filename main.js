// Smooth lead-flow interactions for Visualize Estate.
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#contact-form");
  const message = document.querySelector("#form-message");
  const leadSection = document.querySelector("#lead-form");
  const revealItems = document.querySelectorAll(".reveal");
  const ctaButtons = document.querySelectorAll(".cta-trigger");

  const optionInputs = {
    service: form?.querySelector('input[name="angebot"][value="service"]'),
    saas: form?.querySelector('input[name="angebot"][value="saas"]')
  };

  const setInterestOption = (option) => {
    if (optionInputs[option]) {
      optionInputs[option].checked = true;
    }
  };

  // CTA buttons scroll to form and pre-select the corresponding option.
  ctaButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selected = button.dataset.option;
      setInterestOption(selected);
      leadSection?.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => form?.querySelector("#firstname")?.focus(), 350);
    });
  });

  // Lightweight reveal-on-scroll using IntersectionObserver.
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  revealItems.forEach((item) => observer.observe(item));

  // Client-side validation + success feedback.
  form?.addEventListener("submit", (event) => {
    event.preventDefault();

    const selectedOption = form.querySelector('input[name="angebot"]:checked');
    const firstName = form.querySelector("#firstname")?.value.trim();
    const email = form.querySelector("#email")?.value.trim();

    if (!selectedOption || !firstName || !email) {
      message.textContent = "Bitte füllen Sie alle Felder aus.";
      message.className = "form-message error";
      return;
    }

    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailIsValid) {
      message.textContent = "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
      message.className = "form-message error";
      return;
    }

    message.textContent = "Vielen Dank. Wir melden uns zeitnah bei Ihnen.";
    message.className = "form-message success";

    form.reset();
  });
});
