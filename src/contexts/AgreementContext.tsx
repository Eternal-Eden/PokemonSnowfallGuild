'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AgreementState {
  privacyPolicyAccepted: boolean;
  securityAgreementAccepted: boolean;
  lastAcceptedDate: string | null;
  userAgent: string | null;
}

interface AgreementContextType {
  agreementState: AgreementState;
  acceptPrivacyPolicy: () => void;
  acceptSecurityAgreement: () => void;
  acceptAllAgreements: () => void;
  revokeAgreements: () => void;
  isAllAgreementsAccepted: () => boolean;
  getAgreementRecord: () => AgreementRecord | null;
}

interface AgreementRecord {
  privacyPolicyAccepted: boolean;
  securityAgreementAccepted: boolean;
  acceptedDate: string;
  userAgent: string;
  ipAddress?: string;
}

const AgreementContext = createContext<AgreementContextType | undefined>(undefined);

const AGREEMENT_STORAGE_KEY = 'snowfall_guild_agreements';

export function AgreementProvider({ children }: { children: ReactNode }) {
  const [agreementState, setAgreementState] = useState<AgreementState>({
    privacyPolicyAccepted: false,
    securityAgreementAccepted: false,
    lastAcceptedDate: null,
    userAgent: null
  });

  // 从本地存储加载协议状态
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AGREEMENT_STORAGE_KEY);
      if (stored) {
        const parsedState = JSON.parse(stored) as AgreementState;
        setAgreementState(parsedState);
      }
    } catch (error) {
      console.error('Failed to load agreement state:', error);
    }
  }, []);

  // 保存协议状态到本地存储
  const saveAgreementState = (newState: AgreementState) => {
    try {
      localStorage.setItem(AGREEMENT_STORAGE_KEY, JSON.stringify(newState));
      setAgreementState(newState);
    } catch (error) {
      console.error('Failed to save agreement state:', error);
    }
  };

  // 接受隐私政策
  const acceptPrivacyPolicy = () => {
    const newState: AgreementState = {
      ...agreementState,
      privacyPolicyAccepted: true,
      lastAcceptedDate: new Date().toISOString(),
      userAgent: navigator.userAgent
    };
    saveAgreementState(newState);
  };

  // 接受安全协议
  const acceptSecurityAgreement = () => {
    const newState: AgreementState = {
      ...agreementState,
      securityAgreementAccepted: true,
      lastAcceptedDate: new Date().toISOString(),
      userAgent: navigator.userAgent
    };
    saveAgreementState(newState);
  };

  // 接受所有协议
  const acceptAllAgreements = () => {
    const newState: AgreementState = {
      privacyPolicyAccepted: true,
      securityAgreementAccepted: true,
      lastAcceptedDate: new Date().toISOString(),
      userAgent: navigator.userAgent
    };
    saveAgreementState(newState);
  };

  // 撤销协议同意
  const revokeAgreements = () => {
    const newState: AgreementState = {
      privacyPolicyAccepted: false,
      securityAgreementAccepted: false,
      lastAcceptedDate: null,
      userAgent: null
    };
    saveAgreementState(newState);
  };

  // 检查是否所有协议都已同意
  const isAllAgreementsAccepted = (): boolean => {
    return agreementState.privacyPolicyAccepted && agreementState.securityAgreementAccepted;
  };

  // 获取协议记录（用于审计）
  const getAgreementRecord = (): AgreementRecord | null => {
    if (!isAllAgreementsAccepted() || !agreementState.lastAcceptedDate) {
      return null;
    }

    return {
      privacyPolicyAccepted: agreementState.privacyPolicyAccepted,
      securityAgreementAccepted: agreementState.securityAgreementAccepted,
      acceptedDate: agreementState.lastAcceptedDate,
      userAgent: agreementState.userAgent || 'Unknown'
    };
  };

  const value: AgreementContextType = {
    agreementState,
    acceptPrivacyPolicy,
    acceptSecurityAgreement,
    acceptAllAgreements,
    revokeAgreements,
    isAllAgreementsAccepted,
    getAgreementRecord
  };

  return (
    <AgreementContext.Provider value={value}>
      {children}
    </AgreementContext.Provider>
  );
}

export function useAgreement() {
  const context = useContext(AgreementContext);
  if (context === undefined) {
    throw new Error('useAgreement must be used within an AgreementProvider');
  }
  return context;
}

// 协议验证中间件
export function withAgreementValidation<T extends object>(
  Component: React.ComponentType<T>
): React.ComponentType<T> {
  return function AgreementValidatedComponent(props: T) {
    const { isAllAgreementsAccepted } = useAgreement();
    
    if (!isAllAgreementsAccepted()) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
          <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              需要同意协议
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              请先阅读并同意相关协议条款才能继续使用。
            </p>
            <button
              onClick={() => window.location.href = '/auth/login'}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              返回登录
            </button>
          </div>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
}

export type { AgreementState, AgreementRecord };