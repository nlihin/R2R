import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logoutAdmin } from "../../store/admin/admin-Slice";
import {
  PrimaryButton,
  DangerButton,
  ErrorMsg,
} from "./AdminStyles";
import {
  fetchAdmins,
  createAdmin,
  updateAdmin,
  resetAdminPassword,
  fetchAdminClassesAssignments,
  assignClassToAdmin,
  removeClassAssignment,
  fetchAvailableClasses,
} from "../../store/admin/admin-Actions";

const SysAdminDashboard = () => {
  const adminState = useSelector((s) => s.admin || {});
  const token =
    adminState.token || localStorage.getItem("adminToken") || null;

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

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }
    let cancelled = false;

    const load = async () => {
      setError("");
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

  const handleLogout = () => {
    dispatch(logoutAdmin());
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRole");
    navigate("/admin/login");
  };

  const updateEdit = (admin_id, field, value) => {
    setEditAdmins((prev) => ({
      ...prev,
      [admin_id]: {
        ...prev[admin_id],
        [field]: field === "is_active" ? value === "true" : value,
      },
    }));
  };

  const saveAdminRemote = async (admin_id) => {
    setError("");
    const payload = editAdmins[admin_id];
    if (!payload) return;
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
    } catch (e) {
      setError(e.message || "Failed to save admin");
    }
  };

  const handleResetPassword = async (admin_id) => {
    setError("");
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
    setLastTemp(null);
    if (!newAdminName || !newAdminEmail) {
      setError("Username and email are required");
      return;
    }
    try {
      const data = await dispatch(
        createAdmin(token, {
          admin_username: newAdminName,
          admin_email: newAdminEmail,
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
    } catch (e) {
      setError(e.message || "Failed to create admin");
    }
  };

  const addAssignRemote = async () => {
    setError("");
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

  const deleteAssignRemote = async (admin_id, class_code) => {
    setError("");
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
      <div
        className="admin-section"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3>Course Admins</h3>
        <button onClick={handleLogout}>Logout</button>
      </div>
      <div className="admin-section">
        {error && <ErrorMsg>{error}</ErrorMsg>}
        <div
          style={{
            marginBottom: "0.5rem",
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            placeholder="Username"
            value={newAdminName}
            onChange={(e) => setNewAdminName(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
          />
          <select
            value={newAdminRole}
            onChange={(e) => setNewAdminRole(e.target.value)}
          >
            <option value="courseadmin">courseadmin</option>
            <option value="sysadmin">sysadmin</option>
          </select>
          <PrimaryButton onClick={createAdminRemote}>
            Create admin
          </PrimaryButton>
        </div>
        {lastTemp && (
          <div style={{ fontSize: 14, marginBottom: "0.5rem" }}>
            New/updated admin: ID {lastTemp.admin_id}, temp password{" "}
            <code>{lastTemp.temp_password}</code>
          </div>
        )}
        {loadingAdmins ? (
          <div>Loading admins...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Admin ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>is_active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => {
                const e = editAdmins[a.admin_id] || {};
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
                      />
                    </td>
                    <td>
                      <select
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
                    <td>
                      <select
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
                    <td>
                      <PrimaryButton
                        onClick={() => saveAdminRemote(a.admin_id)}
                      >
                        Save
                      </PrimaryButton>
                      <PrimaryButton
                        onClick={() =>
                          handleResetPassword(a.admin_id)
                        }
                      >
                        Reset password
                      </PrimaryButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="admin-section" style={{ marginTop: "2rem" }}>
        <h3>Assign classes to admins</h3>
        <div
          style={{
            marginBottom: "0.5rem",
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <select
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
          <PrimaryButton onClick={addAssignRemote}>
            Add assignment
          </PrimaryButton>
        </div>
        {loadingAssigns ? (
          <div>Loading assignments...</div>
        ) : (
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
                  <td>
                    <DangerButton
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
        )}
      </div>
    </>
  );
};

export default SysAdminDashboard;