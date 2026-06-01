import { kycReducer, INITIAL_STATE } from '../src/store/kycReducer';
import { KycFlowState } from '../src/store/kycTypes';

describe('kycReducer', () => {
  test('returns initial state on default / unknown action', () => {
    const res = kycReducer(INITIAL_STATE, { type: 'UNKNOWN_ACTION' } as any);
    expect(res).toBe(INITIAL_STATE);
  });

  test('INIT_START sets loading state', () => {
    const res = kycReducer(INITIAL_STATE, { type: 'INIT_START' });
    expect(res.loading).toBe(true);
    expect(res.error).toBeNull();
  });

  // --- State Machine Transition Guards ---
  describe('State Machine Guards', () => {
    test('UPDATE_FIELD is disallowed if application is already submitted', () => {
      const submittedState: KycFlowState = {
        ...INITIAL_STATE,
        application: { ...INITIAL_STATE.application, status: 'submitted' },
      };

      const res = kycReducer(submittedState, {
        type: 'UPDATE_FIELD',
        payload: { step: 'personal_info', fields: { legalName: 'New Name' } },
      });

      // State is unchanged (blocked)
      expect(res).toBe(submittedState);
    });

    test('UPDATE_FIELD is disallowed if application is approved (terminal state)', () => {
      const approvedState: KycFlowState = {
        ...INITIAL_STATE,
        application: { ...INITIAL_STATE.application, status: 'approved' },
      };

      const res = kycReducer(approvedState, {
        type: 'UPDATE_FIELD',
        payload: { step: 'personal_info', fields: { legalName: 'New Name' } },
      });

      expect(res).toBe(approvedState);
    });

    test('SET_STEP is blocked from going back to draft editing if approved', () => {
      const approvedState: KycFlowState = {
        ...INITIAL_STATE,
        application: { ...INITIAL_STATE.application, status: 'approved' },
      };

      const res = kycReducer(approvedState, {
        type: 'SET_STEP',
        payload: 'personal_info',
      });

      expect(res).toBe(approvedState); // Blocked, unchanged
    });
  });

  // --- Conflict Resolution Strategy ---
  describe('Conflict Resolution Strategy', () => {
    test('Strategy 1: Server status is submitted, approved, or rejected -> local edits must not overwrite', () => {
      const fetchedServer = {
        id: 'app_12345',
        status: 'approved' as const,
        currentStep: 'status' as const,
        personalInfo: { legalName: 'Server John', dateOfBirth: '1985-05-05', nationality: 'Irish' },
        updatedAt: '2026-06-01T15:00:00.000Z',
      };

      const recoveredLocal = {
        id: 'app_12345',
        status: 'draft' as const,
        currentStep: 'personal_info' as const,
        personalInfo: { legalName: 'Local Unsaved Edit', dateOfBirth: '1985-05-05', nationality: 'Irish' },
        updatedAt: '2026-06-01T16:00:00.000Z', // Local is newer
      };

      const res = kycReducer(INITIAL_STATE, {
        type: 'INIT_SUCCESS',
        payload: { application: fetchedServer, localDraft: recoveredLocal },
      });

      // Should completely override local with server approved state
      expect(res.localDraft.status).toBe('approved');
      expect(res.localDraft.personalInfo?.legalName).toBe('Server John');
    });

    test('Strategy 2: Server status is requires_more_info -> retain requires_more_info status and fields', () => {
      const fetchedServer = {
        id: 'app_12345',
        status: 'requires_more_info' as const,
        currentStep: 'status' as const,
        requiredFields: ['personalInfo.legalName' as const],
        updatedAt: '2026-06-01T15:00:00.000Z',
      };

      const recoveredLocal = {
        id: 'app_12345',
        status: 'draft' as const,
        currentStep: 'personal_info' as const,
        personalInfo: { legalName: 'Local Edit', dateOfBirth: '1985-05-05', nationality: 'Irish' },
        updatedAt: '2026-06-01T16:00:00.000Z',
      };

      const res = kycReducer(INITIAL_STATE, {
        type: 'INIT_SUCCESS',
        payload: { application: fetchedServer, localDraft: recoveredLocal },
      });

      expect(res.localDraft.status).toBe('requires_more_info');
      expect(res.localDraft.personalInfo?.legalName).toBe('Local Edit');
      expect(res.localDraft.requiredFields).toContain('personalInfo.legalName');
    });

    test('Strategy 3: Local is newer & server is draft -> prefer local draft', () => {
      const fetchedServer = {
        id: 'app_12345',
        status: 'draft' as const,
        currentStep: 'personal_info' as const,
        personalInfo: { legalName: 'Server John', dateOfBirth: '1985-05-05', nationality: 'Irish' },
        updatedAt: '2026-06-01T14:00:00.000Z',
      };

      const recoveredLocal = {
        id: 'app_12345',
        status: 'draft' as const,
        currentStep: 'personal_info' as const,
        personalInfo: { legalName: 'Local Alice', dateOfBirth: '1985-05-05', nationality: 'Irish' },
        updatedAt: '2026-06-01T15:00:00.000Z', // Local is newer
      };

      const res = kycReducer(INITIAL_STATE, {
        type: 'INIT_SUCCESS',
        payload: { application: fetchedServer, localDraft: recoveredLocal },
      });

      expect(res.localDraft.personalInfo?.legalName).toBe('Local Alice');
      expect(res.application.personalInfo?.legalName).toBe('Local Alice');
    });
  });
});
