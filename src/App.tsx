import { useEffect, useState } from "react";
import Reveal from "./components/Reveal";
import CaptureForm from "./components/CaptureForm";
import HeroVisual from "./components/HeroVisual";
import PriceChart from "./components/PriceChart";
import {
  BellDotIcon,
  StorefrontsIcon,
  DipChartIcon,
  TargetArrowIcon,
  ChatBubbleIcon,
  ShieldIcon,
} from "./components/icons";

const BENEFITS = [
  {
    icon: <BellDotIcon />,
    title: "Zero noise, by design.",
    body: "You only hear from DropWatch when your exact price hits — never a promo blast.",
  },
  {
    icon: <StorefrontsIcon />,
    title: "Watch every store at once.",
    body: "One alert covers Amazon, Target, Best Buy, and more — no tab-hopping.",
  },
  {
    icon: <DipChartIcon />,
    title: "Know if it's really a deal.",
    body: "Price history shows whether $248 is a genuine low or a fake markdown.",
  },
  {
    icon: <TargetArrowIcon />,
    title: "Buy at the bottom, not out of impatience.",
    body: "Waiting gets easy when you know you'll be told the moment it drops.",
  },
  {
    icon: <ChatBubbleIcon />,
    title: "Set an alert in one sentence.",
    body: "No SKU numbers, no category menus — type it like you'd text a friend.",
  },
  {
    icon: <ShieldIcon />,
    title: "Your list stays private.",
    body: "No selling your shopping data, no ad targeting, no affiliate tricks steering your alerts.",
  },
];

const TIERS = [
  {
    name: "Basic",
    price: "Free",
    priceNote: "",
    best: "Best for: trying DropWatch on the one thing you're waiting on.",
    features: ["3 active alerts", "1 store per alert", "Daily price checks", "Email alerts"],
    recommended: false,
  },
  {
    name: "Pro",
    price: "$9.99",
    priceNote: "/month",
    best: "Best for: anyone with a real wishlist across more than one store.",
    features: [
      "Unlimited alerts",
      "All supported stores per alert",
      "Instant alerts the moment a price crosses your line",
      "Full price history and deal-quality reads",
    ],
    recommended: true,
  },
  {
    name: "Pro Plus",
    price: "$129",
    priceNote: "/year",
    best: "Best for: heavy shoppers who want first access and fast answers.",
    features: [
      "Everything in Pro",
      "Priority support",
      "Early access to new stores and features",
      "Higher alert-check frequency",
    ],
    recommended: false,
  },
];

const FAQS = [
  {
    q: "Is this available yet?",
    a: "Not yet — we're building it now and opening it to founding users first. Sign up and you'll get early access before the public launch, plus 3 months of Pro free. You're not buying anything today.",
  },
  {
    q: "Why would I pay when Honey and CamelCamelCamel are free?",
    a: "Free tools make money from ads and affiliate volume, so they're built to show you more deals, not fewer. DropWatch is built for the opposite: one alert for one exact thing. You're paying for silence and precision.",
  },
  {
    q: "Do I have to connect my Amazon or store accounts?",
    a: "No. You never hand over logins or payment details. You tell DropWatch what to watch and where — that's all it needs.",
  },
  {
    q: "How long does setup take?",
    a: 'About as long as sending a text. Type "Patagonia Nano Puff, 40% off, any store" and you\'re done. Most people set up their first three alerts in under two minutes.',
  },
  {
    q: "Which stores will it cover?",
    a: "At launch: Amazon, Target, and Best Buy, with more added based on what founding users track. Early-access signups vote on which stores come next.",
  },
  {
    q: "Will you spam me?",
    a: 'DropWatch\'s whole reason to exist is not spamming you. You get an alert when your price hits, and nothing otherwise. No newsletters, no "deals you might like," no partner offers.',
  },
];

