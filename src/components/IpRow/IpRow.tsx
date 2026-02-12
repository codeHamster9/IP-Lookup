import { useState, useCallback, memo } from 'react';
import { Trash2, Loader2, Clock } from 'lucide-react';
import { useIpLookup } from '../../hooks/useIpLookup';
import { isValidIpv4 } from '../../utils/validateIp';
import { countryCodeToFlag } from '../../utils/countryFlag';
import { LocalClock } from '../LocalClock/LocalClock';
import styles from './IpRow.module.css';

export interface IpRowProps {
  id: string;
  rowNumber: number;
  autoFocus?: boolean;
  onAutoFocused?: () => void;
  onRemove?: (id: string) => void;
}

export const IpRow = memo(function IpRow({
  id,
  rowNumber,
  autoFocus,
  onAutoFocused,
  onRemove,
}: IpRowProps) {
  const [ip, setIp] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Only enable the query when the user has submitted a valid IP
  const isValid = isValidIpv4(ip);
  const { data, isLoading, error } = useIpLookup(ip, submitted && isValid);



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
        ref={(el) => {
          if (autoFocus && el) {
            el.focus();
            onAutoFocused?.();
          }
        }}
      />

      {onRemove && (
        <button
          className={styles.removeBtn}
          type="button"
          onClick={() => onRemove?.(id)}
          aria-label="Remove row"
        >
          <Trash2 size={18} />
        </button>
      )}

      {isLoading && <Loader2 className={styles.spinner} size={20} />}

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
          <div className={styles.timeContainer}>
            <Clock size={14} className={styles.clockIcon} />
            <LocalClock timezone={data.timezone} className={styles.time} />
          </div>
        </div>
      )}
    </div>
  );
});
