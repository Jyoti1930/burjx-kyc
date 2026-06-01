import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { KycFlowState } from '../store/kycTypes';

interface StepDocumentProps {
  state: KycFlowState;
  updateField: (step: 'document', fields: Record<string, any>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepDocument({ state, updateField, onNext, onBack }: StepDocumentProps) {
  const { localDraft, stepErrors } = state;
  const data = localDraft.document || { type: 'passport', documentNumber: '' };

  const docTypes = [
    { label: 'Passport', value: 'passport' as const },
    { label: 'National ID', value: 'national_id' as const },
    { label: 'Drivers License', value: 'drivers_license' as const },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Document Verification</Text>
        <Text style={styles.subtitle}>Select an identification document and enter its number.</Text>
      </View>

      <View style={styles.form}>
        {/* Document Type Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Document Type</Text>
          <View style={styles.selectorContainer}>
            {docTypes.map((dt) => {
              const isSelected = data.type === dt.value;
              return (
                <TouchableOpacity
                  key={dt.value}
                  style={[styles.selectorButton, isSelected ? styles.selectorButtonSelected : null]}
                  onPress={() => updateField('document', { type: dt.value })}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.selectorText, isSelected ? styles.selectorTextSelected : null]}>
                    {dt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {stepErrors.type ? <Text style={styles.errorText}>{stepErrors.type}</Text> : null}
        </View>

        {/* Document Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Document Number</Text>
          <TextInput
            style={[styles.input, stepErrors.documentNumber ? styles.inputError : null]}
            placeholder="e.g. AB123456"
            placeholderTextColor="#606C80"
            value={data.documentNumber}
            onChangeText={(text) => updateField('document', { documentNumber: text })}
            autoCorrect={false}
          />
          {stepErrors.documentNumber ? <Text style={styles.errorText}>{stepErrors.documentNumber}</Text> : null}
        </View>

        {/* Deterministic Testing Guide */}
        <View style={styles.testGuide}>
          <Text style={styles.testGuideTitle}>Testing Guide (Assessment Only)</Text>
          <Text style={styles.testGuideText}>
            You can enter special document numbers to trigger deterministic KYC outcomes:
          </Text>
          <View style={styles.testItem}>
            <Text style={styles.testCode}>REJECT001</Text>
            <Text style={styles.testDesc}>Triggers deterministic "Rejected" status</Text>
          </View>
          <View style={styles.testItem}>
            <Text style={styles.testCode}>MOREINFO001</Text>
            <Text style={styles.testDesc}>Triggers "Requires More Info" (redirection flow)</Text>
          </View>
          <View style={styles.testItem}>
            <Text style={styles.testCode}>FAIL001</Text>
            <Text style={styles.testDesc}>Simulates server network failure (testing retry)</Text>
          </View>
          <View style={styles.testItem}>
            <Text style={styles.testCode}>Any other valid</Text>
            <Text style={styles.testDesc}>Triggers successful "Approved" after polling</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.8}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={onNext} activeOpacity={0.8}>
          <Text style={styles.nextButtonText}>Review Application</Text>
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
  selectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#151A22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2C3545',
    padding: 4,
  },
  selectorButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  selectorButtonSelected: {
    backgroundColor: '#6236FF',
  },
  selectorText: {
    color: '#9099A6',
    fontWeight: '600',
    fontSize: 13,
  },
  selectorTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
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
  testGuide: {
    backgroundColor: '#1C160C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3D3018',
    padding: 16,
    marginTop: 16,
  },
  testGuideTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFA726',
    marginBottom: 8,
  },
  testGuideText: {
    fontSize: 12,
    color: '#D4AF7A',
    marginBottom: 12,
    lineHeight: 16,
  },
  testItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  testCode: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: '#2E2F30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  testDesc: {
    fontSize: 11,
    color: '#9099A6',
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
