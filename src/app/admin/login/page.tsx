import type { Metadata } from 'next';

import { PagePlaceholder } from '@/components/ui/page-placeholder';

export const metadata: Metadata = {
  title: 'Sign in',
};

export default function AdminLoginPage() {
  return (
    <PagePlaceholder
      title="Sign in"
      description="Google sign-in restricted to the ADMIN_EMAILS allowlist."
      filledInStage={6}
    />
  );
}
