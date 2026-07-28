'use client';

import { Select, SelectItem } from '@heroui/select';
import type { Selection } from '@react-types/shared';

import { inputProperties } from '@/config/constants/inputStyles';

interface EntitySelectItem {
  readonly key: string;
  readonly label: string;
}

interface EntitySelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  readonly items: ReadonlyArray<EntitySelectItem>;
  readonly selectedKey: string | null;
  readonly label: string;
  readonly placeholder: string;
  readonly name?: string;
  readonly onSelect: (key: string | null) => void;
}

export const EntitySelect = ({
  items,
  selectedKey,
  label,
  placeholder,
  name,
  onSelect,
  ...props
}: EntitySelectProps) => {
  const onSelectionChange = (keys: Selection) => {
    if (keys === 'all') return;
    const key = Array.from(keys as Set<React.Key>)[0];
    onSelect(key ? String(key) : null);
  };

  return (
    <div {...props}>
      <Select
        autoComplete="off"
        className="w-full"
        label={label}
        name={name}
        placeholder={placeholder}
        selectedKeys={selectedKey ? [selectedKey] : []}
        onSelectionChange={onSelectionChange}
        {...inputProperties.select}
      >
        {items.map((item) => (
          <SelectItem key={item.key} textValue={item.label}>
            {item.label}
          </SelectItem>
        ))}
      </Select>
    </div>
  );
};
