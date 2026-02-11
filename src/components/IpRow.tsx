import { useState, useCallback } from 'react';
import { useIpLookup } from '../hooks/useIpLookup';
import { useLocalTime } from '../hooks/useLocalTime';
import { isValidIpv4 } from '../utils/validateIp';
import { countryCodeToFlag } from '../utils/countryFlag';
import styles from './IpRow.module.css';

interface IpRowProps {
  rowNumber: number;
  autoFocus?: boolean;
}

export function IpRow({ rowNumber, autoFocus }: IpRowProps) {
  const [ip, setIp] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Only enable the query when the user has submitted a valid IP
  const isValid = isValidIpv4(ip);
  const { data, isLoading, error } = useIpLookup(ip, submitted && isValid);

  // Derive local time from the global clock store
  const localTime = useLocalTime(data?.timezone ?? null);

  const handleBlur = useCallback(() => {
    const trimmed = ip.trim();
    if (!trimmed) {
      setValidationError(null);
      setSubmitted(false);
      return;
    }
    if (!isValidIpv4(trimmed)) {
      setValidationError('Invalid IPv4 address');
      setSubmitted(false);
      return;
    }
    setValidationError(null);
    setSubmitted(true);
  }, [ip]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setIp(e.target.value);
    setSubmitted(false);
    setValidationError(null);
  }, []);

  return (
    <div className={styles.row}>
      <span className={styles.badge}>{rowNumber}</span>

      <input
        className={styles.input}
        type="text"
        placeholder="Enter IP address (e.g. 8.8.8.8)"
        value={ip}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={isLoading}
        ref={autoFocus ? (el) => el?.focus() : undefined}
      />

      {isLoading && <div className={styles.spinner} />}

      {validationError && (
        <span className={styles.error}>{validationError}</span>
      )}

      {error && !validationError && (
        <span className={styles.error}>
          {error instanceof Error ? error.message : 'Lookup failed'}
        </span>
      )}

      {data && !isLoading && !validationError && (
        <div className={styles.result}>
          <span className={styles.flag}>
            {countryCodeToFlag(data.countryCode)}
          </span>
          <span className={styles.country}>{data.country}</span>
          <span className={styles.time}>{localTime}</span>
        </div>
      )}
    </div>
  );
}
