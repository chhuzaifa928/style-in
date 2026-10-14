import { Suspense } from 'react';
import LoginForm from '@/components/admin/LoginForm';

export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="heading text-3xl">
            StyleIn<span className="text-brand">.</span>
          </h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Master Admin Portal
          </p>
        </div>

        <Suspense
          fallback={
            <div className="h-56 animate-pulse border border-hairline bg-surface" />
          }
        >
          <LoginForm />
        </Suspense>

        <p className="mt-4 text-center text-xs text-muted">
          Protected area. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  );
}
