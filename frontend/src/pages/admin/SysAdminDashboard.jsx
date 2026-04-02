import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logoutAdmin } from "../../store/admin/admin-Slice";
import {
  PrimaryButton,
  DangerButton,
  ErrorMsg,
} from "./AdminStyles";

const SysAdminDashboard = () => {
  const adminState = useSelector((s) => s.admin || {});
  const token =
    adminState.token || localStorage.getItem("adminToken") || null;

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [admins, setAdmins] = useState([
    {
      admin_id: "000000001",
      admin_username: "Sys Admin",
      admin_email: "sysadmin@example.com",
      role: "sysadmin",
      is_active: true,
    },
    {
      admin_id: "000000002",
      admin_username: "Course Admin",
      admin_email: "courseadmin@example.com",
      role: "courseadmin",
      is_active: true,
    },
  ]);
  const [assigns, setAssigns] = useState([
    { admin_id: "000000001", class_code: "056" },
    { admin_id: "000000002", class_code: "256" },
  ]);
  const [editAdmins, setEditAdmins] = useState({});
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPass, setNewAdminPass] = useState("");
  const [lastTemp, setLastTemp] = useState(null);
  const [newAssignAdminId, setNewAssignAdminId] = useState("");
  const [newAssignClassCode, setNewAssignClassCode] = useState("");
  const [error, setError] = useState("");

  const [availableClasses] = useState(["056", "126", "256"]);

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }
    const m = {};
    admins.forEach((a) => {
      m[a.admin_id] = {
        admin_username: a.admin_username,
        admin_email: a.admin_email,
        role: a.role,
        is_active: a.is_active,
      };
    });
    setEditAdmins(m);
  }, [token, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const saveAdminLocal = (admin_id) => {
    setError("");
    const payload = editAdmins[admin_id];
    if (!payload) return;
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
  };

  const deleteAdminLocal = (admin_id) => {
    setError("");
    setAdmins((prev) => prev.filter((a) => a.admin_id !== admin_id));
    setAssigns((prev) => prev.filter((r) => r.admin_id !== admin_id));
  };

  const createAdminLocal = () => {
    setError("");
    setLastTemp(null);
    if (!newAdminName || !newAdminEmail) {
      setError("Username and email are required");
      return;
    }
    const nextIdNum =
      admins.length > 0
        ? Math.max(...admins.map((a) => parseInt(a.admin_id, 10))) + 1
        : 1;
    const newId = String(nextIdNum).padStart(9, "0");
    const tempPassword = "Temp12345678";
    const newAdmin = {
      admin_id: newId,
      admin_username: newAdminName,
      admin_email: newAdminEmail,
      role: "courseadmin",
      is_active: true,
    };
    setAdmins((prev) => [...prev, newAdmin]);
    setEditAdmins((prev) => ({
      ...prev,
      [newId]: {
        admin_username: newAdminName,
        admin_email: newAdminEmail,
        role: "courseadmin",
        is_active: true,
      },
    }));
    setLastTemp({ admin_id: newId, temp_password: tempPassword });
    setNewAdminName("");
    setNewAdminEmail("");
    setNewAdminPass("");
  };

  const addAssignLocal = () => {
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
    if (!exists) {
      setAssigns((prev) => [
        ...prev,
        { admin_id: newAssignAdminId, class_code: newAssignClassCode },
      ]);
    }
    setNewAssignAdminId("");
    setNewAssignClassCode("");
  };

  const updateAssignClassLocal = (index, class_code) => {
    setAssigns((prev) =>
      prev.map((r, i) =>
        i === index ? { ...r, class_code } : r
      )
    );
  };

  const deleteAssignLocal = (index) => {
    setAssigns((prev) => prev.filter((_, i) => i !== index));
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
          <input
            type="text"
            placeholder="password"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
          />
          <PrimaryButton onClick={createAdminLocal}>
            Create admin
          </PrimaryButton>
        </div>
        {lastTemp && (
          <div style={{ fontSize: 14, marginBottom: "0.5rem" }}>
            New admin created: ID {lastTemp.admin_id}, temp password{" "}
            <code>{lastTemp.temp_password}</code>
          </div>
        )}
        <table className="admin-table">
          <thead>
            <tr>
              <th>Admin ID</th>
              <th>Password</th>
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
                  <td>hidden</td>
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
                        updateEdit(a.admin_id, "role", ev.target.value)
                      }
                    >
                      <option value="sysadmin">sysadmin</option>
                      <option value="courseadmin">courseadmin</option>
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
                      onClick={() => saveAdminLocal(a.admin_id)}
                    >
                      Save
                    </PrimaryButton>
                    <DangerButton
                      onClick={() => deleteAdminLocal(a.admin_id)}
                    >
                      Delete
                    </DangerButton>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="admin-section" style={{ marginTop: "2rem" }}>
        <h3>Assign classes to admins</h3>
        <div
          style={{
            marginBottom: "0.5rem",
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
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
            onChange={(e) => setNewAssignClassCode(e.target.value)}
          >
            <option value="">-- class_code --</option>
            {availableClasses.map((cc) => (
              <option key={cc} value={cc}>
                {cc}
              </option>
            ))}
          </select>
          <PrimaryButton onClick={addAssignLocal}>
            Add assignment
          </PrimaryButton>
        </div>
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
              <tr key={`${r.admin_id}-${idx}`}>
                <td>{r.admin_id}</td>
                <td>
                  <select
                    value={r.class_code}
                    onChange={(e) =>
                      updateAssignClassLocal(idx, e.target.value)
                    }
                  >
                    {availableClasses.map((cc) => (
                      <option key={cc} value={cc}>
                        {cc}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <PrimaryButton onClick={() => {}}>
                    Save
                  </PrimaryButton>
                  <DangerButton
                    onClick={() => deleteAssignLocal(idx)}
                  >
                    Delete
                  </DangerButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default SysAdminDashboard;
