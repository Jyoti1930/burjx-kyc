import { useReducer, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { kycReducer, INITIAL_STATE } from '../store/kycReducer';
import { KycStep, KycApplication } from '../services/fakeKycService';
import * as fakeKycService from '../services/fakeKycService';
import { validateStep } from '../validation/kycValidation';

const STORAGE_KEY = '@burjx_kyc_local_draft';

// PRODUCTION SECURITY COMMENT:
// In production, storing plain text sensitive PII (Legal Name, DOB, Doc Number) in AsyncStorage
// presents a severe compliance and security risk. To secure it in production:
// 1. Store only non-sensitive metadata in AsyncStorage (e.g. current step, ID).
// 2. For PII data, use Expo SecureStore (which uses iOS Keychain / Android Keystore) for values under 2KB.
// 3. For the entire application draft JSON structure, encrypt it using AES-256-GCM. The encryption key
//    should be generated securely on first launch, stored inside Expo SecureStore, and used to encrypt
//    the draft before saving to AsyncStorage, and decrypt it upon recovery.

export function useKycFlow() {
  const [state, dispatch] = useReducer(kycReducer, INITIAL_STATE);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to persist draft locally
  const persistLocalDraft = async (draft: KycApplication) => {
    try {
      const jsonValue = JSON.stringify(draft);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    } catch (e) {
      // Avoid printing sensitive variables in errors
    }
  };

  // Helper to clear local draft storage
  const clearLocalDraft = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // console.error('Failed to clear draft from AsyncStorage');
    }
  };

  // Status Polling Loop
  const startPolling = useCallback((appId: string) => {
    if (pollingTimerRef.current) return;

    dispatch({ type: 'POLL_START' });

    const poll = async () => {
      try {
        const updatedApp = await fakeKycService.pollKycStatus();
        dispatch({ type: 'POLL_SUCCESS', payload: updatedApp });
        await persistLocalDraft(updatedApp);

        if (updatedApp.status === 'approved' || updatedApp.status === 'rejected') {
          stopPolling();
        } else if (updatedApp.status === 'requires_more_info') {
          stopPolling();
          // Trigger redirect based on required fields
          if (updatedApp.requiredFields && updatedApp.requiredFields.length > 0) {
            const firstField = updatedApp.requiredFields[0];
            let targetStep: KycStep = 'personal_info';
            if (firstField.startsWith('address')) {
              targetStep = 'address';
            } else if (firstField.startsWith('document')) {
              targetStep = 'document';
            }
            dispatch({ type: 'SET_STEP', payload: targetStep });
          }
        } else {
          // Continue polling
          pollingTimerRef.current = setTimeout(poll, 1500);
        }
      } catch (err: any) {
        stopPolling();
        dispatch({ type: 'POLL_FAILURE', payload: err.message || 'Polling error occurred.' });
      }
    };

    // Run first poll after a delay
    pollingTimerRef.current = setTimeout(poll, 1500);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  }, []);

  // Cleanup polling timer on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // Load state on mount (Draft Recovery + Conflict Resolution)
  const initializeKyc = useCallback(async () => {
    dispatch({ type: 'INIT_START' });
    try {
      // 1. Recover local draft from AsyncStorage
      let localDraft: KycApplication | null = null;
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonValue) {
        localDraft = JSON.parse(jsonValue);
      }

      // 2. Fetch server application
      const serverApp = await fakeKycService.fetchKycApplication();

      // 3. Build baseline draft if none recovered
      const recoveredDraft: KycApplication = localDraft || {
        id: serverApp.id,
        status: 'not_started',
        currentStep: 'personal_info',
        updatedAt: new Date('2026-06-01T12:00:00.000Z').toISOString(),
      };

      // 4. Resolve conflicts via Reducer
      dispatch({
        type: 'INIT_SUCCESS',
        payload: { application: serverApp, localDraft: recoveredDraft },
      });
    } catch (e: any) {
      dispatch({ type: 'INIT_FAILURE', payload: e.message || 'Failed to initialize KYC.' });
    }
  }, []);

  useEffect(() => {
    initializeKyc();
  }, [initializeKyc]);

  // Trigger post-initialization side-effects (Sync and Polling resume)
  useEffect(() => {
    if (!state.isLoaded) return;

    // Persist resolved local draft back to AsyncStorage
    persistLocalDraft(state.localDraft);

    // If status is submitted, auto-resume status polling
    if (state.application.status === 'submitted') {
      startPolling(state.application.id);
    }

    // If status is requires_more_info, route to correct step
    if (state.application.status === 'requires_more_info' && state.application.requiredFields) {
      const requiredFields = state.application.requiredFields;
      if (requiredFields.length > 0) {
        const firstRequired = requiredFields[0];
        let targetStep: KycStep = 'personal_info';
        if (firstRequired.startsWith('address')) {
          targetStep = 'address';
        } else if (firstRequired.startsWith('document')) {
          targetStep = 'document';
        }
        if (state.localDraft.currentStep !== targetStep) {
          dispatch({ type: 'SET_STEP', payload: targetStep });
        }
      }
    }
  }, [state.isLoaded, state.application.status, state.application.id, startPolling]);

  // Actions
  const updateField = useCallback(
    (step: KycStep, fields: Record<string, any>) => {
      dispatch({ type: 'UPDATE_FIELD', payload: { step, fields } });
    },
    []
  );

  const setStep = useCallback(
    async (targetStep: KycStep) => {
      const currentStep = state.localDraft.currentStep;

      // Only perform validation when moving forward in the wizard
      const stepOrder: KycStep[] = ['personal_info', 'address', 'document', 'review', 'status'];
      const currentIndex = stepOrder.indexOf(currentStep);
      const targetIndex = stepOrder.indexOf(targetStep);

      if (targetIndex > currentIndex) {
        // Must validate current step before moving forward
        const validation = validateStep(currentStep, state.localDraft);
        if (!validation.isValid) {
          dispatch({ type: 'SET_ERRORS', payload: validation.errors });
          return false;
        }
      }

      dispatch({ type: 'SET_STEP', payload: targetStep });
      await persistLocalDraft({
        ...state.localDraft,
        currentStep: targetStep,
      });
      return true;
    },
    [state.localDraft]
  );

  const saveDraft = useCallback(async () => {
    dispatch({ type: 'SAVE_DRAFT_START' });
    try {
      // Call fake service draft save
      const savedApp = await fakeKycService.saveKycDraft(state.localDraft);
      dispatch({ type: 'SAVE_DRAFT_SUCCESS', payload: savedApp });
      await persistLocalDraft(savedApp);
      return true;
    } catch (e: any) {
      dispatch({ type: 'SAVE_DRAFT_FAILURE', payload: e.message || 'Failed to save draft.' });
      return false;
    }
  }, [state.localDraft]);

  const submitApplication = useCallback(async () => {
    // 1. Validate all steps before submission
    const valPersonalInfo = validateStep('personal_info', state.localDraft);
    const valAddress = validateStep('address', state.localDraft);
    const valDocument = validateStep('document', state.localDraft);

    if (!valPersonalInfo.isValid || !valAddress.isValid || !valDocument.isValid) {
      const mergedErrors = {
        ...valPersonalInfo.errors,
        ...valAddress.errors,
        ...valDocument.errors,
      };
      dispatch({ type: 'SET_ERRORS', payload: mergedErrors });
      return false;
    }

    dispatch({ type: 'SUBMIT_START' });
    try {
      // 2. Save latest draft state on server first
      const savedApp = await fakeKycService.saveKycDraft(state.localDraft);
      
      // 3. Submit application
      const submittedApp = await fakeKycService.submitKycApplication(savedApp.id);
      dispatch({ type: 'SUBMIT_SUCCESS', payload: submittedApp });
      await persistLocalDraft(submittedApp);

      // 4. Start status polling
      startPolling(submittedApp.id);
      return true;
    } catch (e: any) {
      dispatch({ type: 'SUBMIT_FAILURE', payload: e.message || 'Submission failed.' });
      return false;
    }
  }, [state.localDraft, startPolling]);

  const retrySubmission = useCallback(async () => {
    dispatch({ type: 'CLEAR_ERROR' });
    return await submitApplication();
  }, [submitApplication]);

  const resetState = useCallback(async () => {
    stopPolling();
    fakeKycService.resetFakeKycServiceState();
    await clearLocalDraft();
    dispatch({ type: 'RESET_STATE' });
  }, [stopPolling]);

  return {
    state,
    updateField,
    setStep,
    saveDraft,
    submitApplication,
    retrySubmission,
    resetState,
    initializeKyc,
  };
}
