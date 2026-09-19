/**
 * /__ds — dev-only design-system gallery (MODULE-OWNERSHIP §1 F3 done
 * criterion). Renders EVERY primitive side by side in both named token
 * sets (THEMES) — a [data-theme] wrapper carries the full palette, so both
 * Light and Dark render at once regardless of the app's own theme.
 * Demo data is obviously fictional.
 */
import { useState, type JSX, type ReactNode } from 'react';
import {
  Badge,
  Button,
  CalendarGrid,
  Card,
  Checkbox,
  ConflictField,
  DataTable,
  DateField,
  DatePicker,
  DiffFieldRow,
  DiffFooter,
  DiffRecord,
  DiffSummaryChips,
  Drawer,
  EmptyState,
  FilterBar,
  FilterMenu,
  ICON_NAMES,
  Icon,
  KanbanBoard,
  Modal,
  SelectField,
  StatCard,
  StatCardRow,
  TagChip,
  Tabs,
  TextAreaField,
  TextField,
  THEMES,
  toast,
  type DiffGroup,
  type KanbanColumnData,
} from '../index';
import './gallery.css';

const TODAY = '2026-08-15';

interface DemoRow {
  id: number;
  name: string;
  carrier: string;
  line: string;
  premium: string;
  renewal: string;
}

const DEMO_ROWS: DemoRow[] = [
  { id: 1, name: 'Marisol Ferry', carrier: 'Blue Granite Mutual', line: 'Homeowners', premium: '$1,842', renewal: 'Oct 1, 2026' },
  { id: 2, name: 'Dexter Callow', carrier: 'Piedmont Shield', line: 'Auto', premium: '$964', renewal: 'Sep 12, 2026' },
  { id: 3, name: 'Tabby Quill LLC', carrier: 'Cape Fear Assurance', line: 'BOP', premium: '$3,210', renewal: 'Jan 5, 2027' },
];

function Section({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <section className="dsg-section">
      <h3 className="dsg-section__title">{title}</h3>
      {children}
    </section>
  );
}

