import { KycApplication } from '../services/fakeKycService';

export interface StepValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates the personal_info step of the KYC application
 */
export function validatePersonalInfo(personalInfo: KycApplication['personalInfo']): StepValidationResult {
  const errors: Record<string, string> = {};

  if (!personalInfo) {
    return {
      isValid: false,
      errors: {
        legalName: 'Legal name is required.',
        dateOfBirth: 'Date of birth is required.',
        nationality: 'Nationality is required.',
      },
    };
  }

  // Legal Name Validation
  if (!personalInfo.legalName || personalInfo.legalName.trim() === '') {
    errors.legalName = 'Legal name is required.';
  } else if (personalInfo.legalName.trim().length < 2) {
    errors.legalName = 'Legal name must be at least 2 characters.';
  }

  // Date of Birth Validation
  if (!personalInfo.dateOfBirth || personalInfo.dateOfBirth.trim() === '') {
    errors.dateOfBirth = 'Date of birth is required.';
  } else {
    // Validate format YYYY-MM-DD
    const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dobRegex.test(personalInfo.dateOfBirth)) {
      errors.dateOfBirth = 'Date of birth must be in YYYY-MM-DD format.';
    } else {
      const dobDate = new Date(personalInfo.dateOfBirth);
      if (isNaN(dobDate.getTime())) {
        errors.dateOfBirth = 'Invalid date of birth.';
      } else {
        // Validate at least 18 years old
        const today = new Date();
        let age = today.getFullYear() - dobDate.getFullYear();
        const m = today.getMonth() - dobDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
          age--;
        }

        if (age < 18) {
          errors.dateOfBirth = 'You must be at least 18 years old.';
        } else if (age > 120) {
          errors.dateOfBirth = 'Please enter a valid year of birth.';
        }
      }
    }
  }

  // Nationality Validation
  if (!personalInfo.nationality || personalInfo.nationality.trim() === '') {
    errors.nationality = 'Nationality is required.';
  } else if (personalInfo.nationality.trim().length < 2) {
    errors.nationality = 'Nationality must be at least 2 characters.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates the address step of the KYC application
 */
export function validateAddress(address: KycApplication['address']): StepValidationResult {
  const errors: Record<string, string> = {};

  if (!address) {
    return {
      isValid: false,
      errors: {
        country: 'Country is required.',
        city: 'City is required.',
        line1: 'Address line 1 is required.',
      },
    };
  }

  // Country Validation
  if (!address.country || address.country.trim() === '') {
    errors.country = 'Country is required.';
  }

  // City Validation
  if (!address.city || address.city.trim() === '') {
    errors.city = 'City is required.';
  }

  // Line1 Validation
  if (!address.line1 || address.line1.trim() === '') {
    errors.line1 = 'Address line 1 is required.';
  } else if (address.line1.trim().length < 5) {
    errors.line1 = 'Address line 1 must be at least 5 characters.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates the document step of the KYC application
 */
export function validateDocument(document: KycApplication['document']): StepValidationResult {
  const errors: Record<string, string> = {};

  if (!document) {
    return {
      isValid: false,
      errors: {
        type: 'Document type is required.',
        documentNumber: 'Document number is required.',
      },
    };
  }

  // Document Type Validation
  if (!document.type) {
    errors.type = 'Document type is required.';
  } else if (!['passport', 'national_id', 'drivers_license'].includes(document.type)) {
    errors.type = 'Invalid document type selected.';
  }

  // Document Number Validation
  if (!document.documentNumber || document.documentNumber.trim() === '') {
    errors.documentNumber = 'Document number is required.';
  } else if (document.documentNumber.trim().length < 4) {
    errors.documentNumber = 'Document number must be at least 4 characters.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates the step-specific data inside localDraft
 */
export function validateStep(step: string, app: KycApplication): StepValidationResult {
  switch (step) {
    case 'personal_info':
      return validatePersonalInfo(app.personalInfo);
    case 'address':
      return validateAddress(app.address);
    case 'document':
      return validateDocument(app.document);
    default:
      return { isValid: true, errors: {} };
  }
}
