import { useState } from "react";
import { Button } from "../../common/Button/Button";
import { Textbox } from "../../common/Textbox/Textbox";

interface AddEventFormProps {
  onSubmit: (data: {
    title: string;
    event_date: string;
    location: string;
    fine: number;
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
