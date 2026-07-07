import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Button } from "../common/Button/Button";
import { Modal } from "../common/Modal/Modal";
import { Loader } from "lucide-react";
import type { AttendanceHistoryEntry, AttendanceRecord } from "../../stores/types";
import { AttendanceHistoryCard, LastUpdatedCard } from "./AttendanceUpdatePanel";
import "./QrCheckInModal.css";

interface QrCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (studentId: string) => void;
  lastStatusChange?: {
    record: AttendanceRecord;
    profileImageUrl: string | null;
    updatedAt: number;
  } | null;
  history?: AttendanceHistoryEntry[];
}

export function QrCheckInModal({
  isOpen,
  onClose,
  onScan,
  lastStatusChange,
  history = [],
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      modalClassName="!rounded-[20px] overflow-hidden"
      sideContent={
        <div className="flex h-full w-60 flex-col gap-4">
          <LastUpdatedCard
            record={lastStatusChange?.record ?? null}
            profileImageUrl={lastStatusChange?.profileImageUrl ?? null}
            updatedAt={lastStatusChange?.updatedAt ?? null}
          />
          <AttendanceHistoryCard
            history={history}
            className="flex-1 min-h-0"
            listClassName="flex-1 min-h-0"
          />
        </div>
      }
    >
      <div className="p-6 text-center">
        <h2 className="font-bold text-gray-900">QR Code Scanner</h2>

        <p className="text-xs mt-1 text-gray-500">
          Align the QR code within the frame to record attendance.
        </p>

        <div className="qr-reader mt-5 mx-auto max-w-sm overflow-hidden rounded-2xl border border-gray-200">
          {isLoading && (
            <div className="items-center justify-center w-full h-32 grid place-items-center bg-gray-950 text-white">
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