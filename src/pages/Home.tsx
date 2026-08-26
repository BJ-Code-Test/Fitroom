import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Badge, Button, Panel } from '../components/ui';
import { Motto, PublicShell } from '../components/layout/Shell';
import { CATALOG } from '../data/catalog';
import { PROVIDERS } from '../data/providers';
import { PRO_PITCH, PRO_PRICE } from '../lib/plan';

/** Startseite: was die App macht, in der Reihenfolge, in der man es benutzt. */
export default function Home() {
  return (
    <PublicShell>
      <div className="page">
        <Motto />

        <Panel className="hero">
          <div className="hero__grid">
            <div className="stack stack--lg">
              <Badge tone="accent">
                <Icon name="sparkle" size={13} /> Anprobieren, bevor du bestellst
              </Badge>

              <h1 className="h1">
                Dein Körper.
                <br />
                Deine Maße.
                <br />
                Endlich die richtige Größe.
              </h1>

              <p className="lead">
                FitRoom baut dich aus deinen echten Maßen nach, stellt Outfits aus
                {' '}{PROVIDERS.length} Anbietern zusammen und sagt dir vorher, ob es passt —
                nicht erst die Rücksendung.
              </p>

              <div className="hero__cta">
                <Link to="/studio">
                  <Button variant="primary" icon="studio">
                    Kostenlos ausprobieren
                  </Button>
                </Link>
                <Link to="/masse">
                  <Button icon="ruler">Maße eingeben</Button>
                </Link>
              </div>

              <div className="row row--wrap">
                <span className="tiny muted">Kein Konto nötig zum Ausprobieren</span>
                <span className="tiny muted">·</span>
                <span className="tiny muted">{CATALOG.length} Teile im Katalog</span>
              </div>
            </div>

            <Panel inset className="card" style={{ display: 'grid', gap: 14 }}>
              <span className="tiny muted">So sieht die Passform-Antwort aus</span>
              <div className="stack stack--sm">
                <div className="row row--between">
                  <span className="small strong">Slim Denim Stretch · 32/33</span>
                  <Badge tone="ok" className="badge--dot">
                    passt
                  </Badge>
                </div>
                <div className="meter">
                  <div className="meter__bar" style={{ width: '88%', background: '#6fd39a' }} />
                </div>
                <p className="tiny muted">
                  Taille 84 → 90 (+6) · Hüfte 100 → 106 (+6) · Innenbein 84 → 84
                </p>
              </div>
              <hr className="divider" />
              <div className="stack stack--sm">
                <div className="row row--between">
                  <span className="small strong">Heavy Hoodie 480g · M</span>
                  <Badge tone="warn" className="badge--dot">
                    locker
                  </Badge>
                </div>
                <div className="meter">
                  <div className="meter__bar" style={{ width: '64%', background: '#e8b464' }} />
                </div>
                <p className="tiny muted">Fällt an Brust und Taille großzügig aus — so gewollt.</p>
              </div>
            </Panel>
          </div>
        </Panel>

        <div className="grid grid--3">
          <Panel className="step">
            <span className="step__num">1</span>
            <h3 className="h3">Maße eintragen</h3>
            <p className="small muted">
              Größe, Brust, Taille, Hüfte, Innenbein, Fuß. Wer die Zahlen nicht kennt,
              startet mit einer Vorlage und schiebt nach.
            </p>
          </Panel>
          <Panel className="step">
            <span className="step__num">2</span>
            <h3 className="h3">Outfit zusammenstellen</h3>
            <p className="small muted">
              Sechs Plätze — Kopf, Oberteil, Jacke, Unterteil, Schuhe, Accessoire. Teile
              aus allen Anbietern lassen sich frei mischen.
            </p>
          </Panel>
          <Panel className="step">
            <span className="step__num">3</span>
            <h3 className="h3">Passform lesen</h3>
            <p className="small muted">
              Jedes Teil wird gegen deine Maße gerechnet: Schnitt und Material fließen
              ein, und du siehst, welche Größe besser sitzt.
            </p>
          </Panel>
        </div>

        <div className="grid grid--2">
          <Panel className="card">
            <div className="stack">
              <h2 className="h2">Anbieter an einem Ort</h2>
              <p className="small muted">
                Der Katalog ist so gebaut, dass echte Shops später über dieselbe
                Schnittstelle andocken. Heute liegen {CATALOG.length} Teile bereit.
              </p>
              <div className="row row--wrap">
                {PROVIDERS.map((p) => (
                  <Badge key={p.id}>
                    <span style={{ color: p.hue }}>●</span> {p.name}
                    {p.tier === 'pro' ? <Icon name="crown" size={12} /> : null}
                  </Badge>
                ))}
              </div>
            </div>
          </Panel>

          <Panel className="card">
            <div className="stack">
              <div className="row row--between">
                <h2 className="h2">Pro</h2>
                <Badge tone="accent">
                  ab {PRO_PRICE.monthly.toFixed(2).replace('.', ',')} {PRO_PRICE.currency}
                </Badge>
              </div>
              <ul className="checklist">
                {PRO_PITCH.slice(0, 3).map((line) => (
                  <li key={line}>
                    <Icon name="check" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <Link to="/preise">
                <Button icon="crown">Alles zu Pro</Button>
              </Link>
            </div>
          </Panel>
        </div>

        <p className="tiny muted" style={{ textAlign: 'center', padding: '8px 0 24px' }}>
          FitRoom ist in Arbeit: die 3D-Ansicht kommt als nächstes. Passform, Katalog und
          Kleiderschrank funktionieren bereits.
        </p>
      </div>
    </PublicShell>
  );
}
