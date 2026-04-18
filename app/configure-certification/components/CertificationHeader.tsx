import { Input } from '@heroui/input';

interface CertificationHeaderProps {
  title: string;
  code: string;
  onTitleChange: (value: string) => void;
  onCodeChange: (value: string) => void;
}

export function CertificationHeader({ title, code, onTitleChange, onCodeChange }: Readonly<CertificationHeaderProps>) {
  return (
    <div className="flex gap-4 mb-4">
      <Input
        label="Certification Title"
        type="text"
        className="w-2/3"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
      />
      <Input
        label="Certification Code"
        type="text"
        className="w-1/3"
        value={code}
        onChange={(e) => onCodeChange(e.target.value)}
      />
    </div>
  );
}
