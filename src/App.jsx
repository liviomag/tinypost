import { useMemo, useState } from 'react'
import { ArrowRight, Building2, CheckCircle2, Cpu, Mail, User } from 'lucide-react'

const offers = [
  {
    key: 'dienstleistung',
    title: 'Dienstleistung',
    icon: Building2,
    description:
      'Sie senden uns Ihre Bilder und Wünsche. Wir bearbeiten diese professionell und liefern Ihnen das Ergebnis per E-Mail.',
    steps: ['Kontakt aufnehmen', 'Bild einreichen', 'Ergebnis erhalten'],
    cta: 'Für Dienstleistung eintragen'
  },
  {
    key: 'saas',
    title: 'SaaS-Applikation',
    icon: Cpu,
    description: 'Sie bearbeiten Immobilienbilder selbstständig mit unserer SaaS-Lösung.',
    steps: ['Kontakt aufnehmen', 'Persönliche Beratung', 'Selbstständig bearbeiten'],
    cta: 'Für SaaS eintragen'
  }
]

export default function App() {
  const [form, setForm] = useState({ option: 'dienstleistung', firstName: '', email: '' })
  const [sent, setSent] = useState(false)

  const selectedOffer = useMemo(() => offers.find((offer) => offer.key === form.option), [form.option])

  const scrollToForm = (option) => {
    setForm((prev) => ({ ...prev, option }))
    document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setSent(true)
  }

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-6 pb-12 pt-10 md:pt-16">
        <p className="mb-6 inline-block rounded-full border border-bronze/30 bg-white px-4 py-1 text-xs tracking-[0.22em] text-bronze">VISUALIZE ESTATE</p>
        <div className="grid items-start gap-10 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <h1 className="font-serif text-4xl leading-tight md:text-6xl">Ihre Immobilienbilder. Professionell visualisiert.</h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-charcoal/80 md:text-lg">
              Wählen Sie zwischen unserer schnellen Dienstleistung oder der flexiblen SaaS-Applikation.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => scrollToForm('dienstleistung')} className="group rounded-full bg-charcoal px-6 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-charcoal/90">
                Dienstleistung anfragen <ArrowRight className="ml-2 inline h-4 w-4 transition group-hover:translate-x-0.5" />
              </button>
              <button onClick={() => scrollToForm('saas')} className="group rounded-full border border-bronze/40 bg-white px-6 py-3 text-sm font-medium text-charcoal transition hover:-translate-y-0.5 hover:border-bronze">
                SaaS-Applikation anfragen <ArrowRight className="ml-2 inline h-4 w-4 transition group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>

          <svg viewBox="0 0 220 130" className="hand-arrow mx-auto mt-2 hidden w-64 text-bronze/80 lg:block" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
            <path d="M8 17c38 4 54 19 68 37 18 22 45 26 84 31" />
            <path d="M149 72l12 12-15 8" />
          </svg>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-2">
        {offers.map((offer) => {
          const Icon = offer.icon
          return (
            <article key={offer.key} className="group rounded-3xl bg-white p-7 shadow-soft transition hover:-translate-y-1 hover:shadow-xl">
              <Icon className="h-9 w-9 text-bronze animate-floaty" strokeWidth={1.7} />
              <h2 className="mt-4 font-serif text-2xl">{offer.title}</h2>
              <p className="mt-3 text-charcoal/80">{offer.description}</p>
              <ol className="mt-6 space-y-2 text-sm text-charcoal/85">
                {offer.steps.map((step, index) => (
                  <li key={step} className="flex items-center gap-3">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-bronze/35 text-xs text-bronze">{index + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
              <button onClick={() => scrollToForm(offer.key)} className="mt-7 w-full rounded-full border border-charcoal/20 px-4 py-3 text-sm font-medium transition hover:border-bronze hover:text-bronze">
                {offer.cta}
              </button>
            </article>
          )
        })}
      </section>

      <section id="lead-form" className="mx-auto max-w-3xl px-6 pb-16 pt-14">
        <div className="rounded-3xl border border-bronze/20 bg-white p-7 shadow-soft md:p-9">
          <h3 className="font-serif text-3xl">Kontaktaufnahme sichern</h3>
          <p className="mt-2 text-charcoal/75">Teilen Sie uns kurz Ihre Präferenz mit. Wir melden uns zeitnah persönlich bei Ihnen.</p>

          {sent ? (
            <div className="mt-8 rounded-2xl border border-bronze/30 bg-bronze/5 p-5 text-charcoal">
              <p className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-5 w-5 text-bronze" /> Vielen Dank. Wir melden uns zeitnah bei Ihnen.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <select value={form.option} onChange={(e) => setForm((prev) => ({ ...prev, option: e.target.value }))} className="w-full rounded-xl border border-charcoal/20 bg-white px-4 py-3 outline-none transition focus:border-bronze" required>
                <option value="dienstleistung">Dienstleistung</option>
                <option value="saas">SaaS-Applikation</option>
              </select>
              <label className="relative block">
                <User className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-charcoal/40" />
                <input type="text" placeholder="Vorname" value={form.firstName} onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))} className="w-full rounded-xl border border-charcoal/20 bg-white py-3 pl-10 pr-4 outline-none transition focus:border-bronze" required />
              </label>
              <label className="relative block">
                <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-charcoal/40" />
                <input type="email" placeholder="E-Mail" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} className="w-full rounded-xl border border-charcoal/20 bg-white py-3 pl-10 pr-4 outline-none transition focus:border-bronze" required />
              </label>
              <button type="submit" className="w-full rounded-full bg-charcoal px-6 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-[#15191C]">
                Kontaktaufnahme anfordern ({selectedOffer?.title})
              </button>
            </form>
          )}
        </div>
      </section>

      <footer className="border-t border-charcoal/10 py-8 text-center text-sm text-charcoal/70">
        <p className="font-medium">Zwei Gründer aus der Region Sursee.</p>
        <p className="mt-1">Vertrauensvoll. Diskret. Fokus auf Ergebnisse für Immobilienprofis.</p>
      </footer>
    </main>
  )
}
