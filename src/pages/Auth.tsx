import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicShell } from '../components/layout/Shell';
import { Button, Field, Notice, Panel, TextInput } from '../components/ui';
import { useAuth } from '../state/auth';

/**
 * Anmelden und Registrieren teilen sich ein Formular — es unterscheidet sich
 * nur um ein Feld und einen Aufruf.
 */
function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword, available } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const isRegister = mode === 'register';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (isRegister) {
        const { needsConfirm } = await signUp(email.trim(), password, name.trim());
        if (needsConfirm) {
          setInfo('Fast fertig — bestätige die E-Mail, die wir dir gerade geschickt haben.');
        } else {
          navigate('/studio');
        }
      } else {
        await signIn(email.trim(), password);
        navigate('/studio');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Das hat nicht geklappt.');
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    if (!email.trim()) {
      setError('Trag zuerst deine E-Mail-Adresse ein.');
      return;
    }
    setError(null);
    try {
      await resetPassword(email.trim());
      setInfo('Wir haben dir einen Link zum Zurücksetzen geschickt.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Das hat nicht geklappt.');
    }
  };

  return (
    <PublicShell>
      <div className="page page--narrow" style={{ maxWidth: 460, paddingTop: 24 }}>
        <Panel className="card" as="form" onSubmit={submit}>
          <div className="stack stack--lg">
            <div className="stack stack--sm">
              <h1 className="h2">{isRegister ? 'Konto anlegen' : 'Willkommen zurück'}</h1>
              <p className="small muted">
                {isRegister
                  ? 'Damit deine Maße und Outfits auf allen Geräten gelten.'
                  : 'Melde dich an, um deinen Kleiderschrank zu sehen.'}
              </p>
            </div>

            {!available ? (
              <Notice tone="bad">
                Die Anmeldung ist in dieser Installation nicht eingerichtet. Du kannst FitRoom
                trotzdem als Gast benutzen.
              </Notice>
            ) : null}

            {isRegister ? (
              <Field label="Name" htmlFor="auth-name">
                <TextInput
                  id="auth-name"
                  icon="user"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Wie sollen wir dich nennen?"
                  autoComplete="name"
                />
              </Field>
            ) : null}

            <Field label="E-Mail" htmlFor="auth-mail">
              <TextInput
                id="auth-mail"
                icon="mail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="du@beispiel.de"
                autoComplete="email"
              />
            </Field>

            <Field
              label="Passwort"
              htmlFor="auth-pass"
              hint={isRegister ? 'Mindestens 6 Zeichen.' : undefined}
            >
              <TextInput
                id="auth-pass"
                icon="key"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
              />
            </Field>

            {error ? <Notice tone="bad">{error}</Notice> : null}
            {info ? <Notice tone="ok">{info}</Notice> : null}

            <Button type="submit" variant="primary" block loading={busy} disabled={!available}>
              {isRegister ? 'Konto anlegen' : 'Anmelden'}
            </Button>

            <div className="row row--between">
              {isRegister ? (
                <Link to="/login" className="small muted">
                  Ich habe schon ein Konto
                </Link>
              ) : (
                <Link to="/registrieren" className="small muted">
                  Neu hier? Konto anlegen
                </Link>
              )}
              {!isRegister ? (
                <button type="button" className="ng-btn ng-btn--quiet ng-btn--xs" onClick={() => void forgot()}>
                  Passwort vergessen
                </button>
              ) : null}
            </div>

            <hr className="divider" />

            <Link to="/studio">
              <Button variant="quiet" block icon="studio">
                Ohne Konto weitermachen
              </Button>
            </Link>
          </div>
        </Panel>
      </div>
    </PublicShell>
  );
}

export function Login() {
  return <AuthForm mode="login" />;
}

export function Register() {
  return <AuthForm mode="register" />;
}
