import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { Autocomplete, AutocompleteItem } from '@heroui/autocomplete';
import { Card, CardBody } from '@heroui/card';
import { SectionsTable } from '../quiz/SectionsTable';

export function EditCertificationTab() {
  const { certifications, setSelectedCertification, selectedCertification } = useCertificationsContext();

  const onCertificationChange = (key: any) => {
    const certification = certifications.find((cert) => cert.key === key);
    setSelectedCertification(certification || null);
  };
  return (
    <>
      <Autocomplete
        label="Select an Certification"
        className='w-3/4 mt-4'
        name="certificationTitle"
        onSelectionChange={onCertificationChange}
        selectedKey={selectedCertification?.key ?? ''}
      >
        {certifications.map((certification) => (
          <AutocompleteItem key={certification.key} textValue={certification.label}>
            {certification.label}
          </AutocompleteItem>
        ))}
      </Autocomplete>
      {selectedCertification && (
        <div className='mt-4'>
          <SectionsTable selectedCertification={selectedCertification} />
        </div>
      )}
    </>
  );
}
