'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminTablesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/tables/data');
  }, [router]);

  return null;
}
