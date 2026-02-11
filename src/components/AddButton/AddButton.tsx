import { memo } from 'react';
import styles from './AddButton.module.css';

interface AddButtonProps {
  onClick: () => void;
}

export const AddButton = memo(function AddButton({ onClick }: AddButtonProps) {
  return (
    <button className={styles.button} onClick={onClick} type="button">
      + Add
    </button>
  );
});
