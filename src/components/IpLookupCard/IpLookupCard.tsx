import { useState, useRef, useCallback, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { IpRowState } from '../../types';
import { IpRow } from '../IpRow/IpRow';
import { AddButton } from '../AddButton/AddButton';
import styles from './IpLookupCard.module.css';

const ROW_HEIGHT = 52;

function createRow(): IpRowState {
  return { id: crypto.randomUUID(), ip: '' };
}

export function IpLookupCard() {
  const [rows, setRows] = useState<IpRowState[]>(() => [createRow()]);
  const [focusRowId, setFocusRowId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });

  const addRow = useCallback(() => {
    const newRow = createRow();
    setRows((prev) => [...prev, newRow]);
    setFocusRowId(newRow.id);
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Auto-scroll to the new row after it's appended
  useEffect(() => {
    if (focusRowId) {
      virtualizer.scrollToIndex(rows.length - 1, { align: 'end' });
    }
  }, [focusRowId, rows.length, virtualizer]);

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>IP Lookup</h1>
          <span className={styles.versionBadge}>React version</span>
        </div>
        <div className={styles.headerIcons}>
          <svg
            className={styles.reactLogo}
            viewBox="-11.5 -10.23174 23 20.46348"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="0" cy="0" r="2.05" fill="#61dafb" />
            <g stroke="#61dafb" strokeWidth="1" fill="none">
              <ellipse rx="11" ry="4.2" />
              <ellipse rx="11" ry="4.2" transform="rotate(60)" />
              <ellipse rx="11" ry="4.2" transform="rotate(120)" />
            </g>
          </svg>
          <button className={styles.closeBtn} type="button" aria-label="Close">
            ✕
          </button>
        </div>
      </div>

      {/* Subtitle */}
      <p className={styles.subtitle}>
        Enter one or more IP addresses and get their country
      </p>

      {/* Add button */}
      <div className={styles.actions}>
        <AddButton onClick={addRow} />
      </div>

      {/* Divider */}
      <div className={styles.divider} />

      {/* Virtualized row list */}
      <div className={styles.listContainer} ref={scrollRef}>
        <div
          className={styles.listInner}
          style={{ height: `${virtualizer.getTotalSize()}px` }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            const shouldFocus = row.id === focusRowId;
            return (
              <div
                className={styles.virtualRow}
                key={row.id}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <IpRow
                  rowNumber={virtualRow.index + 1}
                  autoFocus={shouldFocus}
                  onAutoFocused={() => setFocusRowId(null)}
                  onRemove={rows.length > 1 ? () => removeRow(row.id) : undefined}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
