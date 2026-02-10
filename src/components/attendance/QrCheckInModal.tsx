import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Button } from "../common/Button/Button";
import { Modal } from "../common/Modal/Modal";
import { Loader } from "lucide-react";

interface QrCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (studentId: string) => void;
}

export function QrCheckInModal({
  isOpen,
  onClose,
  onScan,
}: QrCheckInModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isReaderReady, setIsReaderReady] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const readerRef = useRef<HTMLDivElement | null>(null);
  const lastScannedRef = useRef<{ text: string; time: number } | null>(null);
  const onScanRef = useRef(onScan);
  const DEBOUNCE_MS = 2000;

  onScanRef.current = onScan;

  const cleanupScanner = () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    lastScannedRef.current = null;
    setIsLoading(false);
    if (readerRef.current) {
      readerRef.current.innerHTML = "";
    }
    if (scanner) {
      scanner.clear().catch(() => {});
    }
  };

  useEffect(() => {
    if (!isOpen) {
      cleanupScanner();
      return;
    }

    // Only init when modal is open AND reader div exists
    if (!isReaderReady || !readerRef.current) {
      return;
    }
    if (scannerRef.current) {
      cleanupScanner();
    }

    setIsLoading(true);
    lastScannedRef.current = null;

    const scanner = new Html5QrcodeScanner(
      readerRef.current.id,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
      },
      false
    );

    setIsLoading(false);
    scanner.render(
      (decodedText) => {
        const now = Date.now();
        const last = lastScannedRef.current;
        if (last && last.text === decodedText && now - last.time < DEBOUNCE_MS) {
          return;
        }
        lastScannedRef.current = { text: decodedText, time: now };
        onScanRef.current(decodedText);
      },
      () => {}
    );

    scannerRef.current = scanner;

    return () => {
      cleanupScanner();
    };
  }, [isOpen, isReaderReady]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 text-center !rounded-[20px]">
        <h2 className="font-bold mt-2">QR Code Scanner</h2>

        <p className="text-xs mt-1">
          Align the QR code within the frame to record attendance.
        </p>

        <div className="mt-5 mx-auto max-w-sm overflow-hidden">
          {isLoading && (
            <div className="items-center justify-center w-full h-32 grid place-items-center">
              <Loader className="size-6 animate-spin" />
            </div>
          )}
          <div
            id="reader"
            ref={(node) => {
              readerRef.current = node;
              setIsReaderReady(!!node);
            }}
            className="w-full h-full"
          />
        </div>

        <Button
          label="Done"
          className="min-w-full mt-6 py-2 !text-sm"
          variant="secondary"
          onClick={() => {
            cleanupScanner();
            onClose();
          }}
        />
      </div>
    </Modal>
  );
}