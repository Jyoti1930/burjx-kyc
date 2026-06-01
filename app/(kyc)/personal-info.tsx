import React from 'react';
import { useRouter } from 'expo-router';
import { useKycSharedFlow } from '../../src/store/KycFlowContext';
import { StepPersonalInfo } from '../../src/components/StepPersonalInfo';

export default function PersonalInfoScreen() {
  const { state, updateField, setStep } = useKycSharedFlow();
  const router = useRouter();

  const handleNext = async () => {
    const success = await setStep('address');
    if (success) {
      router.push('/(kyc)/address');
    }
  };

  return (
    <StepPersonalInfo
      state={state}
      updateField={updateField}
      onNext={handleNext}
    />
  );
}
