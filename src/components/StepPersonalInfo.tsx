import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { KycFlowState } from '../store/kycTypes';

interface StepPersonalInfoProps {
  state: KycFlowState;
  updateField: (step: 'personal_info', fields: Record<string, any>) => void;
  onNext: () => void;
}

export function StepPersonalInfo({ state, updateField, onNext }: StepPersonalInfoProps) {
  const { localDraft, stepErrors } = state;
  const data = localDraft.personalInfo || { legalName: '', dateOfBirth: '', nationality: '' };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Personal Information</Text>
        <Text style={styles.subtitle}>Please enter your legal details exactly as shown on your passport.</Text>
      </View>

      <View style={styles.form}>
        {/* Legal Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Legal Name</Text>
          <TextInput
            style={[styles.input, stepErrors.legalName ? styles.inputError : null]}
            placeholder="John Doe"
            placeholderTextColor="#606C80"
            value={data.legalName}
            onChangeText={(text) => updateField('personal_info', { legalName: text })}
            autoCorrect={false}
          />
          {stepErrors.legalName ? <Text style={styles.errorText}>{stepErrors.legalName}</Text> : null}
        </View>

        {/* Date of Birth */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date of Birth</Text>
          <TextInput
            style={[styles.input, stepErrors.dateOfBirth ? styles.inputError : null]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#606C80"
            value={data.dateOfBirth}
            onChangeText={(text) => updateField('personal_info', { dateOfBirth: text })}
            keyboardType="default"
            autoCorrect={false}
          />
          <Text style={styles.helperText}>Format must be YYYY-MM-DD (e.g. 1995-12-05)</Text>
          {stepErrors.dateOfBirth ? <Text style={styles.errorText}>{stepErrors.dateOfBirth}</Text> : null}
        </View>

        {/* Nationality */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nationality</Text>
          <TextInput
            style={[styles.input, stepErrors.nationality ? styles.inputError : null]}
            placeholder="e.g. Canadian"
            placeholderTextColor="#606C80"
            value={data.nationality}
            onChangeText={(text) => updateField('personal_info', { nationality: text })}
            autoCorrect={false}
          />
          {stepErrors.nationality ? <Text style={styles.errorText}>{stepErrors.nationality}</Text> : null}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButton} onPress={onNext} activeOpacity={0.8}>
          <Text style={styles.nextButtonText}>Continue to Address</Text>
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
    fontFamily: 'System',
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
  helperText: {
    color: '#606C80',
    fontSize: 11,
    marginTop: 4,
  },
  footer: {
    marginTop: 'auto',
  },
  nextButton: {
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
