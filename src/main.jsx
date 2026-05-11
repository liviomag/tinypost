import React from 'react'
import ReactDOM from 'react-dom/client'
import { ArrowRight, Building2, Handshake, Sparkles } from 'lucide-react'
import './styles.css'

function HandArrow({ className = '' }) {
  return (
    <svg className={`hand-arrow ${className}`} viewBox="0 0 120 60" fill="none" aria-hidden="true">
      <path d="M6 50 C 28 32, 48 34, 72 38 C 82 40, 96 34, 112 16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M102 16 L112 16 L110 26" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

function OfferCard({ icon: Icon, title, description, steps, cta, onClick }) {
  return (
    <article className="group rounded-3xl border border-copper/20 bg-white p-8 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <Icon className="mb-5 h-9 w-9 text-copper draw-in" />
      <h3 className="font-serif text-3xl text-ink">{title}</h3>
      <p className="mt-4 text-sm leading-relaxed text-ink/70">{description}</p>
      <ol className="mt-6 space-y-3 text-sm text-ink/80">
        {steps.map((step, idx) => (
          <li key={step} className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-copper/40 text-xs font-semibold text-copper">{idx + 1}</span>
            {step}
          </li>
        ))}
      </ol>
      <button onClick={onClick} className="mt-7 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-ink px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-ink/90">
        {cta} <ArrowRight className="h-4 w-4" />
      </button>
    </article>
  )
}

function App() {
  const [interest, setInterest] = React.useState('Dienstleistung')
  const [firstName, setFirstName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [submitted, setSubmitted] = React.useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!firstName || !email) return
    setSubmitted(true)
    setFirstName('')
    setEmail('')
  }

  return (
    <div className="min-h-screen bg-offwhite font-sans text-ink">
      <main className="mx-auto max-w-6xl px-6 py-12 md:py-20">
        <section className="relative text-center md:text-left">
          <p className="text-sm tracking-[0.18em] text-copper uppercase">Visualize Estate</p>
          <h1 className="mt-4 font-serif text-5xl leading-tight md:text-6xl">Ihre Immobilienbilder. Professionell visualisiert.</h1>
          <p className="mx-auto mt-5 max-w-3xl text-base text-ink/70 md:mx-0 md:text-lg">Wählen Sie zwischen unserer schnellen Dienstleistung oder der flexiblen SaaS-Applikation.</p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row md:justify-start">
            <button onClick={() => setInterest('Dienstleistung')} className="rounded-full bg-ink px-7 py-3.5 font-medium text-white transition hover:-translate-y-0.5 hover:bg-ink/90">Dienstleistung anfragen</button>
            <button onClick={() => setInterest('SaaS-Applikation')} className="rounded-full border border-copper/50 bg-white px-7 py-3.5 font-medium text-copper transition hover:-translate-y-0.5 hover:bg-copper/5">SaaS-Applikation anfragen</button>
          </div>
          <HandArrow className="absolute -bottom-14 right-2 hidden text-copper/70 md:block" />
        </section>

        <section className="mt-16 grid gap-6 md:mt-20 md:grid-cols-2">
          <OfferCard
            icon={Handshake}
            title="Dienstleistung"
            description="Sie senden uns Ihre Bilder und Wünsche. Wir bearbeiten diese professionell und liefern Ihnen das Ergebnis per E-Mail."
            steps={['Kontakt aufnehmen', 'Bild einreichen', 'Ergebnis erhalten']}
            cta="Für Dienstleistung eintragen"
            onClick={() => setInterest('Dienstleistung')}
          />
          <OfferCard
            icon={Sparkles}
            title="SaaS-Applikation"
            description="Sie bearbeiten Immobilienbilder selbstständig mit unserer SaaS-Lösung."
            steps={['Kontakt aufnehmen', 'Persönliche Beratung', 'Selbstständig bearbeiten']}
            cta="Für SaaS eintragen"
            onClick={() => setInterest('SaaS-Applikation')}
          />
        </section>

        <section className="mt-16 rounded-3xl border border-copper/30 bg-white p-7 shadow-soft md:p-10">
          <div className="mb-6 flex items-center gap-3">
            <Building2 className="h-7 w-7 text-copper draw-in" />
            <h2 className="font-serif text-3xl">Kontaktformular</h2>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="mb-1.5 block text-sm text-ink/70">Auswahl</span>
              <select value={interest} onChange={(e) => setInterest(e.target.value)} className="w-full rounded-xl border border-ink/15 bg-offwhite px-4 py-3 outline-none transition focus:border-copper">
                <option>Dienstleistung</option>
                <option>SaaS-Applikation</option>
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-sm text-ink/70">Vorname</span>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} type="text" className="w-full rounded-xl border border-ink/15 bg-offwhite px-4 py-3 outline-none transition focus:border-copper" required />
            </label>
            <label>
              <span className="mb-1.5 block text-sm text-ink/70">E-Mail</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full rounded-xl border border-ink/15 bg-offwhite px-4 py-3 outline-none transition focus:border-copper" required />
            </label>
            <div className="md:col-span-2 mt-1 flex flex-col items-start gap-3">
              <button type="submit" className="rounded-full bg-copper px-7 py-3 font-medium text-white transition hover:-translate-y-0.5 hover:bg-copper/90">Kontaktaufnahme anfordern</button>
              {submitted && (
                <p className="inline-flex items-center gap-2 rounded-full border border-copper/35 bg-copper/10 px-4 py-2 text-sm text-ink"><Sparkles className="h-4 w-4 text-copper" />Vielen Dank. Wir melden uns zeitnah bei Ihnen.</p>
              )}
            </div>
          </form>
        </section>
      </main>
      <footer className="border-t border-copper/20 bg-white/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-ink/70 md:flex-row md:items-center md:justify-between">
          <p>Zwei Gründer aus der Region Sursee.</p>
          <p>Vertraulich · Persönlich · Premium Immobilienfokus</p>
        </div>
      </footer>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
