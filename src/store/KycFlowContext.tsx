import React, { createContext, useContext, ReactNode } from 'react';
import { useKycFlow } from '../hooks/useKycFlow';

type KycFlowContextType = ReturnType<typeof useKycFlow>;

const KycFlowContext = createContext<KycFlowContextType | undefined>(undefined);

export function KycFlowProvider({ children }: { children: ReactNode }) {
  const kycFlow = useKycFlow();
  return (
    <KycFlowContext.Provider value={kycFlow}>
      {children}
    </KycFlowContext.Provider>
  );
}

export function useKycSharedFlow() {
  const context = useContext(KycFlowContext);
  if (!context) {
    throw new Error('useKycSharedFlow must be used within a KycFlowProvider');
  }
  return context;
}
