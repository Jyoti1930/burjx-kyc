import * as kycValidation from '../src/validation/kycValidation';

describe('kycValidation', () => {
  // 1. Personal Info Validations
  describe('validatePersonalInfo', () => {
    test('rejects missing or empty fields', () => {
      const res = kycValidation.validatePersonalInfo(undefined);
      expect(res.isValid).toBe(false);
      expect(res.errors.legalName).toBeDefined();

      const resEmpty = kycValidation.validatePersonalInfo({
        legalName: ' ',
        dateOfBirth: '',
        nationality: '',
      });
      expect(resEmpty.isValid).toBe(false);
      expect(resEmpty.errors.legalName).toBeDefined();
      expect(resEmpty.errors.dateOfBirth).toBeDefined();
      expect(resEmpty.errors.nationality).toBeDefined();
    });

    test('rejects short legal names', () => {
      const res = kycValidation.validatePersonalInfo({
        legalName: 'A',
        dateOfBirth: '1995-10-10',
        nationality: 'France',
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.legalName).toBe('Legal name must be at least 2 characters.');
    });

    test('rejects invalid date formats', () => {
      const res = kycValidation.validatePersonalInfo({
        legalName: 'Bob Vance',
        dateOfBirth: '10-10-1995', // Invalid format
        nationality: 'American',
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.dateOfBirth).toBe('Date of birth must be in YYYY-MM-DD format.');
    });

    test('rejects users under 18 years old', () => {
      // Create date of birth corresponding to a 17-year old
      const today = new Date();
      const dobYear = today.getFullYear() - 17;
      const dobString = `${dobYear}-06-01`;

      const res = kycValidation.validatePersonalInfo({
        legalName: 'Alice Young',
        dateOfBirth: dobString,
        nationality: 'Canadian',
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.dateOfBirth).toBe('You must be at least 18 years old.');
    });

    test('accepts users 18 or older with valid details', () => {
      const res = kycValidation.validatePersonalInfo({
        legalName: 'John Doe',
        dateOfBirth: '1990-05-15',
        nationality: 'Irish',
      });
      expect(res.isValid).toBe(true);
      expect(Object.keys(res.errors).length).toBe(0);
    });
  });

  // 2. Address Validations
  describe('validateAddress', () => {
    test('rejects missing or empty fields', () => {
      const res = kycValidation.validateAddress(undefined);
      expect(res.isValid).toBe(false);

      const resEmpty = kycValidation.validateAddress({
        country: '',
        city: ' ',
        line1: '',
      });
      expect(resEmpty.isValid).toBe(false);
      expect(resEmpty.errors.country).toBeDefined();
      expect(resEmpty.errors.city).toBeDefined();
      expect(resEmpty.errors.line1).toBeDefined();
    });

    test('rejects line 1 under 5 characters', () => {
      const res = kycValidation.validateAddress({
        country: 'Germany',
        city: 'Berlin',
        line1: '123',
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.line1).toBe('Address line 1 must be at least 5 characters.');
    });

    test('accepts valid address', () => {
      const res = kycValidation.validateAddress({
        country: 'Germany',
        city: 'Berlin',
        line1: 'Kaiserstr. 45',
      });
      expect(res.isValid).toBe(true);
    });
  });

  // 3. Document Validations
  describe('validateDocument', () => {
    test('rejects missing or empty fields', () => {
      const res = kycValidation.validateDocument(undefined);
      expect(res.isValid).toBe(false);
    });

    test('rejects invalid document type', () => {
      const res = kycValidation.validateDocument({
        type: 'invalid_type' as any,
        documentNumber: '12345',
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.type).toBe('Invalid document type selected.');
    });

    test('rejects short document numbers', () => {
      const res = kycValidation.validateDocument({
        type: 'passport',
        documentNumber: '123',
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.documentNumber).toBe('Document number must be at least 4 characters.');
    });

    test('accepts valid document details', () => {
      const res = kycValidation.validateDocument({
        type: 'passport',
        documentNumber: 'AB12345',
      });
      expect(res.isValid).toBe(true);
    });
  });
});
