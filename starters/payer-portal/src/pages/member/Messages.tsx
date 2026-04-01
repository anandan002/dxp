import React, { useState } from 'react';
import { Card, Badge, Button } from '@dxp/ui';

type Category = 'claims' | 'auth' | 'care' | 'clinical' | 'pharmacy';

interface Message {
  id: string;
  from: string;
  subject: string;
  preview: string;
  body?: string;
  date: string;
  read: boolean;
  category: Category;
}

const initialMessages: Message[] = [
  {
    id: 'msg-1',
    from: 'Meridian Health Plan',
    subject: 'MRI Brain claim under review',
    preview: 'Your claim CLM-2026-4523 is currently pending medical review. We will notify you once a decision...',
    body: 'Your claim CLM-2026-4523 is currently pending medical review. We will notify you once a decision has been made, typically within 5–7 business days. You may check claim status anytime under Claims in your portal.',
    date: '2026-03-12',
    read: false,
    category: 'claims',
  },
  {
    id: 'msg-2',
    from: 'Lisa Park RN — Care Manager',
    subject: 'Cardiac rehab session 3 completed',
    preview: 'Great job completing your third cardiac rehab session! Keep up the great work. Your next session...',
    body: 'Great job completing your third cardiac rehab session! Keep up the great work. Your next session is scheduled for March 19. Please remember to wear comfortable clothing and bring your medication list.',
    date: '2026-03-05',
    read: true,
    category: 'care',
  },
  {
    id: 'msg-3',
    from: 'Meridian Health Plan',
    subject: 'Prior authorization denied — PA-2026-1189',
    preview: 'Your authorization for psychiatric diagnostic evaluation has been denied. You have 60 days to file...',
    body: 'Your authorization for psychiatric diagnostic evaluation has been denied. You have 60 days to file an appeal. Please contact Member Services at 1-800-555-0199 or use the Prior Auth section to initiate an appeal.',
    date: '2026-03-07',
    read: false,
    category: 'auth',
  },
  {
    id: 'msg-4',
    from: 'Dr. Sarah Chen',
    subject: 'Lab results available',
    preview: 'Your recent lab results are now available. Your lipid panel and HbA1c values show improvement from...',
    body: 'Your recent lab results are now available. Your lipid panel and HbA1c values show improvement from your last visit. Your LDL is down to 98 mg/dL (target < 100) and HbA1c is 6.8% (target < 7%). Keep up the great work with diet and exercise.',
    date: '2026-02-28',
    read: true,
    category: 'clinical',
  },
  {
    id: 'msg-5',
    from: 'Meridian Health Plan',
    subject: 'Explanation of Benefits — ED Visit',
    preview: 'Your EOB for the January 22 emergency department visit at Mass General is now available for review...',
    body: 'Your EOB for the January 22 emergency department visit at Mass General is now available for review. Total billed: $4,820. Plan paid: $3,856. Your responsibility: $964 (applied to deductible). View full details under Claims.',
    date: '2026-02-05',
    read: true,
    category: 'claims',
  },
  {
    id: 'msg-6',
    from: 'CVS Pharmacy',
    subject: 'Prescription refill ready',
    preview: 'Your Atorvastatin 20mg 30-day supply is ready for pickup at CVS Pharmacy — Beacon Hill location...',
    body: 'Your Atorvastatin 20mg 30-day supply is ready for pickup at CVS Pharmacy — Beacon Hill location (123 Charles St). Hours: Mon–Fri 8am–8pm, Sat–Sun 9am–5pm. Copay: $10.',
    date: '2026-03-16',
    read: true,
    category: 'pharmacy',
  },
];

const categoryColors: Record<Category, 'info' | 'warning' | 'success' | 'danger' | 'default'> = {
  claims: 'info',
  auth: 'warning',
  care: 'success',
  clinical: 'info',
  pharmacy: 'default',
};

const recipients = [
  { value: 'plan', label: 'Meridian Health Plan — Member Services' },
  { value: 'care-manager', label: 'Care Manager' },
  { value: 'billing', label: 'Billing Department' },
  { value: 'appeals', label: 'Appeals & Grievances' },
  { value: 'pharmacy', label: 'Pharmacy Benefit Support' },
  { value: 'provider-relations', label: 'Provider Relations' },
];

