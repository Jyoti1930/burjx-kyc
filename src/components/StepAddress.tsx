import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { KycFlowState } from '../store/kycTypes';

interface StepAddressProps {
  state: KycFlowState;
  updateField: (step: 'address', fields: Record<string, any>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepAddress({ state, updateField, onNext, onBack }: StepAddressProps) {
  const { localDraft, stepErrors } = state;
  const data = localDraft.address || { country: '', city: '', line1: '' };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Residential Address</Text>
        <Text style={styles.subtitle}>Please provide your current permanent residential address details.</Text>
      </View>

      <View style={styles.form}>
        {/* Country */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Country</Text>
          <TextInput
            style={[styles.input, stepErrors.country ? styles.inputError : null]}
            placeholder="e.g. United Kingdom"
            placeholderTextColor="#606C80"
            value={data.country}
            onChangeText={(text) => updateField('address', { country: text })}
            autoCorrect={false}
          />
          {stepErrors.country ? <Text style={styles.errorText}>{stepErrors.country}</Text> : null}
        </View>

        {/* City */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={[styles.input, stepErrors.city ? styles.inputError : null]}
            placeholder="e.g. London"
            placeholderTextColor="#606C80"
            value={data.city}
            onChangeText={(text) => updateField('address', { city: text })}
            autoCorrect={false}
          />
          {stepErrors.city ? <Text style={styles.errorText}>{stepErrors.city}</Text> : null}
        </View>

        {/* Address Line 1 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address Line 1</Text>
          <TextInput
            style={[styles.input, stepErrors.line1 ? styles.inputError : null]}
            placeholder="e.g. 221B Baker St"
            placeholderTextColor="#606C80"
            value={data.line1}
            onChangeText={(text) => updateField('address', { line1: text })}
            autoCorrect={false}
          />
          {stepErrors.line1 ? <Text style={styles.errorText}>{stepErrors.line1}</Text> : null}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.8}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={onNext} activeOpacity={0.8}>
          <Text style={styles.nextButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#0B0E11',
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9099A6',
    lineHeight: 20,
  },
  form: {
    flex: 1,
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EAECEF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#151A22',
    borderWidth: 1,
    borderColor: '#2C3545',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#FF4D4F',
  },
  errorText: {
    color: '#FF4D4F',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    marginTop: 'auto',
    justifyContent: 'space-between',
  },
  backButton: {
    flex: 1,
    borderColor: '#2C3545',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backButtonText: {
    color: '#EAECEF',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#6236FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
