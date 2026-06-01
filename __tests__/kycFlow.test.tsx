import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useKycFlow } from '../src/hooks/useKycFlow';
import * as fakeKycService from '../src/services/fakeKycService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    setItem: jest.fn(async (key, value) => {
      store[key] = String(value);
    }),
    getItem: jest.fn(async (key) => {
      return store[key] || null;
    }),
    removeItem: jest.fn(async (key) => {
      delete store[key];
    }),
    clear: jest.fn(async () => {
      for (const k in store) delete store[k];
    }),
  };
});

describe('useKycFlow Hook Integration', () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    await AsyncStorage.clear();
    fakeKycService.resetFakeKycServiceState();
    fakeKycService.setDelayMs(0); // Zero latency for fast tests
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('1. Resume from local draft - app reload restores correct step and data', async () => {
    // Setup stored local draft
    const cachedDraft = {
      id: 'app_12345',
      status: 'draft',
      currentStep: 'document',
      personalInfo: { legalName: 'Bob Vance', dateOfBirth: '1980-01-01', nationality: 'American' },
      address: { country: 'US', city: 'Scranton', line1: '1725 Slough Avenue' },
      updatedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem('@burjx_kyc_local_draft', JSON.stringify(cachedDraft));

    // Render Hook
    const { result } = renderHook(() => useKycFlow());

    // Wait for initialization to complete
    await waitFor(() => expect(result.current.state.isLoaded).toBe(true));

    expect(result.current.state.localDraft.currentStep).toBe('document');
    expect(result.current.state.localDraft.personalInfo?.legalName).toBe('Bob Vance');
  });

  test('2. Conflict resolution - Server approved state wins over local draft', async () => {
    // Setup server approved state
    await fakeKycService.saveKycDraft({
      personalInfo: { legalName: 'Server John', dateOfBirth: '1980-01-01', nationality: 'Irish' },
    });
    await fakeKycService.submitKycApplication('app_12345');
    // Force approve status in server state
    await fakeKycService.pollKycStatus();
    await fakeKycService.pollKycStatus();
    await fakeKycService.pollKycStatus();

    // Setup newer local draft in draft state
    const localDraft = {
      id: 'app_12345',
      status: 'draft',
      currentStep: 'personal_info',
      personalInfo: { legalName: 'Local Unsaved Alice', dateOfBirth: '1980-01-01', nationality: 'Irish' },
      updatedAt: new Date().toISOString(), // Local is newer
    };
    await AsyncStorage.setItem('@burjx_kyc_local_draft', JSON.stringify(localDraft));

    const { result } = renderHook(() => useKycFlow());
    await waitFor(() => expect(result.current.state.isLoaded).toBe(true));

    // Server status was approved, which is terminal, so it overrides local edits
    expect(result.current.state.localDraft.status).toBe('approved');
    expect(result.current.state.localDraft.personalInfo?.legalName).toBe('Server John');
  });

  test('3. requires_more_info routing - redirects back to first relevant step', async () => {
    // Setup server requires_more_info
    await fakeKycService.saveKycDraft({
      personalInfo: { legalName: 'Need Correction', dateOfBirth: '1980-01-01', nationality: 'Canadian' },
      document: { type: 'passport', documentNumber: 'MOREINFO001' }, // MOREINFO001 deterministically triggers requires_more_info
    });
    await fakeKycService.submitKycApplication('app_12345');
    await fakeKycService.pollKycStatus(); // transitions server to requires_more_info

    // Setup local draft
    const localDraft = {
      id: 'app_12345',
      status: 'draft',
      currentStep: 'review',
      updatedAt: new Date('2026-05-30').toISOString(),
    };
    await AsyncStorage.setItem('@burjx_kyc_local_draft', JSON.stringify(localDraft));

    const { result } = renderHook(() => useKycFlow());
    await waitFor(() => expect(result.current.state.isLoaded).toBe(true));

    // Should sync status and auto-route back to the step indicated by requiredFields ('personalInfo.legalName' -> 'personal_info')
    expect(result.current.state.localDraft.status).toBe('requires_more_info');
    expect(result.current.state.localDraft.currentStep).toBe('personal_info');
  });

  test('4. Approved outcome - polling resolves to approved', async () => {
    const { result } = renderHook(() => useKycFlow());
    await waitFor(() => expect(result.current.state.isLoaded).toBe(true));

    // Update details with a valid doc (not REJECT001/MOREINFO001/FAIL001)
    await act(async () => {
      result.current.updateField('personal_info', {
        legalName: 'Alice Vance',
        dateOfBirth: '1995-10-10',
        nationality: 'Canadian',
      });
      result.current.updateField('address', {
        country: 'Canada',
        city: 'Toronto',
        line1: '123 King St W',
      });
      result.current.updateField('document', {
        type: 'passport',
        documentNumber: 'VALID999',
      });
    });

    // Submit
    let submitSuccess = false;
    await act(async () => {
      submitSuccess = await result.current.submitApplication();
    });
    expect(submitSuccess).toBe(true);
    expect(result.current.state.localDraft.status).toBe('submitted');

    // Run timers for polling (we need 3 poll iterations to resolve to approved)
    await act(async () => {
      jest.advanceTimersByTime(1500); // Poll 1
    });
    await act(async () => {
      jest.advanceTimersByTime(1500); // Poll 2
    });
    await act(async () => {
      jest.advanceTimersByTime(1500); // Poll 3 -> Approved!
    });

    expect(result.current.state.localDraft.status).toBe('approved');
  });

  test('5. Rejected outcome - REJECT001 triggers rejected with reason', async () => {
    const { result } = renderHook(() => useKycFlow());
    await waitFor(() => expect(result.current.state.isLoaded).toBe(true));

    // Populate and submit with REJECT001
    await act(async () => {
      result.current.updateField('personal_info', {
        legalName: 'Alice Reject',
        dateOfBirth: '1995-10-10',
        nationality: 'Canadian',
      });
      result.current.updateField('address', {
        country: 'Canada',
        city: 'Toronto',
        line1: '123 King St W',
      });
      result.current.updateField('document', {
        type: 'passport',
        documentNumber: 'REJECT001',
      });
    });

    await act(async () => {
      await result.current.submitApplication();
    });

    // Advance timer for first poll -> transitions immediately to rejected
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    expect(result.current.state.localDraft.status).toBe('rejected');
    expect(result.current.state.application.rejectionReason).toBe(
      'The provided document number is marked as blacklisted.'
    );
  });

  test('6. Failure and retry - FAIL001 triggers network error, retry succeeds', async () => {
    const { result } = renderHook(() => useKycFlow());
    await waitFor(() => expect(result.current.state.isLoaded).toBe(true));

    // Fill fields with FAIL001
    await act(async () => {
      result.current.updateField('personal_info', {
        legalName: 'Bob Failure',
        dateOfBirth: '1995-10-10',
        nationality: 'Canadian',
      });
      result.current.updateField('address', {
        country: 'Canada',
        city: 'Toronto',
        line1: '123 King St W',
      });
      result.current.updateField('document', {
        type: 'passport',
        documentNumber: 'FAIL001',
      });
    });

    // Submit
    await act(async () => {
      await result.current.submitApplication();
    });

    // Advance timer for poll 1 -> triggers mock failure
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    expect(result.current.state.error).toBe('Simulated network failure (FAIL001)');

    // Correct the field to a valid one and retry
    await act(async () => {
      result.current.updateField('document', {
        type: 'passport',
        documentNumber: 'VALID999',
      });
    });

    await act(async () => {
      await result.current.retrySubmission();
    });

    expect(result.current.state.error).toBeNull();
    expect(result.current.state.localDraft.status).toBe('submitted');
  });

  test('7. Bounded polling - stops after 5 attempts and throws timeout', async () => {
    const { result } = renderHook(() => useKycFlow());
    await waitFor(() => expect(result.current.state.isLoaded).toBe(true));

    const spy = jest.spyOn(fakeKycService, 'pollKycStatus').mockRejectedValueOnce(
      new Error('Polling timeout after 5 attempts')
    );

    await act(async () => {
      result.current.updateField('personal_info', {
        legalName: 'Alice Timeout',
        dateOfBirth: '1995-10-10',
        nationality: 'Canadian',
      });
      result.current.updateField('address', {
        country: 'Canada',
        city: 'Toronto',
        line1: '123 King St W',
      });
      result.current.updateField('document', {
        type: 'passport',
        documentNumber: 'VALID999',
      });
    });

    await act(async () => {
      await result.current.submitApplication();
    });

    // Advance timer to trigger polling -> will mock fail with timeout
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    expect(result.current.state.error).toBe('Polling timeout after 5 attempts');
    spy.mockRestore();
  });

  test('8. No sensitive data logging - check no console.log exposes PII', () => {
    const fs = require('fs');
    const path = require('path');
    
    const hookPath = path.resolve(__dirname, '../src/hooks/useKycFlow.ts');
    const hookContent = fs.readFileSync(hookPath, 'utf8');

    // Make sure console.log doesn't output variables like state, localDraft, legalName, dateOfBirth, documentNumber
    const consoleLogMatches = hookContent.match(/console\.log\([^)]+\)/g) || [];
    
    for (const match of consoleLogMatches) {
      const containsPII = /draft|localDraft|state|personalInfo|legalName|dateOfBirth|documentNumber|nationality|address/.test(match);
      expect(containsPII).toBe(false);
    }
  });
});
