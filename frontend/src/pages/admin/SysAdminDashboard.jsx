import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  PrimaryButton,
  DangerButton,
} from "./AdminStyles";
import {
  fetchAdmins,
  createAdmin,
  updateAdmin,
  resetAdminPassword,
  deleteAdmin,
  fetchAdminClassesAssignments,
  assignClassToAdmin,
  removeClassAssignment,
  fetchAvailableClasses,
} from "../../store/admin/admin-Actions";
import { isValidAdminEmail } from "./adminValidation";
import AdminStatusBanner from "./AdminStatusBanner";
import DeleteAdminConfirmModal from "./DeleteAdminConfirmModal";
import SysAdminClassCodes from "./SysAdminClassCodes";

const PROTECTED_ADMIN_ID = "000000001";

const SysAdminDashboard = () => {
  const adminState = useSelector((s) => s.admin || {});
  const token =
    adminState.token || localStorage.getItem("adminToken") || null;
  const currentAdminId =
    adminState.adminId || localStorage.getItem("adminId") || "";

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [admins, setAdmins] = useState([]);
  const [assigns, setAssigns] = useState([]);
  const [editAdmins, setEditAdmins] = useState({});
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState("courseadmin");
  const [lastTemp, setLastTemp] = useState(null);
  const [newAssignAdminId, setNewAssignAdminId] = useState("");
  const [newAssignClassCode, setNewAssignClassCode] = useState("");
  const [availableClasses, setAvailableClasses] = useState([]);
  const [error, setError] = useState("");
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [loadingAssigns, setLoadingAssigns] = useState(false);
  const [successBanner, setSuccessBanner] = useState("");
  const [addFormEmailError, setAddFormEmailError] = useState("");
  const [rowEmailSaveError, setRowEmailSaveError] = useState(null);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [deletingAdmin, setDeletingAdmin] = useState(false);

  useEffect(() => {
    if (!successBanner) return undefined;
    const t = window.setTimeout(() => setSuccessBanner(""), 5000);
    return () => window.clearTimeout(t);
  }, [successBanner]);

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }
    let cancelled = false;

    const load = async () => {
      setError("");
      setAddFormEmailError("");
      setLoadingAdmins(true);
      setLoadingAssigns(true);
      try {
        const adminsData = await dispatch(fetchAdmins(token));
        if (!cancelled) {
          setAdmins(adminsData);
          const m = {};
          adminsData.forEach((a) => {
            m[a.admin_id] = {
              admin_username: a.admin_username,
              admin_email: a.admin_email,
              role: a.role,
              is_active: a.is_active,
            };
          });
          setEditAdmins(m);
          setLoadingAdmins(false);
        }

        const assignsData = await dispatch(
          fetchAdminClassesAssignments(token)
        );
        const classesData = await dispatch(fetchAvailableClasses(token));
        if (!cancelled) {
          setAssigns(assignsData);
          setAvailableClasses(classesData);
          setLoadingAssigns(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || "Failed to load admin data");
          setLoadingAdmins(false);
          setLoadingAssigns(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [token, navigate, dispatch]);

  const updateEdit = (admin_id, field, value) => {
    const nextVal = field === "is_active" ? value === "true" : value;
    setEditAdmins((prev) => ({
      ...prev,
      [admin_id]: {
        ...prev[admin_id],
        [field]: nextVal,
      },
    }));
    if (field === "admin_email" && isValidAdminEmail(nextVal)) {
      setRowEmailSaveError((prev) =>
        prev && prev.adminId === admin_id ? null : prev
      );
    }
  };

  const saveAdminRemote = async (admin_id) => {
    setError("");
    setSuccessBanner("");
    const payload = editAdmins[admin_id];
    if (!payload) return;
    const email = String(payload.admin_email ?? "").trim();
    if (!email) {
      setRowEmailSaveError({
        adminId: admin_id,
        message: "Email is required.",
      });
      return;
    }
    if (!isValidAdminEmail(email)) {
      setRowEmailSaveError({
        adminId: admin_id,
        message: "Please enter a valid email address.",
      });
      return;
    }
    setRowEmailSaveError(null);
    try {
      await dispatch(updateAdmin(token, admin_id, payload));
      setAdmins((prev) =>
        prev.map((a) =>
          a.admin_id === admin_id
            ? {
                ...a,
                admin_username: payload.admin_username,
                admin_email: payload.admin_email,
                role: payload.role,
                is_active: payload.is_active,
              }
            : a
        )
      );
      setSuccessBanner("Changes saved successfully.");
    } catch (e) {
      setError(e.message || "Failed to save admin");
    }
  };

  const handleResetPassword = async (admin_id) => {
    setError("");
    setSuccessBanner("");
    try {
      const data = await dispatch(resetAdminPassword(token, admin_id));
      setLastTemp({
        admin_id: data.admin_id,
        temp_password: data.temp_password,
      });
    } catch (e) {
      setError(e.message || "Failed to reset password");
    }
  };

  const createAdminRemote = async () => {
    setError("");
    setSuccessBanner("");
    setLastTemp(null);
    setAddFormEmailError("");
    if (!newAdminName.trim()) {
      setError("Username is required.");
      return;
    }
    if (!newAdminEmail.trim()) {
      setError("");
      setAddFormEmailError("Email is required.");
      return;
    }
    if (!isValidAdminEmail(newAdminEmail)) {
      setError("");
      setAddFormEmailError("Please enter a valid email address.");
      return;
    }
    try {
      const data = await dispatch(
        createAdmin(token, {
          admin_username: newAdminName,
          admin_email: newAdminEmail.trim(),
          role: newAdminRole,
        })
      );
      setAdmins((prev) => [...prev, data]);
      setEditAdmins((prev) => ({
        ...prev,
        [data.admin_id]: {
          admin_username: data.admin_username,
          admin_email: data.admin_email,
          role: data.role,
          is_active: data.is_active,
        },
      }));
      setLastTemp({
        admin_id: data.admin_id,
        temp_password: data.temp_password,
      });
      setNewAdminName("");
      setNewAdminEmail("");
      setNewAdminRole("courseadmin");
      setAddFormEmailError("");
      setSuccessBanner("Admin added successfully.");
    } catch (e) {
      setError(e.message || "Failed to add admin");
    }
  };

  const addAssignRemote = async () => {
    setError("");
    setAddFormEmailError("");
    setSuccessBanner("");
    if (!newAssignAdminId || !newAssignClassCode) {
      setError("admin_id and class_code are required");
      return;
    }
    const exists = assigns.some(
      (r) =>
        r.admin_id === newAssignAdminId &&
        r.class_code === newAssignClassCode
    );
    if (exists) {
      setError("This assignment already exists");
      return;
    }
    try {
      await dispatch(
        assignClassToAdmin(token, newAssignAdminId, newAssignClassCode)
      );
      setAssigns((prev) => [
        ...prev,
        { admin_id: newAssignAdminId, class_code: newAssignClassCode },
      ]);
      setNewAssignAdminId("");
      setNewAssignClassCode("");
    } catch (e) {
      setError(e.message || "Failed to add assignment");
    }
  };

  const canDeleteAdmin = (adminId) =>
    adminId !== PROTECTED_ADMIN_ID && adminId !== currentAdminId;

  const canResetPassword = (adminId) =>
    adminId !== PROTECTED_ADMIN_ID || currentAdminId === PROTECTED_ADMIN_ID;

  const openDeleteModal = (admin) => {
    setError("");
    setSuccessBanner("");
    const edited = editAdmins[admin.admin_id] || {};
    setAdminToDelete({
      admin_id: admin.admin_id,
      admin_username: edited.admin_username ?? admin.admin_username,
      admin_email: edited.admin_email ?? admin.admin_email,
      role: edited.role ?? admin.role,
    });
  };

  const handleConfirmDeleteAdmin = async () => {
    if (!adminToDelete) return;
    setError("");
    setSuccessBanner("");
    setDeletingAdmin(true);
    try {
      await dispatch(deleteAdmin(token, adminToDelete.admin_id));
      const deletedId = adminToDelete.admin_id;
      setAdmins((prev) => prev.filter((a) => a.admin_id !== deletedId));
      setEditAdmins((prev) => {
        const next = { ...prev };
        delete next[deletedId];
        return next;
      });
      setAssigns((prev) => prev.filter((r) => r.admin_id !== deletedId));
      if (newAssignAdminId === deletedId) {
        setNewAssignAdminId("");
      }
      setAdminToDelete(null);
      setSuccessBanner("Admin deleted successfully.");
    } catch (e) {
      setError(e.message || "Failed to delete admin");
    } finally {
      setDeletingAdmin(false);
    }
  };

  const reloadAvailableClasses = async () => {
    try {
      const classesData = await dispatch(fetchAvailableClasses(token));
      setAvailableClasses(classesData);
    } catch (e) {
      setError(e.message || "Failed to refresh class list");
    }
  };

  const deleteAssignRemote = async (admin_id, class_code) => {
    setError("");
    setAddFormEmailError("");
    setSuccessBanner("");
    try {
      await dispatch(
        removeClassAssignment(token, admin_id, class_code)
      );
      setAssigns((prev) =>
        prev.filter(
          (r) =>
            !(
              r.admin_id === admin_id &&
              r.class_code === class_code
            )
        )
      );
    } catch (e) {
      setError(e.message || "Failed to delete assignment");
    }
  };

  return (
    <>
      {successBanner ? (
        <AdminStatusBanner message={successBanner} />
      ) : null}
      <div className="admin-section">
        <h3>Course Admins</h3>
        {error || addFormEmailError ? (
          <div className="admin-message-area">
            <p className="admin-inline-msg admin-inline-msg--error" role="alert">
              {error || addFormEmailError}
            </p>
          </div>
        ) : null}
        <div className="admin-form-toolbar admin-form-toolbar--add-admin">
          <input
            className="admin-text-input admin-add-admin-username"
            type="text"
            placeholder="Username"
            value={newAdminName}
            onChange={(e) => setNewAdminName(e.target.value)}
          />
          <input
            className={`admin-text-input admin-add-admin-email${
              addFormEmailError ? " admin-text-input--error" : ""
            }`}
            type="email"
            placeholder="Email"
            value={newAdminEmail}
            onChange={(e) => {
              setNewAdminEmail(e.target.value);
              if (addFormEmailError) setAddFormEmailError("");
            }}
            aria-invalid={addFormEmailError ? "true" : "false"}
          />
          <select
            className="admin-select admin-select--add-admin-role"
            value={newAdminRole}
            onChange={(e) => setNewAdminRole(e.target.value)}
          >
            <option value="courseadmin">courseadmin</option>
            <option value="sysadmin">sysadmin</option>
          </select>
          <PrimaryButton type="button" onClick={createAdminRemote}>
            Add admin
          </PrimaryButton>
        </div>
        {lastTemp ? (
          <div
            className="admin-inline-msg admin-inline-msg--success"
            role="status"
          >
            New/updated admin: ID {lastTemp.admin_id}, temp password{" "}
            <code>{lastTemp.temp_password}</code>
          </div>
        ) : null}
        {loadingAdmins ? (
          <p className="admin-inline-msg admin-inline-msg--muted">Loading admins…</p>
        ) : (
          <div className="admin-section__data">
          <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Admin ID</th>
                <th>Username</th>
                <th>Email</th>
                <th className="admin-col-role">Role</th>
                <th className="admin-col-active">is_active</th>
                <th className="admin-col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => {
                const e = editAdmins[a.admin_id] || {};
                const showDeleteAction = canDeleteAdmin(a.admin_id);
                const showResetPasswordAction = canResetPassword(a.admin_id);
                const emailRowErr =
                  rowEmailSaveError &&
                  rowEmailSaveError.adminId === a.admin_id;
                return (
                  <tr key={a.admin_id}>
                    <td>{a.admin_id}</td>
                    <td>
                      <input
                        type="text"
                        value={e.admin_username || ""}
                        onChange={(ev) =>
                          updateEdit(
                            a.admin_id,
                            "admin_username",
                            ev.target.value
                          )
                        }
                      />
                    </td>
                    <td>
                      <div
                        className={
                          emailRowErr
                            ? "admin-email-cell admin-email-cell--error"
                            : "admin-email-cell"
                        }
                      >
                        <input
                          type="email"
                          value={e.admin_email || ""}
                          onChange={(ev) =>
                            updateEdit(
                              a.admin_id,
                              "admin_email",
                              ev.target.value
                            )
                          }
                          aria-invalid={emailRowErr ? "true" : "false"}
                        />
                        {emailRowErr ? (
                          <span className="admin-field-error-text" role="alert">
                            {rowEmailSaveError.message}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="admin-col-role-cell">
                      <select
                        className="admin-select admin-select--table-narrow"
                        value={e.role || "courseadmin"}
                        onChange={(ev) =>
                          updateEdit(
                            a.admin_id,
                            "role",
                            ev.target.value
                          )
                        }
                      >
                        <option value="sysadmin">sysadmin</option>
                        <option value="courseadmin">
                          courseadmin
                        </option>
                      </select>
                    </td>
                    <td className="admin-col-active-cell">
                      <select
                        className="admin-select admin-select--table-narrow"
                        value={String(e.is_active)}
                        onChange={(ev) =>
                          updateEdit(
                            a.admin_id,
                            "is_active",
                            ev.target.value
                          )
                        }
                      >
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </select>
                    </td>
                    <td className="admin-col-actions-cell">
                      <span className="admin-inline-actions admin-inline-actions--table-row">
                        <PrimaryButton
                          type="button"
                          onClick={() => saveAdminRemote(a.admin_id)}
                        >
                          Save
                        </PrimaryButton>
                        {showResetPasswordAction ? (
                          <PrimaryButton
                            type="button"
                            onClick={() =>
                              handleResetPassword(a.admin_id)
                            }
                          >
                            Reset password
                          </PrimaryButton>
                        ) : null}
                        {showDeleteAction ? (
                          <DangerButton
                            type="button"
                            onClick={() => openDeleteModal(a)}
                          >
                            Delete
                          </DangerButton>
                        ) : null}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          </div>
        )}
      </div>

      <div className="admin-section">
        <h3>Assign classes to admins</h3>
        <div className="admin-form-toolbar">
          <select
            className="admin-select"
            value={newAssignAdminId}
            onChange={(e) => setNewAssignAdminId(e.target.value)}
          >
            <option value="">-- admin_id --</option>
            {admins.map((a) => (
              <option key={a.admin_id} value={a.admin_id}>
                {a.admin_id} ({a.admin_username})
              </option>
            ))}
          </select>
          <select
            className="admin-select"
            value={newAssignClassCode}
            onChange={(e) =>
              setNewAssignClassCode(e.target.value)
            }
          >
            <option value="">-- class_code --</option>
            {availableClasses.map((cc) => (
              <option key={cc} value={cc}>
                {cc}
              </option>
            ))}
          </select>
          <PrimaryButton type="button" onClick={addAssignRemote}>
            Add assignment
          </PrimaryButton>
        </div>
        {loadingAssigns ? (
          <p className="admin-inline-msg admin-inline-msg--muted">
            Loading assignments…
          </p>
        ) : (
          <div className="admin-section__data">
          <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Admin ID</th>
                <th>Class Code</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assigns.map((r, idx) => (
                <tr key={`${r.admin_id}-${r.class_code}-${idx}`}>
                  <td>{r.admin_id}</td>
                  <td>{r.class_code}</td>
                  <td className="admin-table__action-cell">
                    <DangerButton
                      type="button"
                      onClick={() =>
                        deleteAssignRemote(
                          r.admin_id,
                          r.class_code
                        )
                      }
                    >
                      Delete
                    </DangerButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          </div>
        )}
      </div>

      <SysAdminClassCodes
        token={token}
        onClassesChanged={reloadAvailableClasses}
      />

      <DeleteAdminConfirmModal
        admin={adminToDelete}
        confirming={deletingAdmin}
        onCancel={() => {
          if (!deletingAdmin) setAdminToDelete(null);
        }}
        onConfirm={handleConfirmDeleteAdmin}
      />
    </>
  );
};

export default SysAdminDashboard;
