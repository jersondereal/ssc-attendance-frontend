import { useEffect, useState } from "react";
import { Button } from "../../common/Button/Button";
import { useCollegesStore } from "../../../stores/useCollegesStore";
import Checkbox from "../../common/Checkbox/Checkbox";
import { Textbox } from "../../common/Textbox/Textbox";

export type CollegesState = { all: boolean; [code: string]: boolean };

interface EventFormData {
  title: string;
  event_date: string;
  location: string;
  fine: string;
}

type SectionsState = {
  all: boolean;
  a: boolean;
  b: boolean;
  c: boolean;
  d: boolean;
};

type SchoolYearsState = {
  all: boolean;
  1: boolean;
  2: boolean;
  3: boolean;
  4: boolean;
};

interface EventFormProps {
  initialData: EventFormData;
  initialColleges?: Record<string, boolean>;
  initialSections?: Partial<SectionsState>;
  initialSchoolYears?: Partial<SchoolYearsState>;
  onSubmit: (data: {
    title: string;
    event_date: string;
    location: string;
    fine: number;
    colleges: CollegesState;
    sections: SectionsState;
    schoolYears: SchoolYearsState;
  }) => void;
  onCancel: () => void;
  headerText: string;
  submitLabel: string;
  className?: string;
}

// Hide section input, but keep handling logic
const buildSectionsState = (data?: Partial<SectionsState>): SectionsState => ({
  all: data?.all ?? false,
  a: data?.a ?? false,
  b: data?.b ?? false,
  c: data?.c ?? false,
  d: data?.d ?? false,
});

// Always return all years as selected by default
const buildSchoolYearsState = (
  // data?: Partial<SchoolYearsState>
): SchoolYearsState => ({
  all: true,
  1: true,
  2: true,
  3: true,
  4: true,
});

