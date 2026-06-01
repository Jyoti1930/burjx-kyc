import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { KycFlowState } from '../store/kycTypes';
import { KycStep } from '../services/fakeKycService';

interface StepReviewProps {
  state: KycFlowState;
  onEditStep: (step: KycStep) => void;
  onSubmit: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
}

export function StepReview({ state, onEditStep, onSubmit, onBack, onSaveDraft }: StepReviewProps) {
  const { localDraft, submitting, saving, error } = state;

  const personalInfo = localDraft.personalInfo || { legalName: '', dateOfBirth: '', nationality: '' };
  const address = localDraft.address || { country: '', city: '', line1: '' };
  const document = localDraft.document || { type: 'passport', documentNumber: '' };

  const formatDocType = (type: string) => {
    switch (type) {
      case 'passport':
        return 'Passport';
      case 'national_id':
        return 'National ID';
      case 'drivers_license':
        return "Driver's License";
      default:
        return type;
    }
  };

  const isWorking = submitting || saving;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Review Application</Text>
        <Text style={styles.subtitle}>Review your data before submitting. Locked once submitted.</Text>
      </View>

      {error ? (
        <View style={styles.errorAlert}>
          <Text style={styles.errorAlertText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.reviewList}>
        {/* Personal Info Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Info</Text>
            <TouchableOpacity style={styles.editButton} onPress={() => onEditStep('personal_info')} disabled={isWorking}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sectionBody}>
            <View style={styles.reviewRow}>
              <Text style={styles.rowLabel}>Legal Name</Text>
              {/* Sensitive fields are shown inside UI, but we never print to console.log */}
              <Text style={styles.rowValue}>{personalInfo.legalName}</Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={styles.rowLabel}>Date of Birth</Text>
              <Text style={styles.rowValue}>{personalInfo.dateOfBirth}</Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={styles.rowLabel}>Nationality</Text>
              <Text style={styles.rowValue}>{personalInfo.nationality}</Text>
            </View>
          </View>
        </View>

        {/* Address Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Residential Address</Text>
            <TouchableOpacity style={styles.editButton} onPress={() => onEditStep('address')} disabled={isWorking}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sectionBody}>
            <View style={styles.reviewRow}>
              <Text style={styles.rowLabel}>Country</Text>
              <Text style={styles.rowValue}>{address.country}</Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={styles.rowLabel}>City</Text>
              <Text style={styles.rowValue}>{address.city}</Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={styles.rowLabel}>Address Line 1</Text>
              <Text style={styles.rowValue}>{address.line1}</Text>
            </View>
          </View>
        </View>

        {/* Document Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Verification Document</Text>
            <TouchableOpacity style={styles.editButton} onPress={() => onEditStep('document')} disabled={isWorking}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sectionBody}>
            <View style={styles.reviewRow}>
              <Text style={styles.rowLabel}>Document Type</Text>
              <Text style={styles.rowValue}>{formatDocType(document.type)}</Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={styles.rowLabel}>Document Number</Text>
              <Text style={styles.rowValue}>{document.documentNumber}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} disabled={isWorking} activeOpacity={0.8}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveDraftButton}
            onPress={onSaveDraft}
            disabled={isWorking}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#6236FF" size="small" />
            ) : (
              <Text style={styles.saveDraftButtonText}>Save Draft</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isWorking ? styles.submitButtonDisabled : null]}
          onPress={onSubmit}
          disabled={isWorking}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Application</Text>
          )}
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
    marginBottom: 24,
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
  errorAlert: {
    backgroundColor: '#381618',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#722F37',
    padding: 16,
    marginBottom: 24,
  },
  errorAlertText: {
    color: '#FF4D4F',
    fontSize: 14,
    fontWeight: '500',
  },
  reviewList: {
    flex: 1,
    marginBottom: 32,
  },
  sectionCard: {
    backgroundColor: '#151A22',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2C3545',
    padding: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2C3545',
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editButtonText: {
    color: '#6236FF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionBody: {},
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  rowLabel: {
    fontSize: 14,
    color: '#9099A6',
  },
  rowValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  footer: {
    marginTop: 'auto',
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  backButton: {
    flex: 1,
    borderColor: '#2C3545',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backButtonText: {
    color: '#EAECEF',
    fontSize: 15,
    fontWeight: '600',
  },
  saveDraftButton: {
    flex: 1.5,
    borderColor: '#6236FF',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveDraftButtonText: {
    color: '#6236FF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#6236FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#2E2260',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
