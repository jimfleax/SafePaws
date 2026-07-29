import { ValidateProps } from '../../../api-lib/constants';

describe('ValidateProps', () => {
  it('should include role validation in ValidateProps.user', () => {
    expect(ValidateProps.user.role).toBeDefined();
    expect(ValidateProps.user.role.type).toBe('string');
    expect(ValidateProps.user.role.minLength).toBe(1);
    expect(ValidateProps.user.role.maxLength).toBe(50);
  });
});