export const EventForm = ({
  initialData,
  initialColleges,
  initialSections,
  initialSchoolYears,
  onSubmit,
  onCancel,
  headerText,
  submitLabel,
  className = "p-6",
}: EventFormProps) => {
  const [formData, setFormData] = useState<EventFormData>(initialData);
  const [fineError, setFineError] = useState("");
  const collegeList = useCollegesStore((s) => s.colleges);
  const fetchColleges = useCollegesStore((s) => s.fetchColleges);
  const [colleges, setColleges] = useState<CollegesState>({ all: false });
  const [sections, setSections] = useState<SectionsState>(
    buildSectionsState(initialSections)
  );
  // Always set all school years as true by default
  const [schoolYears, setSchoolYears] = useState<SchoolYearsState>(
    buildSchoolYearsState()
  );

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  useEffect(() => {
    setSections(buildSectionsState(initialSections));
  }, [initialSections]);

  // Always set all school years as true by default, no matter the initialSchoolYears prop
  useEffect(() => {
    setSchoolYears(buildSchoolYearsState());
  }, [initialSchoolYears]);

  useEffect(() => {
    if (collegeList.length === 0) fetchColleges();
  }, [collegeList.length, fetchColleges]);

  useEffect(() => {
    const initial: CollegesState = { all: initialColleges?.all ?? false };
    collegeList.forEach(
      (c) => (initial[c.code] = initialColleges?.[c.code] ?? false)
    );
    if (collegeList.length > 0) {
      initial.all =
        initial.all || collegeList.every((c) => initial[c.code] === true);
    }
    setColleges(initial);
  }, [collegeList, initialColleges]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "fine") {
      setFineError("");
    }
  };

  const handleCollegeChange = (key: string, checked: boolean) => {
    if (key === "all") {
      const next: CollegesState = { all: checked };
      collegeList.forEach((c) => (next[c.code] = checked));
      setColleges(next);
    } else {
      const newColleges = { ...colleges, [key]: checked };
      const codes = collegeList.map((c) => c.code);
      newColleges.all = codes.every((code) => newColleges[code] === true);
      setColleges(newColleges);
    }
  };

  // const handleSectionChange = (key: keyof SectionsState, checked: boolean) => {
  //   if (key === "all") {
  //     setSections({
  //       all: checked,
  //       a: checked,
  //       b: checked,
  //       c: checked,
  //       d: checked,
  //     });
  //   } else {
  //     const newSections = { ...sections, [key]: checked };
  //     newSections.all =
  //       newSections.a && newSections.b && newSections.c && newSections.d;
  //     setSections(newSections);
  //   }
  // };

  const handleSchoolYearChange = (
    key: keyof SchoolYearsState,
    checked: boolean
  ) => {
    if (key === "all") {
      setSchoolYears({
        all: checked,
        1: checked,
        2: checked,
        3: checked,
        4: checked,
      });
    } else {
      const newSchoolYears = { ...schoolYears, [key]: checked };
      newSchoolYears.all =
        newSchoolYears[1] &&
        newSchoolYears[2] &&
        newSchoolYears[3] &&
        newSchoolYears[4];
      setSchoolYears(newSchoolYears);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const fineValue = parseFloat(formData.fine);
    if (isNaN(fineValue) || fineValue < 0) {
      setFineError("Please enter a valid positive number");
      return;
    }

    onSubmit({
      ...formData,
      fine: fineValue,
      colleges,
      sections,
      schoolYears,
    });
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <h2 className="text-sm font-semibold mb-6">{headerText}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Title
            </label>
            <Textbox
              name="title"
              placeholder="Enter event title"
              required
              className="w-full py-2"
              value={formData.title}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Date
            </label>
            <input
              type="date"
              name="event_date"
              required
              className="w-full px-3 h-10 border border-border-dark rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-zinc-200"
              value={formData.event_date}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <Textbox
              name="location"
              placeholder="Enter event location"
              required
              className="w-full py-2"
              value={formData.location}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fine Amount
            </label>
            <Textbox
              name="fine"
              placeholder="Enter fine amount"
              required
              className="w-full py-2"
              value={formData.fine}
              onChange={handleChange}
            />
            {fineError && (
              <p className="text-red-500 text-sm mt-1">{fineError}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Attendees Colleges
          </label>
          <div className="flex flex-col gap-5 w-full h-fit border border-border-dark rounded-[8px] p-4 max-h-40 overflow-y-scroll">
            <Checkbox
              id="all-colleges"
              label="All"
              checked={colleges.all}
              onChange={(checked) => handleCollegeChange("all", checked)}
            />
            {collegeList.map((c) => (
              <Checkbox
                key={c.id}
                id={`college-${c.code}`}
                label={c.name}
                checked={colleges[c.code] === true}
                onChange={(checked) => handleCollegeChange(c.code, checked)}
              />
            ))}
          </div>
        </div>

        {/* <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attendees Section
            </label>
            <div className="flex flex-row gap-5 w-full h-fit border border-border-dark rounded-[8px] p-2">
              <Checkbox
                id="all-sections"
                label="All"
                checked={sections.all}
                onChange={(checked) => handleSectionChange("all", checked)}
              />
              <Checkbox
                id="section-a"
                label="A"
                checked={sections.a}
                onChange={(checked) => handleSectionChange("a", checked)}
              />
              <Checkbox
                id="section-b"
                label="B"
                checked={sections.b}
                onChange={(checked) => handleSectionChange("b", checked)}
              />
              <Checkbox
                id="section-c"
                label="C"
                checked={sections.c}
                onChange={(checked) => handleSectionChange("c", checked)}
              />
              <Checkbox
                id="section-d"
                label="D"
                checked={sections.d}
                onChange={(checked) => handleSectionChange("d", checked)}
              />
            </div>
          </div>
        </div> */}

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attendees School Year
            </label>
            <div className="flex flex-row gap-5 w-full h-fit border border-border-dark rounded-[8px] p-2">
              <Checkbox
                id="all-school-years"
                label="All"
                checked={schoolYears.all}
                onChange={(checked) => handleSchoolYearChange("all", checked)}
              />
              <Checkbox
                id="school-year-1"
                label="1"
                checked={schoolYears[1]}
                onChange={(checked) => handleSchoolYearChange(1, checked)}
              />
              <Checkbox
                id="school-year-2"
                label="2"
                checked={schoolYears[2]}
                onChange={(checked) => handleSchoolYearChange(2, checked)}
              />
              <Checkbox
                id="school-year-3"
                label="3"
                checked={schoolYears[3]}
                onChange={(checked) => handleSchoolYearChange(3, checked)}
              />
              <Checkbox
                id="school-year-4"
                label="4"
                checked={schoolYears[4]}
                onChange={(checked) => handleSchoolYearChange(4, checked)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <Button
          type="button"
          label="Cancel"
          variant="secondary"
          className="flex-1 py-2"
          onClick={onCancel}
        />
        <Button
          type="submit"
          label={submitLabel}
          variant="primary"
          className="flex-1 py-2 bg-zinc-700 text-white hover:bg-zinc-600"
        />
      </div>
    </form>
  );
};
