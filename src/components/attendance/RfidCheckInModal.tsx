import { Button } from "../common/Button/Button";
import { Modal } from "../common/Modal/Modal";

interface RfidCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rfid: string) => void;
}

export function RfidCheckInModal({
  isOpen,
  onClose,
  onSubmit,
}: RfidCheckInModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div
        className="p-6 text-center"
        onClick={(e) => {
          const input = e.currentTarget.querySelector("input");
          input?.focus();
        }}
      >
        <h2 className="font-medium select-none mt-8">Ready to Scan</h2>
        <p className="text-sm font-light text-gray-600 mt-4 select-none">
          Please tap your RFID card on the RFID reader to record attendance for
          this event.
        </p>
        <input
          type="text"
          className="sr-only"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSubmit(e.currentTarget.value);
              e.currentTarget.value = "";
            }
          }}
        />
        <Button
          label="Done"
          className="min-w-full mt-12 py-2 !text-sm"
          variant="secondary"
          onClick={onClose}
        />
      </div>
    </Modal>
  );
}
