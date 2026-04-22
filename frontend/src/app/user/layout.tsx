import UserLayoutShell from '@/components/layout/UserLayoutShell';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <UserLayoutShell>{children}</UserLayoutShell>;
}
