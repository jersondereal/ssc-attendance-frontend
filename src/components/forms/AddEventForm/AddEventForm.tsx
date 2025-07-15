import { useState } from "react";
import { Button } from "../../common/Button/Button";
import Checkbox from "../../common/Checkbox/Checkbox";
import { Textbox } from "../../common/Textbox/Textbox";

interface AddEventFormProps {
  onSubmit: (data: {
    title: string;
    event_date: string;
    location: string;
    fine: number;
    courses: {
      all: boolean;
      bsit: boolean;
      bshm: boolean;
      bscrim: boolean;
    };
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
  const [formData, setFormData] = useState({
    title: "",
    event_date: new Date().toLocaleDateString("en-CA"),
    location: "",
    fine: "",
  });

  const [fineError, setFineError] = useState("");

  const [courses, setCourses] = useState({
    all: false,
    bsit: false,
    bshm: false,
    bscrim: false,
  });
  const [sections, setSections] = useState({
    all: false,
    a: false,
    b: false,
    c: false,
    d: false,
  });
  const [schoolYears, setSchoolYears] = useState({
    all: false,
    1: false,
    2: false,
    3: false,
    4: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear fine error when user types
    if (name === "fine") {
      setFineError("");
    }
  };

  const handleCourseChange = (key: keyof typeof courses, checked: boolean) => {
    if (key === "all") {
      setCourses({
        all: checked,
        bsit: checked,
        bshm: checked,
        bscrim: checked,
      });
    } else {
      const newCourses = { ...courses, [key]: checked };
      newCourses.all = newCourses.bsit && newCourses.bshm && newCourses.bscrim;
      setCourses(newCourses);
    }
  };

  const handleSectionChange = (
    key: keyof typeof sections,
    checked: boolean
  ) => {
    if (key === "all") {
      setSections({
        all: checked,
        a: checked,
        b: checked,
        c: checked,
        d: checked,
      });
    } else {
      const newSections = { ...sections, [key]: checked };
      newSections.all =
        newSections.a && newSections.b && newSections.c && newSections.d;
      setSections(newSections);
    }
  };

  const handleSchoolYearChange = (
    key: keyof typeof schoolYears,
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

    // Validate fine
    const fineValue = parseFloat(formData.fine);
    if (isNaN(fineValue) || fineValue < 0) {
      setFineError("Please enter a valid positive number");
      return;
    }

    onSubmit({
      ...formData,
      fine: fineValue,
      courses,
      sections,
      schoolYears,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <h2 className="text-base font-semibold mb-6">Add New Event</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Event Title
          </label>
          <Textbox
            name="title"
            placeholder="Enter event title"
            className="w-full py-2"
            value={formData.title}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Event Date
          </label>
          <input
            type="date"
            name="event_date"
            className="w-full px-3 py-2 border border-border-dark rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-zinc-200"
            value={formData.event_date}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Location
          </label>
          <Textbox
            name="location"
            placeholder="Enter event location"
            className="w-full py-2"
            value={formData.location}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Fine Amount
          </label>
          <Textbox
            name="fine"
            placeholder="Enter fine amount"
            className="w-full py-2"
            value={formData.fine}
            onChange={handleChange}
          />
          {fineError && (
            <p className="text-red-500 text-xs mt-1">{fineError}</p>
          )}
        </div>

        {/* attendees course */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Attendees Course
          </label>
          <div className="flex flex-row gap-5 w-full h-fit border border-border-dark rounded-md p-2">
            <Checkbox
              id="all-courses"
              label="All"
              checked={courses.all}
              onChange={(checked) => handleCourseChange("all", checked)}
            />
            <Checkbox
              id="bsit"
              label="BSIT"
              checked={courses.bsit}
              onChange={(checked) => handleCourseChange("bsit", checked)}
            />
            <Checkbox
              id="bshm"
              label="BSHM"
              checked={courses.bshm}
              onChange={(checked) => handleCourseChange("bshm", checked)}
            />
            <Checkbox
              id="bscrim"
              label="BSCrim"
              checked={courses.bscrim}
              onChange={(checked) => handleCourseChange("bscrim", checked)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Attendees Section
          </label>
          <div className="flex flex-row gap-5 w-full h-fit border border-border-dark rounded-md p-2">
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

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Attendees School Year
          </label>
          <div className="flex flex-row gap-5 w-full h-fit border border-border-dark rounded-md p-2">
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
          label="Add Event"
          variant="primary"
          className="flex-1 py-2 bg-zinc-700 text-white hover:bg-zinc-600"
        />
      </div>
    </form>
  );
};
