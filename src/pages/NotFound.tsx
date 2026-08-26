import { Link } from 'react-router-dom';
import { PublicShell } from '../components/layout/Shell';
import { Button, Empty, Panel } from '../components/ui';

export default function NotFound() {
  return (
    <PublicShell>
      <div className="page page--narrow" style={{ paddingTop: 40 }}>
        <Panel className="card">
          <Empty
            icon="search"
            title="Diese Seite gibt es nicht"
            text="Vielleicht hat sich die Adresse geändert — oder es war nie eine."
            action={
              <Link to="/">
                <Button variant="primary">Zur Startseite</Button>
              </Link>
            }
          />
        </Panel>
      </div>
    </PublicShell>
  );
}
