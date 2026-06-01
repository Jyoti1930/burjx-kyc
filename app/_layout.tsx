import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { KycFlowProvider } from '../src/store/KycFlowContext';

export default function RootLayout() {
  return (
    <KycFlowProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#151A22',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: '#0B0E11',
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(kyc)/personal-info" options={{ title: 'PersonalInfo' }} />
        <Stack.Screen name="(kyc)/address" options={{ title: 'Address' }} />
        <Stack.Screen name="(kyc)/document" options={{ title: 'Verification' }} />
        <Stack.Screen name="(kyc)/review" options={{ title: 'Review' }} />
        <Stack.Screen name="(kyc)/status" options={{ title: 'KYC Status', headerLeft: () => null, gestureEnabled: false }} />
      </Stack>
    </KycFlowProvider>
  );
}
