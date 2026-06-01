import React from 'react';
import { useRouter } from 'expo-router';
import { useKycSharedFlow } from '../../src/store/KycFlowContext';
import { StepDocument } from '../../src/components/StepDocument';

export default function DocumentScreen() {
  const { state, updateField, setStep } = useKycSharedFlow();
  const router = useRouter();

  const handleNext = async () => {
    const success = await setStep('review');
    if (success) {
      router.push('/(kyc)/review');
    }
  };

  const handleBack = async () => {
    await setStep('address');
    router.replace('/(kyc)/address');
  };

  return (
    <StepDocument
      state={state}
      updateField={updateField}
      onNext={handleNext}
      onBack={handleBack}
    />
  );
}
