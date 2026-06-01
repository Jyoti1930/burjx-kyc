import React from 'react';
import { useRouter } from 'expo-router';
import { useKycSharedFlow } from '../../src/store/KycFlowContext';
import { StepAddress } from '../../src/components/StepAddress';

export default function AddressScreen() {
  const { state, updateField, setStep } = useKycSharedFlow();
  const router = useRouter();

  const handleNext = async () => {
    const success = await setStep('document');
    if (success) {
      router.push('/(kyc)/document');
    }
  };

  const handleBack = async () => {
    await setStep('personal_info');
    router.replace('/(kyc)/personal-info');
  };

  return (
    <StepAddress
      state={state}
      updateField={updateField}
      onNext={handleNext}
      onBack={handleBack}
    />
  );
}
