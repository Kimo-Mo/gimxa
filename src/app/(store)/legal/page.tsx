'use client';

import { LegalHeader } from '@/components/features/legal/LegalHeader';
import { LegalTabs } from '@/components/features/legal/LegalTabs';

export default function LegalHubPage() {
  return (
    <div className="container py-12 space-y-12">
      <LegalHeader />
      <LegalTabs />
    </div>
  );
}
