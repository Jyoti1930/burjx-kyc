import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useKycSharedFlow } from '../src/store/KycFlowContext';

export default function Index() {
  const { state } = useKycSharedFlow();
  const router = useRouter();

  useEffect(() => {
    if (!state.isLoaded) return;

    // Resolve step route
    const status = state.application.status;
    const currentStep = state.localDraft.currentStep;

    if (['submitted', 'approved', 'rejected'].includes(status)) {
      router.replace('/(kyc)/status');
    } else {
      switch (currentStep) {
        case 'personal_info':
          router.replace('/(kyc)/personal-info');
          break;
        case 'address':
          router.replace('/(kyc)/address');
          break;
        case 'document':
          router.replace('/(kyc)/document');
          break;
        case 'review':
          router.replace('/(kyc)/review');
          break;
        case 'status':
          router.replace('/(kyc)/status');
          break;
        default:
          router.replace('/(kyc)/personal-info');
      }
    }
  }, [state.isLoaded, state.localDraft.currentStep, state.application.status]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6236FF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0E11',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
