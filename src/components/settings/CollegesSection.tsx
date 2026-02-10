import { useEffect, useState } from "react";
import {
  createCollege,
  deleteCollege,
  updateCollege,
  type College,
} from "../../api/colleges";
import { useToast } from "../../contexts/ToastContext";
import { useCollegesStore } from "../../stores/useCollegesStore";
import { Button } from "../common/Button/Button";
import { Modal } from "../common/Modal/Modal";
import { Textbox } from "../common/Textbox/Textbox";
import { SettingCard } from "./SettingCard";

const editBtnClass =
  "!px-3 !py-1.5 !bg-gray-100 !rounded !text-gray-700 !bg-transparent !border-0 hover:!bg-gray-100 active:!bg-gray-200 focus-visible:!ring-2 focus-visible:!ring-blue-400";
const deleteBtnClass =
  "!px-3 !py-1.5 !bg-gray-100 !rounded !text-red-600 !bg-transparent !border-0 hover:!bg-red-50 active:!bg-red-100 focus-visible:!ring-2 focus-visible:!ring-red-200";

export function CollegesSection() {
  const { showToast } = useToast();
  const colleges = useCollegesStore((s) => s.colleges);
  const fetchColleges = useCollegesStore((s) => s.fetchColleges);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCollege, setEditingCollege] = useState<College | null>(null);
  const [deleteTargetCollege, setDeleteTargetCollege] =
    useState<College | null>(null);
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const loadColleges = () => {
    fetchColleges().catch(() =>
      showToast("Failed to load colleges", "error")
    );
  };

  useEffect(() => {
    loadColleges();
  }, []);

  const openAddModal = () => {
    setFormCode("");
    setFormName("");
    setFormError("");
    setIsAddModalOpen(true);
  };

  const openEditModal = (college: College) => {
    setEditingCollege(college);
    setFormCode(college.code);
    setFormName(college.name);
    setFormError("");
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingCollege(null);
  };

  const openDeleteModal = (college: College) => {
    setDeleteTargetCollege(college);
    setDeleteError("");
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeleteTargetCollege(null);
    setDeleteError("");
  };

  const handleAddSave = () => {
    const code = formCode.trim().toLowerCase();
    const name = formName.trim();
    if (!code || !name) {
      setFormError("Code and name are required");
      return;
    }
    createCollege({ code, name })
      .then(() => {
        showToast("College added", "success");
        setIsAddModalOpen(false);
        loadColleges();
      })
      .catch((err: { response?: { data?: { message?: string } } }) => {
        setFormError(err.response?.data?.message ?? "Failed to add college");
      });
  };

  const handleEditSave = () => {
    if (!editingCollege) return;
    const name = formName.trim();
    if (!name) {
      setFormError("Name is required");
      return;
    }
    updateCollege(editingCollege.id, { name })
      .then(() => {
        showToast("College updated", "success");
        closeEditModal();
        loadColleges();
      })
      .catch((err: { response?: { data?: { message?: string } } }) => {
        setFormError(err.response?.data?.message ?? "Failed to update college");
      });
  };

  const handleDeleteConfirm = () => {
    if (!deleteTargetCollege) return;
    deleteCollege(deleteTargetCollege.id)
      .then(() => {
        showToast("College deleted", "success");
        closeDeleteModal();
        loadColleges();
      })
      .catch((err: { response?: { data?: { message?: string } } }) => {
        setDeleteError(
          err.response?.data?.message ?? "Failed to delete college"
        );
      });
  };

  return (
    <>
      <SettingCard
        title="Colleges"
        description="Manage the list of colleges. These appear in student registration, event attendee filters, and attendance filters. A college cannot be deleted if it is assigned to any students."
      >
        <div className="flex justify-end mb-4">
          <Button
            label="Add College"
            onClick={openAddModal}
            className="!bg-zinc-700 !text-white !border-zinc-700 hover:!bg-zinc-600 !px-4 !py-2"
          />
        </div>
        <div className="border border-border-dark rounded-[8px] overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-2 font-semibold">Code</th>
                <th className="px-4 py-2 font-semibold">Name</th>
                <th className="px-4 py-2 font-semibold w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {colleges.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-border-dark hover:bg-gray-50"
                >
                  <td className="px-4 py-2 font-medium">{c.code}</td>
                  <td className="px-4 py-2">{c.name}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <Button
                        label="Edit"
                        variant="secondary"
                        className={editBtnClass}
                        onClick={() => openEditModal(c)}
                      />
                      <Button
                        label="Delete"
                        variant="secondary"
                        className={deleteBtnClass}
                        onClick={() => openDeleteModal(c)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {colleges.length === 0 && (
            <p className="text-sm text-gray-500 px-4 py-6 text-center">
              No colleges yet. Add one to get started.
            </p>
          )}
        </div>
      </SettingCard>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
        <div className="p-6 min-w-[320px]">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Add College
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code
              </label>
              <Textbox
                value={formCode}
                onChange={(e) => {
                  setFormCode(e.target.value);
                  setFormError("");
                }}
                placeholder="e.g. coe"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <Textbox
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  setFormError("");
                }}
                placeholder="e.g. College of Engineering"
                className="w-full"
              />
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
          </div>
          <div className="flex gap-2 mt-6 justify-end">
            <Button
              label="Cancel"
              variant="secondary"
              onClick={() => setIsAddModalOpen(false)}
            />
            <Button
              label="Save"
              className="!bg-zinc-700 !text-white"
              onClick={handleAddSave}
            />
          </div>
        </div>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={closeEditModal}>
        <div className="p-6 min-w-[320px]">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Edit College
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code
              </label>
              <div className="w-full px-3 py-2 border border-border-dark rounded-[8px] bg-gray-100 text-gray-700 text-sm">
                {formCode}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <Textbox
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  setFormError("");
                }}
                placeholder="College name"
                className="w-full"
              />
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
          </div>
          <div className="flex gap-2 mt-6 justify-end">
            <Button
              label="Cancel"
              variant="secondary"
              onClick={closeEditModal}
            />
            <Button
              label="Save"
              className="!bg-zinc-700 !text-white"
              onClick={handleEditSave}
            />
          </div>
        </div>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
        <div className="p-6 min-w-[320px]">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Delete College
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            {deleteTargetCollege
              ? `Are you sure you want to delete "${deleteTargetCollege.name}" (${deleteTargetCollege.code})? This cannot be undone.`
              : ""}
          </p>
          {deleteError && (
            <p className="text-sm text-red-600 mb-4">{deleteError}</p>
          )}
          <div className="flex gap-2 justify-end">
            <Button
              label="Cancel"
              variant="secondary"
              onClick={closeDeleteModal}
            />
            <Button
              label="Delete"
              className={deleteBtnClass}
              onClick={handleDeleteConfirm}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
