import { Modal, ModalContent, ModalBody } from "@heroui/modal";
import { Spinner } from "@heroui/spinner";

interface BusyDialogProps {
  isOpen: boolean;
}

export function BusyDialog({ isOpen }: Readonly<BusyDialogProps>) {
  return (
    <Modal isOpen={isOpen} isDismissable={false} hideCloseButton>
      <ModalContent>
        <ModalBody className="flex flex-col items-center justify-center py-8">
          <Spinner size="lg" color="primary" label="Generating your questions." />
          <span className="mt-4 text-default-500">Please wait...</span>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}