function Showcase(): JSX.Element {
  const [text, setText] = useState('');
  const [selectVal, setSelectVal] = useState('');
  const [checked, setChecked] = useState(true);
  const [tab, setTab] = useState('overview');
  const [date, setDate] = useState('2026-10-01');
  const [parkDate, setParkDate] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<Set<number | string>>(new Set());
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'name', dir: 'asc' });
  const [filterSel, setFilterSel] = useState<Set<string>>(new Set(['erie']));
  const [diffActive, setDiffActive] = useState<Set<DiffGroup>>(new Set(['added', 'changed', 'conflicts', 'notInFile']));
  const [conflictRes, setConflictRes] = useState<'keep_existing' | 'use_incoming' | null>(null);
  const [calMonth, setCalMonth] = useState('2026-08-01');
  const [columns, setColumns] = useState<KanbanColumnData[]>([
    {
      id: 'new',
      name: 'New',
      sum: '$2,806',
      cards: [
        { id: 'c1', title: 'Marisol Ferry', meta: 'Homeowners · Blue Granite Mutual', amount: '$1,842' },
        { id: 'c2', title: 'Dexter Callow', meta: 'Auto · Piedmont Shield', amount: '$964', edge: 'stale', footer: <Badge variant="amber">stale</Badge> },
      ],
    },
    {
      id: 'quoted',
      name: 'Quoted',
      sum: '$3,210',
      cards: [
        { id: 'c3', title: 'Tabby Quill LLC', meta: 'BOP · Cape Fear Assurance', amount: '$3,210', edge: 'overdue', footer: <Badge variant="red">overdue</Badge> },
      ],
    },
    { id: 'sold', name: 'Sold', sum: '$0', cards: [] },
  ]);

  const sortedRows = [...DEMO_ROWS].sort((a, b) => {
    const dir = sort.dir === 'asc' ? 1 : -1;
    const key = sort.key as keyof DemoRow;
    return String(a[key]).localeCompare(String(b[key])) * dir;
  });

  return (
    <div className="dsg-showcase">
      <Section title="Buttons">
        <div className="dsg-row">
          <Button variant="primary" icon="add">Add client</Button>
          <Button variant="secondary" icon="import">Import CSV</Button>
          <Button variant="ghost">Log contact</Button>
          <Button variant="danger">Delete stage</Button>
          <Button variant="primary" size="lg">Import CSV</Button>
          <Button variant="secondary" size="sm">Park until</Button>
          <Button variant="primary" disabled disabledReason="Select rows to enable">Assign sequence</Button>
          <Button variant="primary" working="Importing rows">Import</Button>
        </div>
      </Section>

      <Section title="Inputs">
        <div className="dsg-grid2">
          <TextField label="Client name" value={text} onChange={(e) => setText(e.target.value)} placeholder="Marisol Ferry" />
          <TextField label="Premium" numeric value="1842" onChange={() => undefined} help="Whole dollars, no decimals unless the source had them" />
          <TextField label="Email" optional value="not-an-email" onChange={() => undefined} error="'not-an-email' isn't a valid email address. Nothing has been saved. Fix it and save again." />
          <TextAreaField label="Note" optional value="" onChange={() => undefined} placeholder="Called about the hail claim" />
        </div>
      </Section>

      <Section title="Selects & checkboxes">
        <div className="dsg-row">
          <SelectField
            label="Line of business"
            placeholder="Choose a line"
            value={selectVal}
            onChange={(e) => setSelectVal(e.target.value)}
            options={[
              { value: 'home', label: 'Homeowners' },
              { value: 'auto', label: 'Private passenger auto' },
              { value: 'wc', label: 'Workers compensation' },
            ]}
          />
          <Checkbox checked={checked} onChange={(e) => setChecked(e.target.checked)}>
            Include former clients
          </Checkbox>
        </div>
      </Section>

      <Section title="Badges & tags">
        <div className="dsg-row">
          <Badge variant="green">active</Badge>
          <Badge variant="blue">updated</Badge>
          <Badge variant="amber">pending</Badge>
          <Badge variant="red">lapsed</Badge>
          <Badge variant="neutral">6-month term</Badge>
          <TagChip name="renewal-june" onRemove={() => undefined} />
          <TagChip name="carrier-erie" auto />
        </div>
      </Section>

      <Section title="Table">
        <DataTable
          columns={[
            { key: 'name', header: 'Client', sortable: true, link: true, render: (r: DemoRow) => <a href="#dsg">{r.name}</a> },
            { key: 'carrier', header: 'Carrier', render: (r: DemoRow) => r.carrier },
            { key: 'line', header: 'Line', render: (r: DemoRow) => r.line },
            { key: 'premium', header: 'Premium', numeric: true, render: (r: DemoRow) => r.premium },
            { key: 'renewal', header: 'Renews', numeric: true, render: (r: DemoRow) => r.renewal },
          ]}
          rows={sortedRows}
          rowKey={(r) => r.id}
          countLabel="3 clients"
          sort={sort}
          onSortChange={(key, dir) => setSort({ key, dir })}
          selectable
          selected={selected}
          onSelectedChange={setSelected}
          batchBar={
            <>
              <Button size="sm">Tag</Button>
              <Button size="sm">Export</Button>
            </>
          }
          footer="1–3 of 3"
        />
      </Section>

      <Section title="Kanban">
        <KanbanBoard
          columns={columns}
          onMove={({ cardId, fromColumnId, toColumnId, index }) => {
            setColumns((prev) => {
              const next = prev.map((c) => ({ ...c, cards: [...c.cards] }));
              const from = next.find((c) => c.id === fromColumnId);
              const to = next.find((c) => c.id === toColumnId);
              if (from === undefined || to === undefined) return prev;
              const i = from.cards.findIndex((c) => c.id === cardId);
              if (i < 0) return prev;
              const card = from.cards[i];
              if (card === undefined) return prev;
              from.cards.splice(i, 1);
              to.cards.splice(Math.min(index, to.cards.length), 0, card);
              return next;
            });
          }}
        />
      </Section>

      <Section title="FilterBar">
        <FilterBar
          chips={[
            { id: 'carrier', label: 'Carrier: Blue Granite Mutual', onRemove: () => undefined },
            { id: 'renew', label: 'Renewing in: 60 days', onRemove: () => undefined },
          ]}
          onClearAll={() => undefined}
        >
          <FilterMenu
            label="Carrier"
            options={[
              { value: 'erie', label: 'Blue Granite Mutual' },
              { value: 'piedmont', label: 'Piedmont Shield' },
            ]}
            selected={filterSel}
            onChange={setFilterSel}
          />
        </FilterBar>
      </Section>

      <Section title="Tabs">
        <Tabs
          label="Record sections"
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'policies', label: 'Policies', count: 3 },
            { id: 'timeline', label: 'Timeline' },
          ]}
          active={tab}
          onChange={setTab}
        >
          <p className="dsg-muted">Showing the {tab} panel.</p>
        </Tabs>
      </Section>

      <Section title="Date picking">
        <div className="dsg-grid2">
          <DateField label="Effective date" value={date} onChange={setDate} />
          <DatePicker
            label="Park until"
            value={parkDate}
            onChange={setParkDate}
            today={TODAY}
            presets={[
              { label: '+30 days', days: 30 },
              { label: '+60 days', days: 60 },
              { label: '+90 days', days: 90 },
            ]}
          />
        </div>
      </Section>

      <Section title="Stat cards">
        <StatCardRow>
          <StatCard label="Premium sold" value="$11,940" context="Should be at $8,200 by Aug 15" delta={{ value: '+7.5%', direction: 'up', good: true }} />
          <StatCard label="Policies" value="14" context="Goal: 20 this month" />
          <StatCard label="Retention" value="94%" context="12-month trend" delta={{ value: '−1.2%', direction: 'down', good: false }} />
          <StatCard label="Review asks" value="6" context="2 received" href="#dsg" />
        </StatCardRow>
      </Section>

      <Section title="Calendar grid">
        <CalendarGrid
          month={calMonth}
          today={TODAY}
          onMonthChange={setCalMonth}
          totals="3 renewals · $6,016"
          entries={{
            '2026-08-12': [
              { id: 1, label: 'Marisol Ferry', detail: '$1,842', filing: true },
              { id: 2, label: 'Dexter Callow', detail: '$964' },
            ],
            '2026-08-20': [
              { id: 3, label: 'Tabby Quill LLC', detail: '$3,210' },
              { id: 4, label: 'Ines Marrow', detail: '$1,105' },
              { id: 5, label: 'Ray Delto', detail: '$780' },
              { id: 6, label: 'June Harrow', detail: '$1,320' },
            ],
          }}
        />
      </Section>

      <Section title="Diff viewer (Review changes)">
        <DiffSummaryChips
          counts={{ added: 38, changed: 112, conflicts: 3, notInFile: 6 }}
          active={diffActive}
          onToggle={(g) =>
            setDiffActive((prev) => {
              const next = new Set(prev);
              if (next.has(g)) next.delete(g);
              else next.add(g);
              return next;
            })
          }
        />
        <DiffRecord title="Marisol Ferry" kind="changed">
          <DiffFieldRow fieldLabel="Premium" oldValue="$1,842" newValue="$2,061" />
          <DiffFieldRow fieldLabel="Zip" oldValue="27511" newValue="27513" />
        </DiffRecord>
        <DiffRecord title="Dexter Callow" kind="conflicts">
          <ConflictField
            fieldLabel="Premium"
            currentValue="$964"
            incomingValue="$1,010"
            resolution={conflictRes}
            onResolve={setConflictRes}
          />
        </DiffRecord>
        <DiffFooter
          applyLabel="Apply 153 changes"
          onApply={() => toast({ message: 'Applied 153 changes. 38 added, 112 updated, 3 resolved.' })}
          onCancel={() => undefined}
          applyDisabledReason={conflictRes === null ? 'Resolve the 1 remaining conflict to enable' : undefined}
        />
      </Section>

      <Section title="Empty states">
        <EmptyState
          glyph="pipeline"
          message="No leads in this pipeline yet."
          action={<Button variant="primary" icon="add">Add lead</Button>}
          hint="Import puts your whole book here in about 30 minutes"
        />
      </Section>

      <Section title="Layers & toasts">
        <div className="dsg-row">
          <Button onClick={() => setModalOpen(true)}>Open modal</Button>
          <Button onClick={() => setDrawerOpen(true)}>Open drawer</Button>
          <Button onClick={() => toast({ message: 'Imported: 412 added, 38 updated, 3 skipped.' })}>
            Show toast
          </Button>
          <Button
            onClick={() =>
              toast({
                message: 'Stage ‘Quoted’ deleted.',
                action: { label: 'Undo', onPress: () => undefined },
                undoable: true,
              })
            }
          >
            Show undo toast
          </Button>
        </div>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Delete stage 'Quoted'"
          footer={
            <>
              <Button onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={() => setModalOpen(false)}>Delete stage</Button>
            </>
          }
        >
          <p>
            Leads that passed through it stay on their records. You can restore it from this
            pipeline's stage list.
          </p>
        </Modal>
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Filing entry"
          footer={
            <>
              <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setDrawerOpen(false)}>Save filing</Button>
            </>
          }
        >
          <div className="dsg-grid1">
            <TextField label="Filer" value="NC Rate Bureau" onChange={() => undefined} />
            <TextField label="Approved change" numeric value="+7.5" onChange={() => undefined} help="Statewide average, not a prediction" />
            <DateField label="Effective date" value="2026-06-01" onChange={() => undefined} />
          </div>
        </Drawer>
      </Section>

      <Section title="Icons">
        <div className="dsg-icons">
          {ICON_NAMES.map((name) => (
            <span key={name} className="dsg-icon">
              <Icon name={name} />
              <span className="dsg-icon__name">{name}</span>
            </span>
          ))}
        </div>
      </Section>

      <Section title="Card">
        <Card>A plain surface card. Tables beat cards everywhere data is dense.</Card>
      </Section>
    </div>
  );
}

export default function GalleryPage(): JSX.Element {
  return (
    <div className="dsg">
      <h1>Design system</h1>
      <p className="dsg-muted">
        Dev-only gallery. Every primitive renders below in both named token sets (see
        Settings → Appearance for the picker); layered components (modal, drawer, toasts) follow
        the pane you opened them from.
      </p>
      <div className="dsg-panes">
        {THEMES.map((theme) => (
          <div key={theme.key} data-theme={theme.key} className="dsg-pane">
            <h2>{theme.name}</h2>
            <Showcase />
          </div>
        ))}
      </div>
    </div>
  );
}
