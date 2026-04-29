import { SectionsTable } from "@/shared/components/SectionsTable";
import useCertificationsContext from "@/features/hooks/useCertificationsContext.hook";
import { Accordion, AccordionItem } from "@heroui/accordion";

export function CertificationsListTab() {
   const { certifications } = useCertificationsContext();
  return (
    <Accordion
      variant="splitted"
      className="mt-2 gap-2"
      itemClasses={{
        base: 'bg-content1 border border-default-200 rounded-xl',
        title: 'text-sm text-foreground font-semibold',
        trigger: 'px-4 py-3 hover:bg-default-100 rounded-xl transition-colors duration-200',
        content: 'px-4 pb-4',
        indicator: 'text-default-400',
      }}
    >
      {certifications.map((certification) => (
        <AccordionItem key={certification.key} aria-label={certification.label} title={certification.label}>
          <SectionsTable selectedCertification={certification} topicsList={certification.topics} />
        </AccordionItem>
      ))}
    </Accordion>
  );
}
