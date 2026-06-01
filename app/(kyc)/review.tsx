import React from 'react';
import { useRouter } from 'expo-router';
import { useKycSharedFlow } from '../../src/store/KycFlowContext';
import { StepReview } from '../../src/components/StepReview';
import { KycStep } from '../../src/services/fakeKycService';

export default function ReviewScreen() {
  const { state, setStep, submitApplication, saveDraft } = useKycSharedFlow();
  const router = useRouter();

  const handleEditStep = async (step: KycStep) => {
    await setStep(step);
    if (step === 'personal_info') {
      router.push('/(kyc)/personal-info');
    } else if (step === 'address') {
      router.push('/(kyc)/address');
    } else if (step === 'document') {
      router.push('/(kyc)/document');
    }
  };

  const handleSubmit = async () => {
    const success = await submitApplication();
    if (success) {
      router.push('/(kyc)/status');
    }
  };

  const handleBack = async () => {
    await setStep('document');
    router.replace('/(kyc)/document');
  };

  const handleSaveDraft = async () => {
    await saveDraft();
  };

  return (
    <StepReview
      state={state}
      onEditStep={handleEditStep}
      onSubmit={handleSubmit}
      onBack={handleBack}
      onSaveDraft={handleSaveDraft}
    />
  );
}
