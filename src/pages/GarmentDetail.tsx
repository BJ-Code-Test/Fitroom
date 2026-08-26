import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../components/layout/Shell';
import { Icon, SLOT_ICON } from '../components/Icon';
import { Badge, Button, Empty, Field, Notice, Panel } from '../components/ui';
import { FitBadge, ScoreMeter, inkOn } from '../components/Garment';
import { ProLock } from '../components/Paywall';
import { garmentById } from '../data/catalog';
import { providerById } from '../data/providers';
import { CUT_LABEL, MATERIAL_LABEL, VERDICT_LABEL, bestSize, checkFit } from '../lib/fit';
import { can } from '../lib/plan';
import { useApp } from '../state/app';
import { displayLength, euro, useUi } from '../state/ui';
import { SLOT_LABEL } from '../types';

/**
 * Ein Teil im Detail — mit der Größentabelle, die gegen die eigenen Maße
 * gerechnet ist. Das ist die Seite, die die Frage "welche Größe nehme ich"
 * beantwortet.
 */
export default function GarmentDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const unit = useUi((s) => s.unit);

  const body = useApp((s) => s.body);
  const plan = useApp((s) => s.plan);
  const worn = useApp((s) => s.worn);
  const wear = useApp((s) => s.wear);
  const setSize = useApp((s) => s.setSize);
  const favorites = useApp((s) => s.favorites);
  const toggleFavorite = useApp((s) => s.toggleFavorite);

  const garment = garmentById(id);
  const [colorIndex, setColorIndex] = useState(0);

  if (!garment) {
    return (
      <AppShell title="Katalog">
        <div className="page page--narrow">
          <Panel className="card">
            <Empty
              icon="search"
              title="Teil nicht gefunden"
              text="Dieses Kleidungsstück gibt es nicht (mehr)."
              action={
                <Link to="/katalog">
                  <Button size="sm">Zurück zum Katalog</Button>
                </Link>
              }
            />
          </Panel>
        </div>
      </AppShell>
    );
  }

  const provider = providerById(garment.providerId);
  const color = garment.colorways[colorIndex] ?? garment.colorways[0];
  const recommended = bestSize(garment, body);
  const isWorn = worn[garment.slot]?.garmentId === garment.id;
  const isFav = favorites.includes(garment.id);

  const tryOn = () => {
    wear(garment);
    // Farbe übernehmen, die hier gerade gewählt ist.
    useApp.getState().setColor(garment.slot, colorIndex);
    navigate('/studio');
  };

  return (
    <AppShell title={garment.name}>
      <div className="page">
        <div className="grid grid--2">
          <Panel className="card">
            <div
              className="tile__art"
              style={{
                ['--tile-color' as string]: color.hex,
                ['--tile-ink' as string]: inkOn(color.hex),
                borderRadius: 'var(--ng-r-md)',
                aspectRatio: '1 / 1',
              }}
            >
              <Icon name={SLOT_ICON[garment.slot]} className="tile__glyph" />
            </div>
            <p className="tiny muted" style={{ textAlign: 'center', marginTop: 10 }}>
              Produktbild folgt mit der 3D-Ansicht.
            </p>
          </Panel>

          <Panel className="card">
            <div className="stack stack--lg">
              <div className="stack stack--sm">
                <div className="row row--wrap">
                  <Badge>
                    <span style={{ color: provider?.hue }}>●</span> {garment.brand}
                  </Badge>
                  <Badge>{SLOT_LABEL[garment.slot]}</Badge>
                  <Badge>{CUT_LABEL[garment.cut]}</Badge>
                  <Badge>{MATERIAL_LABEL[garment.material]}</Badge>
                </div>
                <h1 className="h2">{garment.name}</h1>
                <span className="h3">{euro(garment.price)}</span>
              </div>

              <Field label={`Farbe — ${color.name}`}>
                <div className="swatches">
                  {garment.colorways.map((cw, i) => (
                    <button
                      key={cw.name}
                      type="button"
                      className={`swatch ${colorIndex === i ? 'swatch--on' : ''}`}
                      style={{ background: cw.hex }}
                      title={cw.name}
                      aria-label={cw.name}
                      aria-pressed={colorIndex === i}
                      onClick={() => setColorIndex(i)}
                    />
                  ))}
                </div>
              </Field>

              {recommended ? (
                <div className="stack stack--sm">
                  <div className="row row--between">
                    <span className="small strong">
                      Empfohlene Größe: {recommended.size.label}
                    </span>
                    <FitBadge verdict={recommended.report.verdict} />
                  </div>
                  <ScoreMeter score={recommended.report.score} />
                  <p className="tiny muted">{recommended.report.advice}</p>
                </div>
              ) : null}

              <div className="row row--wrap">
                <Button variant="primary" icon="studio" onClick={tryOn}>
                  {isWorn ? 'In der Ankleide ansehen' : 'Anprobieren'}
                </Button>
                <Button
                  icon="heart"
                  variant={isFav ? 'primary' : 'default'}
                  onClick={() => void toggleFavorite(garment.id)}
                >
                  {isFav ? 'Gemerkt' : 'Merken'}
                </Button>
              </div>
            </div>
          </Panel>
        </div>

        <Panel className="card">
          <div className="stack">
            <div className="row row--between">
              <h2 className="h2">Größen an deinen Maßen</h2>
              <Badge>
                {displayLength(body.chest, unit)} Brust · {displayLength(body.waist, unit)} Taille
              </Badge>
            </div>

            <ProLock
              locked={!can(plan, 'fitDetails')}
              reason="Die volle Größentabelle mit allen Maßen gehört zu Pro. Die Empfehlung oben bleibt kostenlos."
              label="Tabelle freischalten"
            >
              <div className="table__scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Größe</th>
                      {garment.sizes[0]?.chest !== undefined ? <th>Brust</th> : null}
                      {garment.sizes[0]?.waist !== undefined ? <th>Taille</th> : null}
                      {garment.sizes[0]?.hip !== undefined ? <th>Hüfte</th> : null}
                      {garment.sizes[0]?.inseam !== undefined ? <th>Innenbein</th> : null}
                      {garment.sizes[0]?.foot !== undefined ? <th>Fuß</th> : null}
                      <th>Urteil</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {garment.sizes.map((size) => {
                      const report = checkFit(garment, size, body);
                      const isBest = recommended?.size.label === size.label;
                      return (
                        <tr key={size.label} className={isBest ? 'is-on' : undefined}>
                          <td className="strong">{size.label}</td>
                          {size.chest !== undefined ? <td className="num">{displayLength(size.chest, unit)}</td> : null}
                          {size.waist !== undefined ? <td className="num">{displayLength(size.waist, unit)}</td> : null}
                          {size.hip !== undefined ? <td className="num">{displayLength(size.hip, unit)}</td> : null}
                          {size.inseam !== undefined ? <td className="num">{displayLength(size.inseam, unit)}</td> : null}
                          {size.foot !== undefined ? <td className="num">{displayLength(size.foot, unit)}</td> : null}
                          <td>
                            <FitBadge verdict={report.verdict} />
                          </td>
                          <td>
                            <Button
                              size="xs"
                              variant="quiet"
                              onClick={() => {
                                if (!isWorn) wear(garment);
                                setSize(garment.slot, size.label);
                              }}
                              title={`${size.label} anprobieren — ${VERDICT_LABEL[report.verdict]}`}
                            >
                              wählen
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </ProLock>

            <Notice>
              Die Werte sind Körpermaße, nicht Stoffmasse. Wie viel Luft daraus wird,
              hängt am Schnitt ({CUT_LABEL[garment.cut]}) und am Material (
              {MATERIAL_LABEL[garment.material]}).
            </Notice>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
