export const RESULT_RETENTION_MS = 24 * 60 * 60 * 1000; // 24 hours

export const getRetentionExpiry = () => new Date(Date.now() + RESULT_RETENTION_MS);

export const isExpiredTime = (value: string | number | null | undefined) => {
  if (!value) return false;
  const time = typeof value === 'number' ? value : new Date(value).getTime();
  return Number.isFinite(time) && time <= Date.now();
};

export const cleanupExpiredLocalApplicantData = () => {
  const lastResult = localStorage.getItem('cp_last_result');
  if (lastResult) {
    try {
      const parsed = JSON.parse(lastResult);
      if (isExpiredTime(parsed.expiresAt || parsed.expiresAtIso)) {
        localStorage.removeItem('cp_last_result');
      }
    } catch {
      localStorage.removeItem('cp_last_result');
    }
  }

  Object.keys(localStorage)
    .filter((key) => key.startsWith('cp_attempts_expires_'))
    .forEach((expiryKey) => {
      const identity = expiryKey.replace('cp_attempts_expires_', '');
      if (isExpiredTime(localStorage.getItem(expiryKey))) {
        localStorage.removeItem(expiryKey);
        localStorage.removeItem(`cp_attempts_${identity}`);
        localStorage.removeItem(`cp_lockout_${identity}`);
      }
    });
};

export const ensureApplicantAttemptWindow = (identity: string) => {
  const normalizedIdentity = identity.toUpperCase();
  const expiryKey = `cp_attempts_expires_${normalizedIdentity}`;
  const expiresAt = localStorage.getItem(expiryKey);

  if (!expiresAt || isExpiredTime(expiresAt)) {
    localStorage.setItem(`cp_attempts_${normalizedIdentity}`, '0');
    localStorage.removeItem(`cp_lockout_${normalizedIdentity}`);
    localStorage.setItem(expiryKey, getRetentionExpiry().toISOString());
  }
};
