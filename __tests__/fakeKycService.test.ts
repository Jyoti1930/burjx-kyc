import * as fakeKycService from '../src/services/fakeKycService';

describe('fakeKycService', () => {
  beforeEach(() => {
    // Reset state before each test
    fakeKycService.resetFakeKycServiceState();
    fakeKycService.setDelayMs(0); // Make tests run instantly!
  });

  test('initial state matches expected schema', async () => {
    const app = await fakeKycService.fetchKycApplication();
    expect(app.id).toBe('app_12345');
    expect(app.status).toBe('not_started');
    expect(app.currentStep).toBe('personal_info');
    expect(app.personalInfo).toBeUndefined();
  });

  test('saveKycDraft merges patch and updates status to draft', async () => {
    const patch = {
      personalInfo: {
        legalName: 'Alice Smith',
        dateOfBirth: '1990-01-01',
        nationality: 'British',
      },
    };
    const updated = await fakeKycService.saveKycDraft(patch);
    expect(updated.status).toBe('draft');
    expect(updated.personalInfo?.legalName).toBe('Alice Smith');
    expect(updated.personalInfo?.nationality).toBe('British');

    // Fetch should match
    const fetched = await fakeKycService.fetchKycApplication();
    expect(fetched.personalInfo?.legalName).toBe('Alice Smith');
  });

  test('submitKycApplication transitions status to submitted', async () => {
    const app = await fakeKycService.fetchKycApplication();
    const submitted = await fakeKycService.submitKycApplication(app.id);
    expect(submitted.status).toBe('submitted');
  });

  test('pollKycStatus resolves to approved after 3 polling attempts for standard document', async () => {
    // 1. Setup doc and submit
    await fakeKycService.saveKycDraft({
      document: {
        type: 'passport',
        documentNumber: 'VALID999',
      },
    });
    await fakeKycService.submitKycApplication('app_12345');

    // 2. Poll 1
    let app = await fakeKycService.pollKycStatus();
    expect(app.status).toBe('submitted');

    // 3. Poll 2
    app = await fakeKycService.pollKycStatus();
    expect(app.status).toBe('submitted');

    // 4. Poll 3 -> Transitions to approved
    app = await fakeKycService.pollKycStatus();
    expect(app.status).toBe('approved');
  });

  test('REJECT001 documentNumber deterministically triggers rejected status', async () => {
    await fakeKycService.saveKycDraft({
      document: { type: 'passport', documentNumber: 'REJECT001' },
    });
    await fakeKycService.submitKycApplication('app_12345');

    const app = await fakeKycService.pollKycStatus();
    expect(app.status).toBe('rejected');
    expect(app.rejectionReason).toBeDefined();
  });

  test('MOREINFO001 documentNumber deterministically triggers requires_more_info status', async () => {
    await fakeKycService.saveKycDraft({
      document: { type: 'passport', documentNumber: 'MOREINFO001' },
    });
    await fakeKycService.submitKycApplication('app_12345');

    const app = await fakeKycService.pollKycStatus();
    expect(app.status).toBe('requires_more_info');
    expect(app.requiredFields).toContain('personalInfo.legalName');
    expect(app.requiredFields).toContain('address.line1');
  });

  test('FAIL001 documentNumber triggers a rejected Promise (network failure)', async () => {
    await fakeKycService.saveKycDraft({
      document: { type: 'passport', documentNumber: 'FAIL001' },
    });
    await fakeKycService.submitKycApplication('app_12345');

    await expect(fakeKycService.pollKycStatus()).rejects.toThrow('Simulated network failure (FAIL001)');
  });

  test('polling is bounded to maximum of 5 attempts and throws timeout', async () => {
    await fakeKycService.saveKycDraft({
      document: { type: 'passport', documentNumber: 'VALID999' },
    });
    await fakeKycService.submitKycApplication('app_12345');

    // Poll 1, 2, 3 (transitions to approved), 4, 5
    await fakeKycService.pollKycStatus(); // 1
    await fakeKycService.pollKycStatus(); // 2
    await fakeKycService.pollKycStatus(); // 3 (approved)
    await fakeKycService.pollKycStatus(); // 4
    await fakeKycService.pollKycStatus(); // 5

    // 6th attempt throws timeout error
    await expect(fakeKycService.pollKycStatus()).rejects.toThrow('Polling timeout after 5 attempts');
  });
});
