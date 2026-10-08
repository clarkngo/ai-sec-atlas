import { useEffect, useId, useRef, useState } from 'react';
import { play } from '../lib/sound';

interface Props {
  onClose: () => void;
  onList: () => void;
}

function Swatch({ kind }: { kind: 'threat' | 'vulnerability' | 'guardrail' }) {
  const cls =
    kind === 'threat'
      ? 'clip-threat bg-[var(--atlas-threat)]/20 border-[var(--atlas-threat)]'
      : kind === 'vulnerability'
        ? 'border-dashed border-[var(--atlas-vuln)] bg-[var(--atlas-vuln)]/10'
        : 'rounded-full border-2 border-[var(--atlas-guard)] bg-[var(--atlas-guard)]/10';
  return <span className={`inline-block h-4 w-6 shrink-0 border ${cls}`} aria-hidden />;
}

const STEPS = [
  {
    title: 'Three kinds of cards',
    body: (
      <ul className="space-y-2.5">
        <li className="flex items-start gap-3">
          <Swatch kind="threat" />
          <span>
            <strong className="text-[var(--atlas-threat)]">Threat</strong>: what an attacker does.
          </span>
        </li>
        <li className="flex items-start gap-3">
          <Swatch kind="vulnerability" />
          <span>
            <strong className="text-[var(--atlas-vuln)]">Vulnerability</strong>: the weakness that lets it work.
          </span>
        </li>
        <li className="flex items-start gap-3">
          <Swatch kind="guardrail" />
          <span>
            <strong className="text-[var(--atlas-guard)]">Guardrail</strong>: the control that fixes it.
          </span>
        </li>
      </ul>
    ),
  },
  {
    title: 'Follow the arrows',
    body: (
      <p>
        Threats come first and <span className="text-[var(--atlas-vuln)]">exploit</span> the vulnerabilities below
        them. Guardrails come last and <span className="text-[var(--atlas-guard)]">mitigate</span> both. Click any
        card to highlight only its connections and fade the rest.
      </p>
    ),
  },
  {
    title: 'Open a card to get the fix',
    body: (
      <p>
        The panel explains why the risk is rated as it is, lists remediation steps and tests, and links to OWASP, MITRE
        ATLAS, and NIST sources. Use <strong>Related</strong> at the top of the panel to step from a threat to its fix
        without hunting on the map.
      </p>
    ),
  },
];

export function Guide({ onClose, onList }: Props) {
  const titleId = useId();
  const [step, setStep] = useState(0);
  const nextRef = useRef<HTMLButtonElement>(null);
  const last = step === STEPS.length - 1;

  useEffect(() => {
    nextRef.current?.focus();
  }, [step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const go = (n: number) => {
    play('step');
    setStep(n);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-2xl border border-[var(--atlas-border)] bg-[var(--atlas-panel)] p-5 shadow-2xl sm:rounded-2xl"
      >
        <p className="font-mono text-[10px] tracking-wider text-[var(--atlas-muted)] uppercase">
          How to read the map · {step + 1} of {STEPS.length}
        </p>
        <h2 id={titleId} className="mt-1 text-base font-semibold text-[var(--atlas-text)]">
          {STEPS[step].title}
        </h2>
        <div className="mt-3 text-sm leading-relaxed text-[var(--atlas-text)]/90">{STEPS[step].body}</div>

        <div className="mt-5 flex items-center gap-2">
          <div className="flex gap-1" aria-hidden>
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-4 rounded-full ${i === step ? 'bg-[var(--atlas-accent)]' : 'bg-[var(--atlas-border)]'}`}
              />
            ))}
          </div>
          <div className="ml-auto flex gap-1.5">
            {last ? (
              <button
                type="button"
                onClick={onList}
                className="rounded-md border border-[var(--atlas-border)] px-2.5 py-1.5 text-xs text-[var(--atlas-muted)] hover:text-[var(--atlas-text)] focus-visible:outline-2 focus-visible:outline-[var(--atlas-accent)]"
              >
                I prefer a list
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-2.5 py-1.5 text-xs text-[var(--atlas-muted)] hover:text-[var(--atlas-text)] focus-visible:outline-2 focus-visible:outline-[var(--atlas-accent)]"
              >
                Skip
              </button>
            )}
            {step > 0 && (
              <button
                type="button"
                onClick={() => go(step - 1)}
                className="rounded-md border border-[var(--atlas-border)] px-2.5 py-1.5 text-xs text-[var(--atlas-muted)] hover:text-[var(--atlas-text)] focus-visible:outline-2 focus-visible:outline-[var(--atlas-accent)]"
              >
                Back
              </button>
            )}
            <button
              ref={nextRef}
              type="button"
              onClick={() => (last ? onClose() : go(step + 1))}
              className="rounded-md bg-[var(--atlas-accent)]/20 px-3 py-1.5 text-xs font-medium text-[var(--atlas-accent)] hover:bg-[var(--atlas-accent)]/30 focus-visible:outline-2 focus-visible:outline-[var(--atlas-accent)]"
            >
              {last ? 'Explore the map' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
