import { useMemo } from "react";
import { EventForm, type CollegesState } from "../EventForm/EventForm";

export type { CollegesState };

interface AddEventFormProps {
  onSubmit: (data: {
    title: string;
    event_date: string;
    event_time: string;
    location: string;
    fine: number;
    colleges: CollegesState;
    sections: {
      all: boolean;
      a: boolean;
      b: boolean;
      c: boolean;
      d: boolean;
    };
    schoolYears: {
      all: boolean;
      1: boolean;
      2: boolean;
      3: boolean;
      4: boolean;
    };
  }) => void;
  onCancel: () => void;
}

export const AddEventForm = ({ onSubmit, onCancel }: AddEventFormProps) => {
  const today = useMemo(() => new Date().toLocaleDateString("en-CA"), []);
  const initialData = useMemo(
    () => ({
      title: "",
      event_date: today,
      event_time: "09:00",
      location: "",
      fine: "0",
    }),
    [today]
  );

  return (
    <EventForm
      initialData={initialData}
      minDate={today}
      onSubmit={onSubmit}
      onCancel={onCancel}
      headerText="Add New Event"
      submitLabel="Add Event"
    />
  );
};
