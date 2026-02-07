export interface Event {
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

export interface AddEventData {
  title: string;
  event_date: string;
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

export interface EventSelectorProps {
  className?: string;
  value?: Event;
  onChange?: (event: Event) => void;
  placeholder?: string;
  events: Event[];
  onAddEvent?: (eventData: AddEventData) => void;
  onEditEvent?: (event: Event) => void;
  onDeleteEvent?: (eventId: string) => void;
  currentUserRole?: string;
  canAddEvent?: boolean;
  canEditEvent?: boolean;
  canDeleteEvent?: boolean;
}
