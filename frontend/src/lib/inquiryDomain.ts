import { domainService } from '@/services/domainService';

export async function loadInquiryDomainOptions<T extends string>(
  code: string,
  isAllowed: (value: string) => value is T,
  fallback: T[],
): Promise<T[]> {
  try {
    const response = await domainService.getSlavesByCode(code);
    return (response.data.data ?? []).map((item) => item.name).filter(isAllowed);
  } catch {
    return fallback;
  }
}
