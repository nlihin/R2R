import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logoutAdmin } from "../../store/admin/admin-Slice";
import {
  ClassSelector,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
} from "./AdminStyles";
import { BaseURL } from "../../routes/url";

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});


const GroupsTable = ({ classCode, token }) => {
  const [rows, setRows] = useState([]);
  const [savedAt, setSavedAt] = useState("");

  useEffect(() => {
    if (!classCode || !token) return;
    setRows([
      { number: 1, name: "Group 1" },
      { number: 2, name: "Group 2" },
      { number: 3, name: "Group 3" },
    ]);
  }, [classCode, token]);

  const updateRow = (idx, field, value) => {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
    );
  };

  const addRow = () =>
    setRows((prev) => [...prev, { number: "", name: "" }]);

  const deleteRow = (idx) =>
    setRows((prev) => prev.filter((_, i) => i !== idx));

  const save = async () => {
    const now = new Date().toLocaleTimeString();
    setSavedAt(now);
  };

  const downloadTemplate = () => {
    window.open("#", "_blank");
  };

  const importCSV = async () => {
    return;
  };

  return (
    <div className="admin-section">
      <h3>Groups</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Group Number</th>
            <th>Group Name</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              <td>{idx + 1}</td>
              <td>
                <input
                  type="number"
                  value={row.number}
                  onChange={(e) =>
                    updateRow(idx, "number", e.target.value)
                  }
                />
              </td>
              <td>
                <input
                  type="text"
                  value={row.name}
                  onChange={(e) =>
                    updateRow(idx, "name", e.target.value)
                  }
                />
              </td>
              <td>
                <DangerButton onClick={() => deleteRow(idx)}>
                  Delete
                </DangerButton>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="admin-save-bar">
        <PrimaryButton onClick={addRow}>+ Add Row</PrimaryButton>
        <PrimaryButton onClick={save}>Save</PrimaryButton>
        {/* <SecondaryButton onClick={downloadTemplate}>
          CSV Template
        </SecondaryButton> */}
        {/* <label style={{ cursor: "pointer" }}>
          <SecondaryButton as="span">Import CSV</SecondaryButton>
          <input
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={importCSV}
          />
        </label> */}
        {savedAt && (
          <span className="saved-timestamp">
            ✓ Saved at {savedAt}
          </span>
        )}
      </div>
    </div>
  );
};

const QuestionsTable = ({ classCode, token }) => {
  const [rows, setRows] = useState([]);
  const [savedAt, setSavedAt] = useState("");

  useEffect(() => {
    if (!classCode || !token) return;
    setRows([
      { description: "Question1?" },
      { description: "Question2?" },
      { description: "Question3?" },
    ]);
  }, [classCode, token]);

  const updateRow = (idx, value) => {
    setRows((prev) =>
      prev.map((r, i) =>
        i === idx ? { ...r, description: value } : r
      )
    );
  };

  const deleteRow = (idx) =>
    setRows((prev) => prev.filter((_, i) => i !== idx));

  const save = async () => {
    const now = new Date().toLocaleTimeString();
    setSavedAt(now);
  };

  return (
    <div className="admin-section">
      <h3>Questions (max 3)</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Question Text</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              <td>{idx + 1}</td>
              <td>
                <input
                  type="text"
                  value={row.description}
                  onChange={(e) => updateRow(idx, e.target.value)}
                />
              </td>
              <td>
                <DangerButton onClick={() => deleteRow(idx)}>
                  Delete
                </DangerButton>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="admin-save-bar">
        <PrimaryButton onClick={save}>Save</PrimaryButton>
        {savedAt && (
          <span className="saved-timestamp">
            ✓ Saved at {savedAt}
          </span>
        )}
      </div>
    </div>
  );
};

const Downloads = ({ classCode }) => {
  const [selected, setSelected] = useState(["rate"]);
  const [loading, setLoading] = useState(false);

  const toggle = (ds) =>
    setSelected((prev) =>
      prev.includes(ds)
        ? prev.filter((d) => d !== ds)
        : [...prev, ds]
    );

  const options = ["rate", "user", "question_answer"];

  const download = async () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 600);
  };

  return (
    <div className="admin-section">
      <h3>Download Data</h3>
      <div
        style={{
          display: "flex",
          gap: "1.5rem",
          marginBottom: "1rem",
        }}
      >
        {options.map((ds) => (
          <label
            key={ds}
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <input
              type="checkbox"
              checked={selected.includes(ds)}
              onChange={() => toggle(ds)}
            />
            {ds}
          </label>
        ))}
      </div>
      <PrimaryButton
        onClick={download}
        disabled={!selected.length || loading}
      >
        {loading
          ? "Preparing..."
          : selected.length > 1
          ? "Download ZIP"
          : "Download CSV"}
      </PrimaryButton>
      <div style={{ marginTop: "0.5rem", fontSize: 12 }}>
        Demo for class {classCode}
      </div>
    </div>
  );
};

const AnalysisPlaceholder = () => (
  <div className="admin-section">
    <h3>Analysis</h3>
    <div className="placeholder-analysis">
      <p>Score generation will be available in a future release.</p>
      <PrimaryButton disabled>
        Generate Scores (Coming Soon)
      </PrimaryButton>
    </div>
  </div>
);


const CourseAdminDashboard = () => {
  const adminState = useSelector((s) => s.admin || {});
  const token =
    adminState.token || localStorage.getItem("adminToken") || null;

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const demoAdminId = "000000002";
  const demoClass = "256";

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }
  }, [token, navigate]);

  const handleLogout = () => {
    dispatch(logoutAdmin());
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRole");
    navigate("/admin/login");
  };

  return (
    <>
      <div className="admin-section">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3>Class Admin View</h3>
            <div style={{ fontSize: 12 }}>
              Demo admin_id: {demoAdminId}, class_code: {demoClass}
            </div>
          </div>
          <button onClick={handleLogout}>Logout</button>
        </div>

        <ClassSelector value={demoClass} disabled>
          <option value={demoClass}>{demoClass}</option>
        </ClassSelector>
      </div>

      {token && (
        <>
          <GroupsTable classCode={demoClass} token={token} />
          <QuestionsTable classCode={demoClass} token={token} />
          <Downloads classCode={demoClass} token={token} />
          <AnalysisPlaceholder />
        </>
      )}
    </>
  );
};

export default CourseAdminDashboard;
