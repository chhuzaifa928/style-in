import AdminApp from '@/components/admin/AdminApp';

// The Edge middleware guards this route; unauthenticated users are redirected
// to /admin/login before this renders.
export const dynamic = 'force-dynamic';

export default function AdminPage() {
  return <AdminApp />;
}
