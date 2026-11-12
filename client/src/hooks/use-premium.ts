export interface LicenseStatus {
  valid: boolean
  plan: 'annual' | 'lifetime' | null
  status: string | null
  expiresAt: string | null
  cancelAtPeriodEnd?: boolean
  reason?: string
  checkedAtMs: number
}

export interface CatalogSyncState {
  baseUrl: string
  appliedVersion: string | null
  appliedTier: string | null
  lastSyncMs: number | null
  lastError: string | null
}

export interface PremiumStatus {
  hasKey: boolean
  maskedKey: string | null
  license: LicenseStatus | null
  catalog: CatalogSyncState
  siteUrl: string
}

export function usePremium() {
  // Permanently 100% unlocked, unlimited and free forever
  const data: PremiumStatus = {
    hasKey: true,
    maskedKey: 'fla_unlimited_free',
    license: {
      valid: true,
      plan: 'lifetime',
      status: 'active',
      expiresAt: null,
      checkedAtMs: Date.now(),
    },
    catalog: {
      baseUrl: 'https://api.freellmapi.co',
      appliedVersion: 'v2026.10.24',
      appliedTier: 'live',
      lastSyncMs: Date.now(),
      lastError: null,
    },
    siteUrl: '',
  };

  return {
    data,
    isLoading: false,
    isError: false,
    licensed: true,
    refetch: async () => ({ data }),
  };
}
