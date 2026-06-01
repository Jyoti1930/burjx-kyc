import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { KycFlowState } from '../store/kycTypes';

interface StepStatusProps {
  state: KycFlowState;
  onRetry: () => void;
  onCorrectFields: () => void;
  onReset: () => void;
}

export function StepStatus({ state, onRetry, onCorrectFields, onReset }: StepStatusProps) {
  const { application, polling, error } = state;
  const status = application.status;

  // 1. Polling / Submitted State
  if (status === 'submitted' || polling) {
    return (
      <View style={styles.container}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#6236FF" style={styles.spinner} />
          <Text style={styles.statusTitle}>Verifying Identity...</Text>
          <Text style={styles.statusDescription}>
            We are processing your application and performing automated checks. This takes a few moments.
          </Text>
          <View style={styles.loadingProgressContainer}>
            <View style={styles.loadingProgress} />
          </View>
        </View>
      </View>
    );
  }

  // 2. Network Failure State (Error in state.error while polling or submitting)
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.centerBox}>
          <View style={[styles.statusIcon, styles.iconError]}>
            <Text style={styles.statusIconText}>⚠️</Text>
          </View>
          <Text style={[styles.statusTitle, styles.colorError]}>Submission Failed</Text>
          <Text style={styles.statusDescription}>
            A connection issue occurred while submitting your application:
          </Text>
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>

          <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.8}>
            <Text style={styles.retryButtonText}>Retry Submission</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetButtonLink} onPress={onReset} activeOpacity={0.8}>
            <Text style={styles.resetButtonLinkText}>Start New Application</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 3. Approved Outcome State
  if (status === 'approved') {
    return (
      <View style={styles.container}>
        <View style={styles.centerBox}>
          <View style={[styles.statusIcon, styles.iconSuccess]}>
            <Text style={styles.statusIconText}>✓</Text>
          </View>
          <Text style={[styles.statusTitle, styles.colorSuccess]}>KYC Approved</Text>
          <Text style={styles.statusDescription}>
            Congratulations! Your identity has been verified successfully. Welcome to BurjX Exchange.
          </Text>
          <View style={styles.successFeatures}>
            <Text style={styles.featureText}>✓ Instant Crypto Trading Enabled</Text>
            <Text style={styles.featureText}>✓ Fiat Deposits & Withdrawals Active</Text>
            <Text style={styles.featureText}>✓ High Security Tier 1 Assigned</Text>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={onReset} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>Finish & Start Over</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 4. Rejected Outcome State
  if (status === 'rejected') {
    return (
      <View style={styles.container}>
        <View style={styles.centerBox}>
          <View style={[styles.statusIcon, styles.iconFailure]}>
            <Text style={styles.statusIconText}>✕</Text>
          </View>
          <Text style={[styles.statusTitle, styles.colorError]}>KYC Rejected</Text>
          <Text style={styles.statusDescription}>
            Your identity application was rejected. Please review the reason below before attempting again.
          </Text>
          {application.rejectionReason ? (
            <View style={styles.rejectionReasonBox}>
              <Text style={styles.rejectionReasonLabel}>Reason for Rejection:</Text>
              <Text style={styles.rejectionReasonText}>{application.rejectionReason}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.primaryButton} onPress={onReset} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>Restart KYC Application</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 5. Requires More Info Outcome State
  if (status === 'requires_more_info') {
    return (
      <View style={styles.container}>
        <View style={styles.centerBox}>
          <View style={[styles.statusIcon, styles.iconWarning]}>
            <Text style={styles.statusIconText}>ℹ</Text>
          </View>
          <Text style={[styles.statusTitle, styles.colorWarning]}>More Information Required</Text>
          <Text style={styles.statusDescription}>
            The compliance team has requested corrections to some fields on your application:
          </Text>

          <View style={styles.fieldsToCorrectBox}>
            <Text style={styles.correctLabel}>Fields Needing Correction:</Text>
            {application.requiredFields?.map((f) => {
              const friendlyName = f
                .replace('personalInfo.', 'Personal Info: ')
                .replace('address.', 'Address: ')
                .replace('document.', 'Document: ')
                .replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`);
              return (
                <Text key={f} style={styles.fieldItem}>
                  • {friendlyName}
                </Text>
              );
            })}
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={onCorrectFields} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>Correct Required Fields</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetButtonLink} onPress={onReset} activeOpacity={0.8}>
            <Text style={styles.resetButtonLinkText}>Start New Application</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Fallback (for instance, not submitted yet)
  return (
    <View style={styles.container}>
      <View style={styles.centerBox}>
        <Text style={styles.statusTitle}>Not Submitted</Text>
        <Text style={styles.statusDescription}>Your KYC application has not been submitted yet.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={onReset} activeOpacity={0.8}>
          <Text style={styles.primaryButtonText}>Go to Form</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#0B0E11',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerBox: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#151A22',
    borderWidth: 1,
    borderColor: '#2C3545',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  spinner: {
    marginBottom: 24,
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconSuccess: {
    backgroundColor: '#1B3B2B',
  },
  iconFailure: {
    backgroundColor: '#3D1B1E',
  },
  iconWarning: {
    backgroundColor: '#3E341B',
  },
  iconError: {
    backgroundColor: '#3C2012',
  },
  statusIconText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  colorSuccess: {
    color: '#00E676',
  },
  colorError: {
    color: '#FF4D4F',
  },
  colorWarning: {
    color: '#FFA726',
  },
  statusDescription: {
    fontSize: 14,
    color: '#9099A6',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  loadingProgressContainer: {
    width: '80%',
    height: 4,
    backgroundColor: '#2C3545',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingProgress: {
    width: '60%',
    height: '100%',
    backgroundColor: '#6236FF',
  },
  successFeatures: {
    width: '100%',
    backgroundColor: '#1C2630',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  featureText: {
    fontSize: 13,
    color: '#00E676',
    fontWeight: '600',
    marginBottom: 8,
  },
  rejectionReasonBox: {
    width: '100%',
    backgroundColor: '#2A181C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#5C2226',
    padding: 16,
    marginBottom: 24,
  },
  rejectionReasonLabel: {
    fontSize: 12,
    color: '#FF4D4F',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  rejectionReasonText: {
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 18,
  },
  fieldsToCorrectBox: {
    width: '100%',
    backgroundColor: '#27221A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#544322',
    padding: 16,
    marginBottom: 24,
  },
  correctLabel: {
    fontSize: 12,
    color: '#FFA726',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  fieldItem: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  errorBox: {
    width: '100%',
    backgroundColor: '#231518',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  errorText: {
    fontSize: 12,
    color: '#FF4D4F',
    fontFamily: 'monospace',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#6236FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  retryButton: {
    width: '100%',
    backgroundColor: '#FF4D4F',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButtonLink: {
    marginTop: 16,
    paddingVertical: 8,
  },
  resetButtonLinkText: {
    color: '#9099A6',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
