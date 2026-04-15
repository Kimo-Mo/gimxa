'use client';

import { useState } from 'react';
import { SupportHeader } from '@/components/features/support/SupportHeader';
import { SupportContactInfo } from '@/components/features/support/SupportContactInfo';
import { SupportForm } from '@/components/features/support/SupportForm';
import { SupportSuccess } from '@/components/features/support/SupportSuccess';

export default function SupportPage() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return <SupportSuccess onReset={() => setSubmitted(false)} />;
  }

  return (
    <div className="container py-12 space-y-12">
      <SupportHeader />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <SupportContactInfo />
        <SupportForm onSuccess={() => setSubmitted(true)} />
      </div>
    </div>
  );
}
