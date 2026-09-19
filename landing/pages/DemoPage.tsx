/**
 * /demo — "Request a demo" (2026-09-17). Public. Three fields that land as an
 * email to Vihaan (POST /api/public/demo-request) with a plain mailto fallback
 * under it, so it works for people who hate forms and on the day email fails.
 * Wears the landing chrome through LegalLayout (no effective-date line).
 */
import { useState, type FormEvent, type JSX } from 'react';
import type { DemoRequestInput } from '@keepbook/shared';
import { api } from '../../../app/api';
import { Button, TextField } from '../../../ds';
import { LegalLayout } from './LegalLayout';
import './demo.css';

export const DEMO_EMAIL = 'vihaankommireddy@gmail.com';
const MAILTO = `mailto:${DEMO_EMAIL}?subject=Keepbook%20demo`;

type Status = 'idle' | 'sending' | 'sent' | 'error';

interface FieldErrors {
  name?: string;
  agency?: string;
  email?: string;
}

function validate(name: string, agency: string, email: string): FieldErrors {
  const errors: FieldErrors = {};
  if (name.trim() === '') errors.name = 'Your name, so I know who to write back to.';
  if (agency.trim() === '') errors.agency = 'The agency name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'An email address I can reply to.';
  return errors;
}

export default function DemoPage(): JSX.Element {
  const [name, setName] = useState('');
  const [agency, setAgency] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>('idle');

  async function submit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const next = validate(name, agency, email);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setStatus('sending');
    const body: DemoRequestInput = {
      name: name.trim(),
      agency: agency.trim(),
      email: email.trim(),
      website,
    };
    try {
      await api.post<{ ok: true }>('/api/public/demo-request', body);
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  return (
    <LegalLayout title="Request a demo">
      {status === 'sent' ? (
        <div className="kb-demo__done" role="status">
          <h2>Got it.</h2>
          <p>
            Expect an email back within a day. If it can't wait, write to{' '}
            <a href={MAILTO}>{DEMO_EMAIL}</a>.
          </p>
        </div>
      ) : (
        <>
          <p className="kb-demo__lede">
            Twenty minutes on a video call, no slides. Three fields and I'll email you to set it
            up.
          </p>
          <form className="kb-demo__form" onSubmit={(e) => void submit(e)} noValidate>
            <TextField
              label="Your name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              {...(errors.name !== undefined ? { error: errors.name } : {})}
            />
            <TextField
              label="Agency"
              autoComplete="organization"
              value={agency}
              onChange={(e) => setAgency(e.target.value)}
              {...(errors.agency !== undefined ? { error: errors.agency } : {})}
            />
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              {...(errors.email !== undefined ? { error: errors.email } : {})}
            />
            {/* Honeypot: off-screen, out of the tab order, hidden from assistive
                tech. A human never fills it; a bot does, and the server keeps
                nothing for a filled one. */}
            <div className="kb-demo__hp" aria-hidden="true">
              <label>
                Website
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </label>
            </div>
            {status === 'error' && (
              <p className="kb-demo__error" role="alert">
                That didn't send. Email <a href={MAILTO}>{DEMO_EMAIL}</a> instead.
              </p>
            )}
            <div className="kb-demo__actions">
              <Button
                type="submit"
                variant="primary"
                disabled={status === 'sending'}
                working={status === 'sending' ? 'Sending' : undefined}
              >
                Send
              </Button>
            </div>
          </form>
          <p className="kb-demo__alt">
            Or just email <a href={MAILTO}>{DEMO_EMAIL}</a>.
          </p>
        </>
      )}
    </LegalLayout>
  );
}