const categoryOptions: { value: Category; label: string }[] = [
  { value: 'claims', label: 'Claims' },
  { value: 'auth', label: 'Prior Authorization' },
  { value: 'care', label: 'Care Management' },
  { value: 'clinical', label: 'Clinical / Lab' },
  { value: 'pharmacy', label: 'Pharmacy' },
];

interface ComposeState {
  to: string;
  subject: string;
  category: Category;
  body: string;
}

const emptyCompose = (): ComposeState => ({
  to: '',
  subject: '',
  category: 'claims',
  body: '',
});

export function Messages() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [form, setForm] = useState<ComposeState>(emptyCompose);
  const [sent, setSent] = useState(false);

  const selected = messages.find((m) => m.id === selectedId);
  const unread = messages.filter((m) => !m.read).length;

  const handleSelect = (id: string) => {
    setComposing(false);
    setSent(false);
    setSelectedId(id);
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
  };

  const handleCompose = () => {
    setSelectedId(null);
    setSent(false);
    setForm(emptyCompose());
    setComposing(true);
  };

  const handleSend = () => {
    if (!form.to || !form.subject || !form.body.trim()) return;
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      from: 'You',
      subject: form.subject,
      preview: form.body.slice(0, 80) + (form.body.length > 80 ? '...' : ''),
      body: form.body,
      date: new Date().toISOString().slice(0, 10),
      read: true,
      category: form.category,
    };
    setMessages((prev) => [newMsg, ...prev]);
    setSent(true);
    setComposing(false);
    setSelectedId(newMsg.id);
  };

  return (
    <div>
      <div className="mb-12 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Messages</h1>
          <p className="text-[var(--dxp-text-secondary)] mt-1">{unread} unread message{unread !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={handleCompose}>
          <svg className="w-4 h-4 mr-2 inline-block -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          New Message
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Message list */}
        <div className="lg:col-span-4">
          <Card className="overflow-hidden">
            {messages.map((msg, i) => (
              <div
                key={msg.id}
                onClick={() => handleSelect(msg.id)}
                className={`p-4 cursor-pointer transition-colors hover:bg-[var(--dxp-border-light)] ${
                  !msg.read ? 'border-l-4 border-[var(--dxp-brand)] bg-[var(--dxp-brand-light)]' : ''
                } ${selectedId === msg.id && !composing ? 'bg-[var(--dxp-border-light)]' : ''} ${
                  i < messages.length - 1 ? 'border-b border-[var(--dxp-border-light)]' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className={`text-sm ${!msg.read ? 'font-bold' : 'font-medium'} text-[var(--dxp-text)] line-clamp-1`}>
                    {msg.from === 'You' ? <span className="text-[var(--dxp-brand)]">You (Sent)</span> : msg.from}
                  </span>
                  <span className="text-[9px] text-[var(--dxp-text-muted)] shrink-0">{msg.date}</span>
                </div>
                <p className="text-xs font-bold text-[var(--dxp-text)] line-clamp-1">{msg.subject}</p>
                <p className="text-xs text-[var(--dxp-text-secondary)] line-clamp-1 mt-0.5">{msg.preview}</p>
                <Badge variant={categoryColors[msg.category] || 'default'} className="mt-2">{msg.category}</Badge>
              </div>
            ))}
          </Card>
        </div>

        {/* Right panel */}
        <div className="lg:col-span-6">
          {composing ? (
            // ── Compose form ────────────────────────────────────────
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-bold text-[var(--dxp-text)]">New Message</h2>
                <button
                  onClick={() => setComposing(false)}
                  className="text-[var(--dxp-text-muted)] hover:text-[var(--dxp-text)] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--dxp-text-secondary)] mb-1.5">To</label>
                  <select
                    value={form.to}
                    onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))}
                    className="w-full rounded-[var(--dxp-radius)] border border-[var(--dxp-border)] bg-[var(--dxp-surface)] px-3 py-2 text-sm text-[var(--dxp-text)] focus:outline-none focus:ring-1 focus:ring-[var(--dxp-brand)]"
                  >
                    <option value="">Select recipient...</option>
                    {recipients.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--dxp-text-secondary)] mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Category }))}
                    className="w-full rounded-[var(--dxp-radius)] border border-[var(--dxp-border)] bg-[var(--dxp-surface)] px-3 py-2 text-sm text-[var(--dxp-text)] focus:outline-none focus:ring-1 focus:ring-[var(--dxp-brand)]"
                  >
                    {categoryOptions.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--dxp-text-secondary)] mb-1.5">Subject</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    placeholder="Brief subject..."
                    className="w-full rounded-[var(--dxp-radius)] border border-[var(--dxp-border)] bg-[var(--dxp-surface)] px-3 py-2 text-sm text-[var(--dxp-text)] placeholder:text-[var(--dxp-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--dxp-brand)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--dxp-text-secondary)] mb-1.5">Message</label>
                  <textarea
                    rows={6}
                    value={form.body}
                    onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                    placeholder="Write your message here..."
                    className="w-full rounded-[var(--dxp-radius)] border border-[var(--dxp-border)] bg-[var(--dxp-surface)] px-3 py-2 text-sm text-[var(--dxp-text)] placeholder:text-[var(--dxp-text-muted)] resize-none focus:outline-none focus:ring-1 focus:ring-[var(--dxp-brand)]"
                  />
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <Button
                    onClick={handleSend}
                    disabled={!form.to || !form.subject || !form.body.trim()}
                  >
                    Send Message
                  </Button>
                  <button
                    onClick={() => setComposing(false)}
                    className="text-sm text-[var(--dxp-text-secondary)] hover:text-[var(--dxp-text)] transition-colors"
                  >
                    Discard
                  </button>
                </div>
              </div>
            </Card>
          ) : selected ? (
            // ── Message detail ──────────────────────────────────────
            <Card className="p-6">
              {sent && selectedId === selected.id && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-[var(--dxp-brand-light)] text-[var(--dxp-brand)] text-sm font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Message sent successfully
                </div>
              )}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-lg font-bold text-[var(--dxp-text)]">{selected.subject}</h2>
                  <Badge variant={categoryColors[selected.category] || 'default'}>{selected.category}</Badge>
                </div>
                <p className="text-sm text-[var(--dxp-text-secondary)]">
                  {selected.from === 'You' ? 'Sent to plan' : `From: ${selected.from}`} — {selected.date}
                </p>
              </div>
              <div className="border-t border-[var(--dxp-border-light)] pt-4">
                <p className="text-sm text-[var(--dxp-text)] leading-relaxed">{selected.body || selected.preview}</p>
                {selected.from !== 'You' && (
                  <p className="text-sm text-[var(--dxp-text)] leading-relaxed mt-4">
                    If you have questions about this communication, please contact Member Services at 1-800-555-0199
                    or reply to this message below.
                  </p>
                )}
              </div>
              {selected.from !== 'You' && (
                <div className="border-t border-[var(--dxp-border-light)] mt-6 pt-4">
                  <label className="block text-sm font-bold text-[var(--dxp-text)] mb-2">Reply</label>
                  <textarea
                    rows={3}
                    className="w-full rounded-[var(--dxp-radius)] border border-[var(--dxp-border)] bg-[var(--dxp-surface)] px-3 py-2 text-sm mb-3 resize-none focus:outline-none focus:ring-1 focus:ring-[var(--dxp-brand)]"
                    placeholder="Type your reply..."
                  />
                  <Button>Send Reply</Button>
                </div>
              )}
            </Card>
          ) : (
            // ── Empty state ─────────────────────────────────────────
            <Card className="p-12 flex flex-col items-center justify-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[var(--dxp-border-light)] flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--dxp-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--dxp-text)]">Select a message to read</p>
                <p className="text-xs text-[var(--dxp-text-muted)] mt-1">or compose a new message to your care team</p>
              </div>
              <button
                onClick={handleCompose}
                className="text-sm font-medium text-[var(--dxp-brand)] hover:underline"
              >
                Compose new message
              </button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
