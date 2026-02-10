import { forwardRef } from "react";
import { QRCodeCanvas } from "qrcode.react";

export interface StudentQRCardProps {
  studentId: string;
  name: string;
  college: string;
  year: string;
  section: string;
  /** QR code size in pixels */
  size?: number;
  className?: string;
}

export const StudentQRCard = forwardRef<HTMLDivElement, StudentQRCardProps>(
  (
    {
      studentId,
      name,
      college,
      year,
      section,
      size = 120,
      className = "",
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`flex flex-col items-center gap-2 w-fit mx-auto p-8 ${className}`}
      >
        <div className="border border-border-dark rounded-[10px] p-5">
          <QRCodeCanvas value={studentId} size={size} />
        </div>
        <div className="w-full">
          <p className="font-semibold text-xl font-serif">{name}</p>
          <div className="flex flex-row items-center gap-3 text-xs w-fit mx-auto font-bold mt-1">
            <span>{studentId}</span>
            <span>{college.toUpperCase()}</span>
            <span>
              {year}-{section.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    );
  }
);

StudentQRCard.displayName = "StudentQRCard";
