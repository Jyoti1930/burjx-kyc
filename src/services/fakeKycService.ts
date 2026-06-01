export type KycStatus =
  | 'not_started'
  | 'draft'
  | 'submitted'
  | 'requires_more_info'
  | 'approved'
  | 'rejected';

export type KycStep =
  | 'personal_info'
  | 'address'
  | 'document'
  | 'review'
  | 'status';

export type KycRequiredField =
  | 'personalInfo.legalName'
  | 'personalInfo.dateOfBirth'
  | 'personalInfo.nationality'
  | 'address.country'
  | 'address.city'
  | 'address.line1'
  | 'document.type'
  | 'document.documentNumber';

export interface KycApplication {
  id: string;
  status: KycStatus;
  currentStep: KycStep;
  personalInfo?: {
    legalName: string;
    dateOfBirth: string;
    nationality: string;
  };
  address?: {
    country: string;
    city: string;
    line1: string;
  };
  document?: {
    type: 'passport' | 'national_id' | 'drivers_license';
    documentNumber: string;
  };
  rejectionReason?: string;
  requiredFields?: KycRequiredField[];
  updatedAt: string;
}

// Latency configuration
let delayMs = 250;

export function setDelayMs(ms: number) {
  delayMs = ms;
}

function delay(): Promise<void> {
  if (delayMs === 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

// Module-level in-memory database state
const INITIAL_STATE: KycApplication = {
  id: 'app_12345',
  status: 'not_started',
  currentStep: 'personal_info',
  updatedAt: new Date('2026-06-01T12:00:00.000Z').toISOString(),
};

let currentApp: KycApplication = { ...INITIAL_STATE };
let pollingCount = 0;

/**
 * Resets the fake database state. Essential for test isolation.
 */
export function resetFakeKycServiceState() {
  currentApp = {
    ...INITIAL_STATE,
    personalInfo: undefined,
    address: undefined,
    document: undefined,
    rejectionReason: undefined,
    requiredFields: undefined,
    updatedAt: new Date('2026-06-01T12:00:00.000Z').toISOString(),
  };
  pollingCount = 0;
}

/**
 * Fetches the current KYC Application from the "server"
 */
export async function fetchKycApplication(): Promise<KycApplication> {
  await delay();
  return { ...currentApp };
}

/**
 * Saves a patch to the KYC Application draft on the "server"
 */
export async function saveKycDraft(patch: Partial<KycApplication>): Promise<KycApplication> {
  await delay();

  // If already in a terminal/submitted state, do not allow edits
  if (['submitted', 'approved', 'rejected'].includes(currentApp.status)) {
    return { ...currentApp };
  }

  // Merge the patch into currentApp
  const updatedPersonalInfo = patch.personalInfo
    ? { ...currentApp.personalInfo, ...patch.personalInfo }
    : currentApp.personalInfo;

  const updatedAddress = patch.address
    ? { ...currentApp.address, ...patch.address }
    : currentApp.address;

  const updatedDocument = patch.document
    ? { ...currentApp.document, ...patch.document }
    : currentApp.document;

  currentApp = {
    ...currentApp,
    ...patch,
    personalInfo: updatedPersonalInfo as any,
    address: updatedAddress as any,
    document: updatedDocument as any,
    status: currentApp.status === 'not_started' ? 'draft' : currentApp.status,
    updatedAt: new Date().toISOString(),
  };

  return { ...currentApp };
}

/**
 * Submits the completed draft to the "server", moving status to 'submitted'
 */
export async function submitKycApplication(applicationId: string): Promise<KycApplication> {
  await delay();

  if (currentApp.id !== applicationId) {
    throw new Error('Application ID mismatch');
  }

  // Reset polling count on new submission
  pollingCount = 0;

  currentApp = {
    ...currentApp,
    status: 'submitted',
    updatedAt: new Date().toISOString(),
  };

  return { ...currentApp };
}

/**
 * Simulates status polling. Progresses application based on deterministic inputs
 */
export async function pollKycStatus(): Promise<KycApplication> {
  await delay();

  pollingCount++;

  // 1. Bound to maximum of 5 attempts, then throw a timeout error
  if (pollingCount > 5) {
    throw new Error('Polling timeout after 5 attempts');
  }

  if (currentApp.status !== 'submitted' && currentApp.status !== 'requires_more_info') {
    return { ...currentApp };
  }

  const docNumber = currentApp.document?.documentNumber;

  // 2. Deterministic inputs
  if (docNumber === 'FAIL001') {
    // FAIL001 triggers a rejected promise (network failure)
    throw new Error('Simulated network failure (FAIL001)');
  }

  if (docNumber === 'REJECT001') {
    currentApp = {
      ...currentApp,
      status: 'rejected',
      rejectionReason: 'The provided document number is marked as blacklisted.',
      updatedAt: new Date().toISOString(),
    };
    return { ...currentApp };
  }

  if (docNumber === 'MOREINFO001') {
    currentApp = {
      ...currentApp,
      status: 'requires_more_info',
      requiredFields: ['personalInfo.legalName', 'address.line1'],
      updatedAt: new Date().toISOString(),
    };
    return { ...currentApp };
  }

  // Any other input: approved on the 3rd polling attempt (to simulate server work)
  if (pollingCount >= 3) {
    currentApp = {
      ...currentApp,
      status: 'approved',
      updatedAt: new Date().toISOString(),
    };
  }

  return { ...currentApp };
}
