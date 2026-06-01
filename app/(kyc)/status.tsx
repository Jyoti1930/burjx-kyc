import React from 'react';
import { useRouter } from 'expo-router';
import { useKycSharedFlow } from '../../src/store/KycFlowContext';
import { StepStatus } from '../../src/components/StepStatus';

export default function StatusScreen() {
  const { state, retrySubmission, resetState, setStep } = useKycSharedFlow();
  const router = useRouter();

  const handleRetry = async () => {
    await retrySubmission();
  };

  const handleCorrectFields = async () => {
    const requiredFields = state.application.requiredFields || [];
    if (requiredFields.length > 0) {
      const firstField = requiredFields[0];
      let targetStep: 'personal_info' | 'address' | 'document' = 'personal_info';
      if (firstField.startsWith('address')) {
        targetStep = 'address';
      } else if (firstField.startsWith('document')) {
        targetStep = 'document';
      }

      await setStep(targetStep);

      if (targetStep === 'personal_info') {
        router.replace('/(kyc)/personal-info');
      } else if (targetStep === 'address') {
        router.replace('/(kyc)/address');
      } else if (targetStep === 'document') {
        router.replace('/(kyc)/document');
      }
    } else {
      await setStep('personal_info');
      router.replace('/(kyc)/personal-info');
    }
  };

  const handleReset = async () => {
    await resetState();
    router.replace('/(kyc)/personal-info');
  };

  return (
    <StepStatus
      state={state}
      onRetry={handleRetry}
      onCorrectFields={handleCorrectFields}
      onReset={handleReset}
    />
  );
}
