import { Input } from "@heroui/input";

interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    variant?: "underlined" | "flat" | "faded" | "bordered" | undefined;
}

export function NumberInput(props: Readonly<NumberInputProps>) {
  return (
    <div className="flex flex-col gap-1 no-number-spinners">
      <label htmlFor={props.id } className="text-xs text-stone-300">
        {props.label}
      </label>
      <Input
        id={props.id}
        name={props.name}
        className={props.className || 'w-16'}
        classNames={{
          inputWrapper: 'border-b-2',
          innerWrapper: 'pb-0',
          label: 'text-xs text-stone-400',
          errorMessage: 'text-xs text-red-500 w-48',
          input: 'text-center',
        }}
        type="number"
        variant={props.variant || "underlined"}
        labelPlacement="outside-top"
        max={20}
        min={1}
      />
    </div>
  );
}
