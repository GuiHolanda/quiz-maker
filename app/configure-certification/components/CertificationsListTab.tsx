import { SectionsTable } from "@/sharedComponents/SectionsTable";
import useCertificationsContext from "@/features/hooks/useCertificationsContext.hook";
import { Accordion, AccordionItem } from "@heroui/accordion";

export function CertificationsListTab() {
   const { certifications } = useCertificationsContext();
  return (
    <Accordion variant="splitted">
      {certifications.map((certification) => (
        <AccordionItem key={certification.key} aria-label={certification.label} title={certification.label} classNames={{
            title: 'text-sm',
        }}>
          <SectionsTable selectedCertification={certification} topicsList={certification.topics} />
        </AccordionItem>
      ))}
    </Accordion>
  );
}
