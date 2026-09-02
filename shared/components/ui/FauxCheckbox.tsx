import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

import { fauxCheckboxClasses } from './tone';

interface FauxCheckboxProps {
  readonly checked: boolean;
  readonly className?: string;
}

export function FauxCheckbox({ checked, className }: FauxCheckboxProps) {
  const classes = [
    'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border transition-colors duration-200',
    fauxCheckboxClasses(checked),
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes}>
      {checked && <FontAwesomeIcon aria-hidden="true" className="h-3 w-3" icon={faCheck} />}
    </span>
  );
}
