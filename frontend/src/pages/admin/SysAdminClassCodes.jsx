import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { PrimaryButton, DangerButton } from "./AdminStyles";
import {
  fetchClassCodes,
  createClassCode,
  deleteClassCode,
} from "../../store/admin/admin-Actions";
import AdminStatusBanner from "./AdminStatusBanner";
import DeleteClassCodeConfirmModal from "./DeleteClassCodeConfirmModal";

const SysAdminClassCodes = ({ token, onClassesChanged }) => {
  const dispatch = useDispatch();
  const [classCodes, setClassCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successBanner, setSuccessBanner] = useState("");
  const [newClassCode, setNewClassCode] = useState("");
  const [newBtsEnabled, setNewBtsEnabled] = useState(true);
  const [classToDelete, setClassToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (!successBanner) return undefined;
    const t = window.setTimeout(() => setSuccessBanner(""), 5000);
    return () => window.clearTimeout(t);
  }, [successBanner]);

  const loadClassCodes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await dispatch(fetchClassCodes(token));
      setClassCodes(data);
    } catch (e) {
      setError(e.message || "Failed to load class codes");
    } finally {
      setLoading(false);
    }
  }, [dispatch, token]);

  useEffect(() => {
    loadClassCodes();
  }, [loadClassCodes]);

  const handleAddClass = async () => {
    setError("");
    setSuccessBanner("");
    const code = newClassCode.trim();
    if (!code) {
      setError("Class code is required.");
      return;
    }
    if (!/^\d+$/.test(code)) {
      setError("Class code may only contain digits.");
      return;
    }
    try {
      await dispatch(
        createClassCode(token, {
          class_code: code,
          bts_enabled: newBtsEnabled,
        })
      );
      setNewClassCode("");
      setNewBtsEnabled(true);
      await loadClassCodes();
      if (onClassesChanged) await onClassesChanged();
      setSuccessBanner("Class code added successfully.");
    } catch (e) {
      setError(e.message || "Failed to add class code");
    }
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setClassToDelete(null);
    setDeleteError("");
  };

  const handleConfirmDelete = async () => {
    if (!classToDelete) return;
    setDeleteError("");
    setDeleting(true);
    try {
      await dispatch(deleteClassCode(token, classToDelete));
      setClassToDelete(null);
      setDeleteError("");
      await loadClassCodes();
      if (onClassesChanged) await onClassesChanged();
      setSuccessBanner("Class code deleted successfully.");
    } catch (e) {
      setDeleteError(e.message || "Failed to delete class code");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {successBanner ? <AdminStatusBanner message={successBanner} /> : null}
      <div className="admin-section">
        <h3>Class codes</h3>
        {error ? (
          <div className="admin-message-area">
            <p className="admin-inline-msg admin-inline-msg--error" role="alert">
              {error}
            </p>
          </div>
        ) : null}
        <div className="admin-form-toolbar">
          <input
            className="admin-text-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            placeholder="Class code"
            value={newClassCode}
            onChange={(e) => {
              setNewClassCode(e.target.value.replace(/\D/g, ""));
              if (error) setError("");
            }}
          />
          <label
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <input
              type="checkbox"
              checked={newBtsEnabled}
              onChange={(e) => setNewBtsEnabled(e.target.checked)}
            />
            BTS enabled
          </label>
          <PrimaryButton type="button" onClick={handleAddClass}>
            Add class
          </PrimaryButton>
        </div>
        {loading ? (
          <p className="admin-inline-msg admin-inline-msg--muted">
            Loading class codes…
          </p>
        ) : (
          <div className="admin-section__data">
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Class code</th>
                    <th>BTS enabled</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classCodes.length === 0 ? (
                    <tr>
                      <td colSpan={3}>
                        <span className="admin-inline-msg admin-inline-msg--muted">
                          No class codes yet.
                        </span>
                      </td>
                    </tr>
                  ) : (
                    classCodes.map((row) => (
                      <tr key={row.class_code}>
                        <td>{row.class_code}</td>
                        <td>{row.bts_enabled ? "true" : "false"}</td>
                        <td className="admin-table__action-cell">
                          <DangerButton
                            type="button"
                            onClick={() => {
                              setError("");
                              setSuccessBanner("");
                              setDeleteError("");
                              setClassToDelete(row.class_code);
                            }}
                          >
                            Delete
                          </DangerButton>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <DeleteClassCodeConfirmModal
        classCode={classToDelete}
        confirming={deleting}
        deleteError={deleteError}
        onCancel={closeDeleteModal}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default SysAdminClassCodes;
