import React, { useState } from 'react';
import { QuestionFlow, Card, CardContent } from '@dxp/ui';
import { quoteQuestions } from '../data/mock';

export function GetQuote() {
  const [result, setResult] = useState<Record<string, string | string[]> | null>(null);

  if (result) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--dxp-text)]">Your Quote is Ready</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-2">Based on your selections, here's what we recommend.</p>

        <Card className="mt-6">
          <CardContent className="space-y-4 py-8">
            <div className="text-center">
              <p className="text-4xl font-bold text-[var(--dxp-brand)]">$197/mo</p>
              <p className="text-sm text-[var(--dxp-text-muted)] mt-1">Estimated monthly premium</p>
            </div>
            <div className="border-t border-[var(--dxp-border-light)] pt-4 mt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--dxp-text-muted)] mb-3">Your Selections</h4>
              <dl className="space-y-2">
                {Object.entries(result).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <dt className="text-[var(--dxp-text-secondary)]">{key.replace(/-/g, ' ')}</dt>
                    <dd className="font-medium text-[var(--dxp-text)]">{Array.isArray(value) ? value.join(', ') : value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="flex justify-center gap-3 pt-4">
              <button
                onClick={() => setResult(null)}
                className="px-4 py-2 text-sm font-medium text-[var(--dxp-text-secondary)] hover:text-[var(--dxp-text)]"
              >Start Over</button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--dxp-text)]">Get a Quote</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-2">Answer a few questions and we'll find the right coverage for you.</p>
      </div>

      <div className="max-w-2xl">
        <QuestionFlow
          questions={quoteQuestions}
          onComplete={(answers) => setResult(answers)}
          submitLabel="Get My Quote"
        />
      </div>
    </div>
  );
}
