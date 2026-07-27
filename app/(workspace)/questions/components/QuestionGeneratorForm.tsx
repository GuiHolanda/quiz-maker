'use client';

interface QuestionGeneratorFormProps {
  readonly managerSlot: React.ReactNode;
  readonly distributionSlot: React.ReactNode;
}

export function QuestionGeneratorForm({ managerSlot, distributionSlot }: Readonly<QuestionGeneratorFormProps>) {
  return (
    <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-6 w-full">
      <div className="w-full">{managerSlot}</div>
      {distributionSlot}
    </div>
  );
}
