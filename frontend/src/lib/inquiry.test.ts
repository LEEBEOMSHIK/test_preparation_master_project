import { getAllowedAdminStatuses, isInquiryClosed, requiresTargetArea, usesTargetArea } from './inquiry';

describe('inquiry helpers', () => {
  it('applies type-specific target area and terminal status rules', () => {
    expect(requiresTargetArea('BUG_REPORT')).toBe(true);
    expect(usesTargetArea('EXAM_OPENING_REQUEST')).toBe(false);
    expect(usesTargetArea('FEATURE_REQUEST')).toBe(true);
    expect(isInquiryClosed('COMPLETED')).toBe(true);
    expect(isInquiryClosed('IN_PROGRESS')).toBe(false);
  });

  it('limits admin terminal status choices by request type', () => {
    expect(getAllowedAdminStatuses('GENERAL_INQUIRY').includes('ANSWERED')).toBe(true);
    expect(getAllowedAdminStatuses('BUG_REPORT').includes('ANSWERED')).toBe(false);
    expect(getAllowedAdminStatuses('BUG_REPORT')).toEqual(['PENDING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'UNABLE_TO_PROCESS']);
  });
});
