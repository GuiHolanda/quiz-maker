import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { iconBadgeToneClasses, iconBadgeSizeClasses, type IconBadgeTone, type Size } from './tone';

interface IconBadgeProps {
  readonly icon: IconDefinition;
  readonly size?: Size;
  readonly tone?: IconBadgeTone;
  readonly className?: string;
}

export function IconBadge({ icon, size = 'sm', tone = 'primary', className }: IconBadgeProps) {
  const { box, icon: iconSize } = iconBadgeSizeClasses(size);
  const classes = ['inline-flex shrink-0 items-center justify-center', box, iconBadgeToneClasses(tone), className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes}>
      <FontAwesomeIcon aria-hidden="true" className={iconSize} icon={icon} />
    </span>
  );
}
