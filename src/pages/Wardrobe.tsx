import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/Shell';
import { Icon, SLOT_ICON } from '../components/Icon';
import { Badge, Button, Empty, Field, Modal, Notice, Panel, TextInput } from '../components/ui';
import { ScoreMeter } from '../components/Garment';
import { usePaywall } from '../components/Paywall';
import { garmentById } from '../data/catalog';
import { checkFitWithHint, outfitScore } from '../lib/fit';
import { PLAN_LIMITS, remainingSaves } from '../lib/plan';
import { useApp } from '../state/app';
import { euro } from '../state/ui';
import { SLOTS, type SavedOutfit } from '../types';

/** Gespeicherte Looks: ansehen, laden, umbenennen, löschen. */
export default function Wardrobe() {
  const navigate = useNavigate();
  const paywall = usePaywall();

  const outfits = useApp((s) => s.outfits);
  const plan = useApp((s) => s.plan);
  const ready = useApp((s) => s.ready);
  const applyOutfit = useApp((s) => s.applyOutfit);
  const removeOutfit = useApp((s) => s.removeOutfit);
  const rename = useApp((s) => s.rename);

  const [renaming, setRenaming] = useState<SavedOutfit | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SavedOutfit | null>(null);

  const left = remainingSaves(plan, outfits.length);

  return (
    <AppShell title="Kleiderschrank">
      <div className="page">
        <Panel className="card">
          <div className="row row--wrap row--between">
            <div className="stack stack--sm">
              <h2 className="h2">{outfits.length} gespeicherte Outfits</h2>
              <p className="small muted">
                {plan === 'pro'
                  ? 'Mit Pro speicherst du so viele Looks, wie du willst.'
                  : `Noch ${left} von ${PLAN_LIMITS.free.savedOutfits} Plätzen frei.`}
              </p>
            </div>
            <div className="row">
              {plan === 'free' ? (
                <Button
                  icon="crown"
                  onClick={() => paywall.open('Mit Pro ist die Zahl der gespeicherten Outfits unbegrenzt.')}
                >
                  Mehr Plätze
                </Button>
              ) : null}
              <Link to="/studio">
                <Button variant="primary" icon="studio">
                  Neues Outfit
                </Button>
              </Link>
            </div>
          </div>
        </Panel>

        {!ready ? (
          <Panel className="card">
            <div className="stack">
              <div className="skeleton" style={{ height: 22, width: '40%' }} />
              <div className="skeleton" style={{ height: 90 }} />
            </div>
          </Panel>
        ) : outfits.length === 0 ? (
          <Panel className="card">
            <Empty
              icon="wardrobe"
              title="Noch nichts im Schrank"
              text="Stell in der Ankleide etwas zusammen und speichere es — dann liegt es hier."
              action={
                <Link to="/studio">
                  <Button size="sm" variant="primary" icon="studio">
                    Zur Ankleide
                  </Button>
                </Link>
              }
            />
          </Panel>
        ) : (
          <div className="grid grid--2">
            {outfits.map((outfit) => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                onOpen={() => {
                  applyOutfit(outfit.id);
                  navigate('/studio');
                }}
                onRename={() => setRenaming(outfit)}
                onDelete={() => setConfirmDelete(outfit)}
              />
            ))}
          </div>
        )}
      </div>

      <RenameDialog
        outfit={renaming}
        onClose={() => setRenaming(null)}
        onSave={async (name) => {
          if (renaming) await rename(renaming.id, name);
          setRenaming(null);
        }}
      />

      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Outfit löschen"
        footer={
          <>
            <Button variant="quiet" onClick={() => setConfirmDelete(null)}>
              Behalten
            </Button>
            <Button
              variant="danger"
              icon="trash"
              onClick={() => {
                if (confirmDelete) void removeOutfit(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Löschen
            </Button>
          </>
        }
      >
        <Notice tone="bad">
          „{confirmDelete?.name}" wird endgültig entfernt. Das lässt sich nicht rückgängig
          machen.
        </Notice>
      </Modal>
    </AppShell>
  );
}

function OutfitCard({
  outfit,
  onOpen,
  onRename,
  onDelete,
}: {
  outfit: SavedOutfit;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const pieces = SLOTS.flatMap((slot) => {
    const item = outfit.worn[slot];
    if (!item) return [];
    const garment = garmentById(item.garmentId);
    if (!garment) return [];
    return [{ slot, garment, item }];
  });

  const total = pieces.reduce((sum, p) => sum + p.garment.price, 0);
  const score = outfitScore(
    pieces.map((p) => checkFitWithHint(p.garment, p.item.sizeLabel, outfit.body)),
  );

  return (
    <Panel className="card">
      <div className="stack">
        <div className="row row--between">
          <div className="stack stack--sm" style={{ minWidth: 0 }}>
            <h3 className="h3">{outfit.name}</h3>
            <span className="tiny muted">
              {new Date(outfit.createdAt).toLocaleDateString('de-DE', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
          <Badge tone={score >= 85 ? 'ok' : score >= 60 ? 'warn' : 'bad'}>{score}</Badge>
        </div>

        <ScoreMeter score={score} />

        {pieces.length === 0 ? (
          <p className="small muted">Dieses Outfit enthält keine bekannten Teile mehr.</p>
        ) : (
          <div className="row row--wrap" style={{ gap: 8 }}>
            {pieces.map(({ slot, garment, item }) => {
              const color = garment.colorways[item.colorIndex] ?? garment.colorways[0];
              return (
                <span key={slot} className="badge" title={`${garment.name} · ${item.sizeLabel}`}>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 4,
                      background: color.hex,
                      display: 'inline-block',
                    }}
                  />
                  <Icon name={SLOT_ICON[slot]} size={12} />
                  {item.sizeLabel}
                </span>
              );
            })}
          </div>
        )}

        <div className="row row--wrap">
          <span className="small strong">{euro(total)}</span>
          <span className="spacer" />
          <Button size="sm" variant="quiet" icon="edit" onClick={onRename}>
            Umbenennen
          </Button>
          <Button size="sm" variant="quiet" icon="trash" onClick={onDelete} aria-label="Löschen" />
          <Button size="sm" variant="primary" icon="studio" onClick={onOpen}>
            Anziehen
          </Button>
        </div>
      </div>
    </Panel>
  );
}

function RenameDialog({
  outfit,
  onClose,
  onSave,
}: {
  outfit: SavedOutfit | null;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  // Beim Oeffnen den bisherigen Namen übernehmen.
  const currentId = outfit?.id ?? null;
  const [lastId, setLastId] = useState<string | null>(null);
  if (currentId !== lastId) {
    setLastId(currentId);
    setName(outfit?.name ?? '');
  }

  const submit = async () => {
    const clean = name.trim();
    if (!clean) return;
    setBusy(true);
    await onSave(clean);
    setBusy(false);
  };

  return (
    <Modal
      open={outfit !== null}
      onClose={onClose}
      title="Outfit umbenennen"
      footer={
        <>
          <Button variant="quiet" onClick={onClose}>
            Abbrechen
          </Button>
          <Button variant="primary" loading={busy} onClick={() => void submit()}>
            Speichern
          </Button>
        </>
      }
    >
      <Field label="Name">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && void submit()}
        />
      </Field>
    </Modal>
  );
}
