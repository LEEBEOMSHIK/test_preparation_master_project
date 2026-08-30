import { describe, expect, it } from '@jest/globals';
import type { MenuConfig } from '@/types';
import { normalizeInquiryMenuNames } from './menu';

const userMenus: MenuConfig[] = [
  {
    id: 10,
    parentId: undefined,
    name: '도움',
    url: '/user/group/help',
    iconKey: 'help',
    displayOrder: 1,
    menuType: 'USER',
    isActive: true,
    allowedRoles: 'USER,ADMIN',
    createdAt: '2026-08-28T00:00:00',
    updatedAt: '2026-08-28T00:00:00',
    children: [
      {
        id: 11,
        parentId: 10,
        name: '1:1 문의',
        url: '/user/inquiries',
        iconKey: 'inquiry',
        displayOrder: 1,
        menuType: 'USER',
        isActive: true,
        allowedRoles: 'USER,ADMIN',
        createdAt: '2026-08-28T00:00:00',
        updatedAt: '2026-08-28T00:00:00',
        children: [],
      },
    ],
  },
];

const adminMenus: MenuConfig[] = [
  {
    id: 20,
    parentId: undefined,
    name: '1:1 문의 관리',
    url: '/admin/inquiries',
    iconKey: 'inquiry',
    displayOrder: 3,
    menuType: 'ADMIN',
    isActive: true,
    allowedRoles: 'ADMIN',
    createdAt: '2026-08-28T00:00:00',
    updatedAt: '2026-08-28T00:00:00',
    children: [],
  },
  {
    id: 21,
    parentId: undefined,
    name: '문의 통계',
    url: '/admin/inquiries-statistics',
    iconKey: 'chart',
    displayOrder: 4,
    menuType: 'ADMIN',
    isActive: true,
    allowedRoles: 'ADMIN',
    createdAt: '2026-08-28T00:00:00',
    updatedAt: '2026-08-28T00:00:00',
    children: [],
  },
];

describe('normalizeInquiryMenuNames', () => {
  it('normalizes a nested user inquiry menu by exact URL', () => {
    const normalized = normalizeInquiryMenuNames(userMenus);

    expect(normalized[0].children[0].name).toBe('문의·요청');
    expect(userMenus[0].children[0].name).toBe('1:1 문의');
  });

  it('normalizes the admin inquiry menu without changing a prefix-only URL', () => {
    const normalized = normalizeInquiryMenuNames(adminMenus);

    expect(normalized[0].name).toBe('문의·요청 관리');
    expect(normalized[1].name).toBe('문의 통계');
    expect(adminMenus[0].name).toBe('1:1 문의 관리');
  });
});
