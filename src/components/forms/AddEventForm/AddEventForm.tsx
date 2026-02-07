import { useMemo } from "react";
import { EventForm, type CollegesState } from "../EventForm/EventForm";

export type { CollegesState };

interface AddEventFormProps {
  onSubmit: (data: {
    title: string;
    event_date: string;
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
  const initialData = useMemo(
    () => ({
      title: "",
      event_date: new Date().toLocaleDateString("en-CA"),
      location: "",
      fine: "0",
    }),
    []
  );

  return (
    <EventForm
      initialData={initialData}
      onSubmit={onSubmit}
      onCancel={onCancel}
      headerText="Add New Event"
      submitLabel="Add Event"
    />
  );
};
