import { KycApplication, KycStep } from '../services/fakeKycService';

export interface KycFlowState {
  application: KycApplication;
  localDraft: KycApplication;
  loading: boolean;
  saving: boolean;
  submitting: boolean;
  polling: boolean;
  error: string | null;
  stepErrors: Record<string, string>; // Inline field errors for current step
  isLoaded: boolean;
}

export type KycFlowAction =
  | { type: 'INIT_START' }
  | {
      type: 'INIT_SUCCESS';
      payload: { application: KycApplication; localDraft: KycApplication };
    }
  | { type: 'INIT_FAILURE'; payload: string }
  | {
      type: 'UPDATE_FIELD';
      payload: {
        step: KycStep;
        fields: Record<string, any>;
      };
    }
  | { type: 'SET_STEP'; payload: KycStep }
  | { type: 'SAVE_DRAFT_START' }
  | { type: 'SAVE_DRAFT_SUCCESS'; payload: KycApplication }
  | { type: 'SAVE_DRAFT_FAILURE'; payload: string }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS'; payload: KycApplication }
  | { type: 'SUBMIT_FAILURE'; payload: string }
  | { type: 'POLL_START' }
  | { type: 'POLL_SUCCESS'; payload: KycApplication }
  | { type: 'POLL_FAILURE'; payload: string }
  | { type: 'SET_ERRORS'; payload: Record<string, string> }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_STATE' };