export default function App() {
  const [tierModal, setTierModal] = useState<string | null>(null);

  useEffect(() => {
    if (!tierModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTierModal(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tierModal]);

  return (
    <>
      <header className="nav">
        <div className="container nav__inner">
          <a href="#top" className="nav__brand">
            <img src="/logo.svg" alt="DropWatch logo" width="24" height="24" />
            <span className="nav__wordmark">DropWatch</span>
          </a>
          <nav className="nav__links" aria-label="Main">
            <a href="#how-it-works">How it works</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
            <a href="#early-access" className="btn btn--primary">
              Claim 3 months of Pro free
            </a>
          </nav>
        </div>
      </header>

      <main id="top">
        {/* 1 · HERO — background, open split layout */}
        <section className="hero">
          <div className="container hero__inner">
            <div className="hero__copy">
              <Reveal>
                <h1>Stop missing price drops on things you actually want</h1>
              </Reveal>
              <Reveal delay={60}>
                <p className="hero__sub">
                  For busy people who shop online but can't babysit prices — set one alert, get
                  pinged the second it drops.
                </p>
              </Reveal>
              <Reveal delay={120}>
                <CaptureForm source="hero" />
              </Reveal>
              <Reveal delay={180}>
                <p className="hero__credibility small">
                  The deals worth waiting for usually last hours, not days — and they drop while
                  you're at work.
                </p>
              </Reveal>
            </div>
            <Reveal className="hero__visual" delay={120}>
              <HeroVisual />
            </Reveal>
          </div>
        </section>

        {/* 2 · PROBLEM — surface, open layout, no cards */}
        <section className="section section--surface">
          <div className="container">
            <Reveal>
              <h2>You're not bad at deals. You're busy.</h2>
            </Reveal>
            <ul className="problem__list">
              {[
                "Your wishlist is a graveyard. You saved that laptop three weeks ago, the price dropped 30% on a Tuesday, and it was back up by Thursday.",
                "Deal apps and coupon extensions bury the one thing you want under two hundred things you don't.",
                "Checking prices across Amazon, Target, and Best Buy is a part-time job you didn't apply for.",
                "So you either overpay out of impatience, or wait forever and miss the window anyway.",
              ].map((line, i) => (
                <Reveal as="li" key={i} delay={i * 60}>
                  {line}
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* 3 · HOW IT WORKS — background, 3 numbered open columns */}
        <section className="section" id="how-it-works">
          <div className="container">
            <Reveal>
              <h2>Set it once. Then live your life.</h2>
            </Reveal>
            <div className="steps">
              {[
                {
                  title: "Say what you want, in plain English.",
                  body: 'Type "AirPods Pro under $200" and DropWatch turns it into a tracked alert — product, stores, and target price, no forms to fill.',
                },
                {
                  title: "DropWatch watches so you don't.",
                  body: 'Your alerts sit quietly across the stores you picked. No feed, no digest, no daily "hot deals" email.',
                },
                {
                  title: "Get one alert when it actually drops.",
                  body: "The moment your price hits, you get a single notification with the price, the store, and a read on whether it's a real deal.",
                },
              ].map((step, i) => (
                <Reveal className="step" key={i} delay={i * 60}>
                  <div className="step__num" aria-hidden="true">
                    {i + 1}
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* DEMO MOMENT — surface, two bordered cards; capture form follows */}
        <section className="section section--surface" id="demo">
          <div className="container">
            <Reveal>
              <p className="demo__intro">
                Here's the entire experience — one sentence in, one alert out.
              </p>
            </Reveal>
            <div className="demo__panels">
              <Reveal className="demo__card demo__card--you">
                <div className="demo__label">You type this once</div>
                <p className="demo__bubble">
                  Sony WH-1000XM5 headphones — tell me if they drop under $250 at Amazon or Best
                  Buy.
                </p>
              </Reveal>
              <Reveal className="demo__card demo__card--alert" delay={80}>
                <div className="demo__label">The one alert you get — 11 days later</div>
                <div className="notif">
                  <div className="notif__title">PRICE DROP — Sony WH-1000XM5</div>
                  <p className="notif__price">
                    <strong>$248.00</strong> at Best Buy · was $348.00 (29% off)
                  </p>
                  <p>Lowest price in 6 months. Your target was $250.</p>
                  <p className="notif__read">
                    Deal read: Below its Black Friday price. This is the buy window.
                  </p>
                  <div className="notif__actions" aria-hidden="true">
                    <span className="btn btn--primary">View deal</span>
                    <span className="btn btn--secondary">Pause alert</span>
                  </div>
                </div>
                <div className="demo__chart">
                  <PriceChart />
                </div>
              </Reveal>
            </div>
            {/* EMAIL CAPTURE — immediately after the demo moment */}
            <div className="capture-strip__inner" id="early-access" style={{ marginTop: "var(--s-64)" }}>
              <Reveal>
                <h3>Want the alert instead of the hunt?</h3>
              </Reveal>
              <Reveal delay={60}>
                <CaptureForm source="demo" />
              </Reveal>
            </div>
          </div>
        </section>

        {/* 4 · BENEFITS — background, bordered cards */}
        <section className="section">
          <div className="container">
            <Reveal>
              <h2>Built to stay quiet</h2>
            </Reveal>
            <div className="benefits">
              {BENEFITS.map((b, i) => (
                <Reveal className="benefit" key={b.title} delay={(i % 3) * 60}>
                  {b.icon}
                  <h3>{b.title}</h3>
                  <p>{b.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 5 · PRICING — surface, 3 bordered cards */}
        <section className="section section--surface" id="pricing">
          <div className="container">
            <Reveal>
              <h2>Pay for quiet, not for noise.</h2>
            </Reveal>
            <div className="tiers">
              {TIERS.map((tier, i) => (
                <Reveal
                  className={`tier${tier.recommended ? " tier--recommended" : ""}`}
                  key={tier.name}
                  delay={i * 60}
                >
                  {tier.recommended && <div className="tier__badge">Recommended</div>}
                  <h3>{tier.name}</h3>
                  <div className="tier__price">
                    {tier.price}
                    {tier.priceNote && <span>{tier.priceNote}</span>}
                  </div>
                  <p className="tier__best small">{tier.best}</p>
                  <ul className="tier__features">
                    {tier.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <button
                    className={`btn ${tier.recommended ? "btn--primary" : "btn--secondary"}`}
                    onClick={() => setTierModal(tier.name)}
                  >
                    Claim 3 months of Pro free
                  </button>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 6 · FAQ — background, open accordion with border dividers */}
        <section className="section" id="faq">
          <div className="container">
            <Reveal>
              <h2>Questions, answered straight</h2>
            </Reveal>
            <Reveal className="faq" delay={60}>
              {FAQS.map((item) => (
                <details key={item.q}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </Reveal>
          </div>
        </section>

        {/* 7 · FINAL CTA — surface, centered open layout */}
        <section className="section section--surface final">
          <div className="container final__inner">
            <Reveal>
              <h2>Set the alert once — and never watch a price again.</h2>
            </Reveal>
            <Reveal delay={60}>
              <p>
                Founding users get early access before launch and 3 months of Pro free. No card, no
                commitment — just first in line.
              </p>
            </Reveal>
            <Reveal delay={120} className="capture">
              <CaptureForm source="final" />
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer__inner small">
          <span>© 2026 DropWatch</span>
          <span>Just for early access. No newsletters, no selling your email.</span>
        </div>
      </footer>

      {tierModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`Claim 3 months of Pro free — ${tierModal} tier`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setTierModal(null);
          }}
        >
          <div className="modal">
            <button className="modal__close" onClick={() => setTierModal(null)} aria-label="Close">
              ×
            </button>
            <h3>You picked {tierModal} — smart.</h3>
            <p className="muted">
              DropWatch isn't live yet. Leave your email and you'll be first in line, with 3 months
              of Pro free when it opens.
            </p>
            <CaptureForm source="pricing" tier={tierModal} />
          </div>
        </div>
      )}
    </>
  );
}
