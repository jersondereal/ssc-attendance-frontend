import { useMemo } from "react";
import { EventForm, type CollegesState } from "../EventForm/EventForm";

interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  fine: number;
  colleges?: Record<string, boolean>;
  sections?: {
    all: boolean;
    a: boolean;
    b: boolean;
    c: boolean;
    d: boolean;
  };
  schoolYears?: {
    all: boolean;
    1: boolean;
    2: boolean;
    3: boolean;
    4: boolean;
  };
}

interface EditEventFormProps {
  event: Event;
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

export const EditEventForm = ({
  event,
  onSubmit,
  onCancel,
}: EditEventFormProps) => {
  const initialData = useMemo(
    () => ({
      title: event.name || "",
      event_date: event.date
        ? new Date(event.date).toLocaleDateString("en-CA")
        : new Date().toLocaleDateString("en-CA"),
      location: event.location || "",
      fine: event.fine?.toString() || "0",
    }),
    [event.date, event.fine, event.location, event.name]
  );

  return (
    <EventForm
      initialData={initialData}
      initialColleges={event.colleges}
      initialSections={event.sections}
      initialSchoolYears={event.schoolYears}
      onSubmit={onSubmit}
      onCancel={onCancel}
      headerText="Edit Event"
      submitLabel="Save Changes"
    />
  );
};
