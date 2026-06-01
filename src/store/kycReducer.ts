import { KycFlowState, KycFlowAction } from './kycTypes';
import { KycApplication, KycStep } from '../services/fakeKycService';

export const INITIAL_STATE: KycFlowState = {
  application: {
    id: 'app_12345',
    status: 'not_started',
    currentStep: 'personal_info',
    updatedAt: new Date('2026-06-01T12:00:00.000Z').toISOString(),
  },
  localDraft: {
    id: 'app_12345',
    status: 'not_started',
    currentStep: 'personal_info',
    updatedAt: new Date('2026-06-01T12:00:00.000Z').toISOString(),
  },
  loading: false,
  saving: false,
  submitting: false,
  polling: false,
  error: null,
  stepErrors: {},
  isLoaded: false,
};

export function kycReducer(state: KycFlowState, action: KycFlowAction): KycFlowState {
  switch (action.type) {
    case 'INIT_START':
      return {
        ...state,
        loading: true,
        error: null,
      };

    case 'INIT_SUCCESS': {
      const { application: fetchedApp, localDraft: recoveredLocal } = action.payload;

      // --- Conflict Resolution Strategy ---
      let resolvedApp: KycApplication;
      let resolvedLocal: KycApplication;

      // 1. If service status is submitted, approved, or rejected (terminal/immutable state on server)
      if (['submitted', 'approved', 'rejected'].includes(fetchedApp.status)) {
        // Local edits must not overwrite it; sync with server completely.
        resolvedApp = { ...fetchedApp };
        resolvedLocal = { ...fetchedApp };
      }
      // 2. If service status is requires_more_info
      else if (fetchedApp.status === 'requires_more_info') {
        // Merge recovered data but retain server status and requiredFields
        resolvedApp = { ...fetchedApp };
        resolvedLocal = {
          ...recoveredLocal,
          id: fetchedApp.id,
          status: 'requires_more_info',
          requiredFields: fetchedApp.requiredFields,
          updatedAt: fetchedApp.updatedAt,
        };
      }
      // 3. If local draft is newer and server is still in draft / not_started
      else if (
        new Date(recoveredLocal.updatedAt).getTime() > new Date(fetchedApp.updatedAt).getTime() &&
        ['draft', 'not_started'].includes(fetchedApp.status)
      ) {
        // Prefer local draft, keep status as recovered local or fetched draft
        resolvedLocal = { ...recoveredLocal };
        resolvedApp = {
          ...fetchedApp,
          personalInfo: recoveredLocal.personalInfo,
          address: recoveredLocal.address,
          document: recoveredLocal.document,
          currentStep: recoveredLocal.currentStep,
          status: fetchedApp.status === 'not_started' ? 'draft' : fetchedApp.status,
          updatedAt: recoveredLocal.updatedAt,
        };
      }
      // 4. Default: prefer server state
      else {
        resolvedApp = { ...fetchedApp };
        resolvedLocal = { ...fetchedApp };
      }

      return {
        ...state,
        loading: false,
        isLoaded: true,
        application: resolvedApp,
        localDraft: resolvedLocal,
      };
    }

    case 'INIT_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case 'UPDATE_FIELD': {
      const { step, fields } = action.payload;

      // State Machine Guard: If terminal state, do not allow edits
      if (['approved', 'rejected', 'submitted'].includes(state.application.status)) {
        return state;
      }

      // Sync nested fields
      const updatedDraft = { ...state.localDraft };

      if (step === 'personal_info') {
        updatedDraft.personalInfo = {
          ...updatedDraft.personalInfo,
          ...fields,
        } as any;
      } else if (step === 'address') {
        updatedDraft.address = {
          ...updatedDraft.address,
          ...fields,
        } as any;
      } else if (step === 'document') {
        updatedDraft.document = {
          ...updatedDraft.document,
          ...fields,
        } as any;
      }

      updatedDraft.updatedAt = new Date().toISOString();
      if (updatedDraft.status === 'not_started') {
        updatedDraft.status = 'draft';
      }

      return {
        ...state,
        localDraft: updatedDraft,
        // Clear errors as user corrects fields
        stepErrors: {},
      };
    }

    case 'SET_STEP': {
      const targetStep = action.payload;

      // State Machine Guard: Can't move from terminal states approved/rejected back to draft steps
      if (
        ['approved', 'rejected'].includes(state.application.status) &&
        targetStep !== 'status'
      ) {
        // Disallowed state transition: going from approved/rejected back to editing draft is blocked
        return state;
      }

      // State Machine Guard: If submitted/polling, must stay on status page
      if (
        ['submitted'].includes(state.application.status) &&
        targetStep !== 'status'
      ) {
        return state;
      }

      return {
        ...state,
        localDraft: {
          ...state.localDraft,
          currentStep: targetStep,
        },
        stepErrors: {},
        error: null,
      };
    }

    case 'SAVE_DRAFT_START':
      return {
        ...state,
        saving: true,
        error: null,
      };

    case 'SAVE_DRAFT_SUCCESS':
      return {
        ...state,
        saving: false,
        application: action.payload,
        localDraft: action.payload,
      };

    case 'SAVE_DRAFT_FAILURE':
      return {
        ...state,
        saving: false,
        error: action.payload,
      };

    case 'SUBMIT_START':
      return {
        ...state,
        submitting: true,
        error: null,
      };

    case 'SUBMIT_SUCCESS':
      return {
        ...state,
        submitting: false,
        application: action.payload,
        localDraft: action.payload,
      };

    case 'SUBMIT_FAILURE':
      return {
        ...state,
        submitting: false,
        error: action.payload,
      };

    case 'POLL_START':
      return {
        ...state,
        polling: true,
        error: null,
      };

    case 'POLL_SUCCESS':
      return {
        ...state,
        polling: false,
        application: action.payload,
        localDraft: action.payload,
      };

    case 'POLL_FAILURE':
      return {
        ...state,
        polling: false,
        error: action.payload,
      };

    case 'SET_ERRORS':
      return {
        ...state,
        stepErrors: action.payload,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'RESET_STATE':
      return {
        ...INITIAL_STATE,
        application: {
          ...INITIAL_STATE.application,
          updatedAt: new Date().toISOString(),
        },
        localDraft: {
          ...INITIAL_STATE.localDraft,
          updatedAt: new Date().toISOString(),
        },
      };

    default:
      return state;
  }
}
