import type { MenuConfig } from '@/types';

const INQUIRY_MENU_NAMES: Readonly<Record<string, string>> = {
  '/user/inquiries': '문의·요청',
  '/admin/inquiries': '문의·요청 관리',
};

export function normalizeInquiryMenuNames(menus: MenuConfig[]): MenuConfig[] {
  return menus.map((menu) => ({
    ...menu,
    name: INQUIRY_MENU_NAMES[menu.url] ?? menu.name,
    children: normalizeInquiryMenuNames(menu.children ?? []),
  }));
}
