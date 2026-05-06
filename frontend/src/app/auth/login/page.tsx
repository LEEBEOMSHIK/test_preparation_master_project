'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error');
    router.replace(error ? `/user/login?error=${error}` : '/user/login');
  }, [searchParams, router]);

  return null;
}
