import { SectionsTable } from "@/sharedComponents/SectionsTable";
import useCertificationsContext from "@/features/hooks/useCertificationsContext.hook";
import { Accordion, AccordionItem } from "@heroui/accordion";

export function CertificationsListTab() {
   const { certifications } = useCertificationsContext();
  return (
    <Accordion
      variant="splitted"
      className="mt-2 gap-2"
      itemClasses={{
        base: 'clay-section border-0',
        title: 'text-sm text-white/80 font-semibold',
        trigger: 'px-4 py-3 hover:bg-white/[0.03] rounded-xl transition-colors duration-200',
        content: 'px-4 pb-4',
        indicator: 'text-white/30',
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
