import { render, screen } from '@testing-library/react';
import { InquiryMessageComposer } from './InquiryMessageComposer';

describe('InquiryMessageComposer', () => {
  it('keeps the admin email notification unchecked initially', () => {
    render(<InquiryMessageComposer inquiryId={1} admin onSent={() => undefined} />);
    expect((screen.getByLabelText('사용자에게 이메일 알림 발송') as HTMLInputElement).checked).toBe(false);
  });
});
