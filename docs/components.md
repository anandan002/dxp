# Component Library (@dxp/ui)

Enterprise portal UI components. All styling uses CSS custom properties from `ThemeProvider` — swap the foundation (Tailwind, CSS Modules, etc.) without changing consumer code.

Import everything from `@dxp/ui`. Never from primitives or foundation directly.

## Architecture

```
ThemeProvider (design tokens → CSS custom properties)
    |
Primitives (Button, Input, Badge, Card, Tabs)
    |
Composed (DataTable, DashboardCard, DocumentCard, FileUploadZone, etc.)
```

---

## Theme

Wrap your app in `ThemeProvider` to inject design tokens:

```tsx
import { ThemeProvider } from '@dxp/ui';

<ThemeProvider theme={{
  colors: { brand: '#1d6fb8', brandDark: '#175a96' },
  radius: 'md',
  density: 'comfortable',
}}>
  <App />
</ThemeProvider>
```

Only override what you need — defaults fill in the rest.

---

## Primitives

### Button

```tsx
import { Button } from '@dxp/ui';

<Button variant="primary" size="md">Submit</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="danger">Delete</Button>
<Button variant="ghost" size="icon"><Icon /></Button>
```

**Variants**: `primary`, `secondary`, `danger`, `ghost`, `link`
**Sizes**: `sm`, `md`, `lg`, `icon`

### Input

```tsx
import { Input } from '@dxp/ui';

<Input placeholder="Search..." />
<Input type="date" />
<Input error placeholder="Invalid email" />
```

### Badge

```tsx
import { Badge } from '@dxp/ui';

<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="danger">Rejected</Badge>
<Badge variant="info">Processing</Badge>
<Badge variant="brand">Policy</Badge>
```

### Card

```tsx
import { Card, CardHeader, CardContent, CardFooter } from '@dxp/ui';

<Card interactive onClick={handleClick}>
  <CardHeader>Title</CardHeader>
  <CardContent>Body</CardContent>
  <CardFooter>Actions</CardFooter>
</Card>
```

### Tabs

```tsx
import { Tabs } from '@dxp/ui';

<Tabs
  tabs={[
    { key: 'all', label: 'All' },
    { key: 'policy', label: 'Policy Documents' },
    { key: 'claim', label: 'Claim Documents' },
  ]}
  active={activeTab}
  onChange={setActiveTab}
  variant="pill"
/>
```

**Variants**: `pill` (rounded, filled), `underline` (bottom border)

---

## Composed Components

### DataTable

Sortable, paginated table with row click actions.

```tsx
import { DataTable, Column } from '@dxp/ui';

const columns: Column<Policy>[] = [
  { key: 'id', header: 'Policy #', sortable: true },
  { key: 'type', header: 'Type' },
  { key: 'status', header: 'Status', render: (v) => <StatusBadge status={v} /> },
];

<DataTable columns={columns} data={policies} onRowClick={handleClick} />
```

**Props**: `columns`, `data`, `onRowClick`, `loading`, `emptyMessage`, `pagination`

### DashboardCard

Metric display with optional trend indicator.

```tsx
import { DashboardCard } from '@dxp/ui';

<DashboardCard
  title="Active Policies"
  value={3}
  trend={{ value: 12, label: 'vs last month' }}
/>
```

**Props**: `title`, `value`, `subtitle`, `trend`, `icon`, `onClick`

### StatusBadge

Auto-maps status strings to colored badges.

```tsx
import { StatusBadge } from '@dxp/ui';

<StatusBadge status="Active" />     // green
<StatusBadge status="Pending" />    // amber
<StatusBadge status="Processing" /> // blue
<StatusBadge status="Rejected" />   // red
```

**Auto-mapped statuses**: active, approved, completed, pending, processing, review, rejected, denied, failed, expired, draft

### DetailPanel

Slide-over panel from the right side.

```tsx
import { DetailPanel } from '@dxp/ui';

<DetailPanel open={!!selected} onClose={() => setSelected(null)} title="Policy Details" footer={<Button>Download</Button>}>
  <p>{selected.name}</p>
</DetailPanel>
```

**Props**: `open`, `onClose`, `title`, `children`, `footer`

### StepIndicator

Horizontal step progress bar for multi-step flows.

```tsx
import { StepIndicator } from '@dxp/ui';

<StepIndicator
  steps={[
    { label: 'Incident Details' },
    { label: 'Supporting Documents' },
    { label: 'Review & Submit' },
  ]}
  currentStep={1}
/>
```

Steps show: completed (green check), current (brand ring), upcoming (gray).

**Props**: `steps`, `currentStep`

### FileUploadZone

Drag-and-drop upload area with uploaded file list.

```tsx
import { FileUploadZone } from '@dxp/ui';

<FileUploadZone
  files={[
    { id: '1', name: 'photo.jpg', size: '2.4 MB', type: 'image' },
    { id: '2', name: 'estimate.pdf', size: '340 KB', type: 'document' },
  ]}
  onRemove={(id) => removeFile(id)}
  accept="JPG, PNG, PDF"
  maxSize="10MB"
/>
```

Two-column layout: drop zone (left) + uploaded file cards (right).

**Props**: `files`, `onRemove`, `onDrop`, `accept`, `maxSize`

### DocumentCard

Card-style document display with file type icon, category badge, and download.

```tsx
import { DocumentCard } from '@dxp/ui';

<DocumentCard
  name="Auto Policy Declaration"
  category="policy"
  reference="POL-001"
  date="Jan 15"
  size="245 KB"
  fileType="pdf"
  onDownload={() => download(doc.id)}
/>
```

**File types**: `pdf`, `image`, `zip`, `doc` (each gets a distinct icon)
**Categories**: `policy` (brand badge), `claim` (amber badge)

**Props**: `name`, `category`, `reference`, `date`, `size`, `fileType`, `onDownload`, `onClick`

### MultiStepForm

Full wizard with step indicator, validation, and navigation buttons.

```tsx
import { MultiStepForm, FormStep } from '@dxp/ui';

const steps: FormStep[] = [
  { title: 'Basic Info', content: <BasicInfoForm /> },
  { title: 'Documents', content: <DocumentUpload />, validate: () => hasFiles },
  { title: 'Review', content: <ReviewSummary /> },
];

<MultiStepForm steps={steps} onSubmit={handleSubmit} />
```

**Props**: `steps`, `onSubmit`, `onCancel`, `submitLabel`

### FilterBar

Search input with composable filter chips.

```tsx
import { FilterBar } from '@dxp/ui';

<FilterBar
  filters={[{ key: 'auto', label: 'Auto', value: 'auto' }]}
  activeFilters={active}
  onToggle={toggle}
  onClear={clear}
  searchValue={search}
  onSearchChange={setSearch}
/>
```

### NotificationInbox

Bell icon with dropdown notification list and unread count.

```tsx
import { NotificationInbox } from '@dxp/ui';

<NotificationInbox
  notifications={notifications}
  onMarkRead={markRead}
  onMarkAllRead={markAllRead}
/>
```

---

## Layouts

### PageLayout

Full-page layout with collapsible sidebar, navigation, and user menu.

```tsx
import { PageLayout } from '@dxp/ui';

<PageLayout
  appName="My Portal"
  navItems={[
    { label: 'Dashboard', href: '/', active: true },
    { label: 'Documents', href: '/documents' },
  ]}
  onNavigate={navigate}
  userMenu={<UserInfo />}
>
  <DashboardPage />
</PageLayout>
```

**Props**: `appName`, `navItems`, `userMenu`, `actions`, `children`, `onNavigate`
