import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  ClassSelector,
  PrimaryButton,
  DangerButton,
} from "./AdminStyles";
import AdminStatusBanner from "./AdminStatusBanner";
import {
  fetchMyClasses,
  fetchGroups,
  saveGroups,
  fetchQuestions,
  saveQuestions,
  downloadData,
} from "../../store/admin/admin-Actions";

const normalizeClassCodes = (list) => {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => {
      if (typeof item === "string" || typeof item === "number") {
        return String(item);
      }
      if (item && item.class_code != null) {
        return String(item.class_code);
      }
      return null;
    })
    .filter(Boolean);
};

const pickFilename = (contentDisposition, fallback) => {
  if (!contentDisposition) return fallback;
  const star = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (star) return decodeURIComponent(star[1]);
  const plain = contentDisposition.match(/filename="([^"]+)"/i);
  if (plain) return plain[1];
  const loose = contentDisposition.match(/filename=([^;]+)/i);
  return loose ? loose[1].trim().replace(/"/g, "") : fallback;
};

const triggerBlobDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const GroupsTable = ({ classCode, token, dispatch, onSaveSuccess }) => {
  const [rows, setRows] = useState([]);
  const [savedAt, setSavedAt] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const classCodeRef = useRef(classCode);
  classCodeRef.current = classCode;
  const newRowSeq = useRef(0);

  const load = useCallback(async (opts = {}) => {
    const silent = Boolean(opts.silent);
    const requestedClass = classCode;
    if (!requestedClass || !token) return;
    if (!silent) {
      setLoading(true);
      setError("");
    }
    try {
      const data = await dispatch(fetchGroups(token, requestedClass));
      if (classCodeRef.current !== requestedClass) return;
      setRows(
        (data || []).map((g) => ({
          id: g.id,
          number: g.number,
          name: g.name,
        }))
      );
    } catch (e) {
      if (classCodeRef.current === requestedClass) {
        setError(e.message || "Failed to load groups");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [classCode, token, dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  const updateRow = (idx, field, value) => {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
    );
  };

  const addRow = () => {
    newRowSeq.current += 1;
    setRows((prev) => [
      ...prev,
      { clientId: `g-new-${newRowSeq.current}`, number: "", name: "" },
    ]);
  };

  const deleteRow = (idx) =>
    setRows((prev) => prev.filter((_, i) => i !== idx));

  const save = async () => {
    setError("");
    const groups = rows.map((r) => {
      const num =
        r.number === "" || r.number == null ? null : Number(r.number);
      const base = { number: num, name: String(r.name || "") };
      if (r.id != null) return { id: r.id, ...base };
      return base;
    });
    const bad = groups.some(
      (g) =>
        g.number == null ||
        Number.isNaN(g.number) ||
        !String(g.name).trim()
    );
    if (bad) {
      setError("Each group needs a number and a non-empty name.");
      return;
    }
    const nums = groups.map((g) => g.number);
    if (new Set(nums).size !== nums.length) {
      setError("Group numbers must be unique within the class.");
      return;
    }
    try {
      const out = await dispatch(saveGroups(token, classCode, groups));
      setSavedAt(out.saved_at || "");
      await load({ silent: true });
      if (typeof onSaveSuccess === "function") onSaveSuccess();
    } catch (e) {
      setError(e.message || "Failed to save groups");
    }
  };

  return (
    <div className="admin-section">
      <h3>Groups</h3>
      {error ? (
        <div className="admin-message-area">
          <p className="admin-inline-msg admin-inline-msg--error" role="alert">
            {error}
          </p>
        </div>
      ) : null}
      {loading ? (
        <p className="admin-inline-msg admin-inline-msg--muted">Loading groups…</p>
      ) : (
        <>
          <div className="admin-section__data">
          <div className="admin-table-wrap">
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
                <tr
                  key={
                    row.id != null ? `id-${row.id}` : row.clientId || `g-${idx}`
                  }
                >
                  <td>{idx + 1}</td>
                  <td>
                    <input
                      type="number"
                      value={
                        row.number === "" || row.number == null
                          ? ""
                          : row.number
                      }
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
                  <td className="admin-table__action-cell">
                    <DangerButton type="button" onClick={() => deleteRow(idx)}>
                      Delete
                    </DangerButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          </div>
          <div className="admin-save-bar">
            <PrimaryButton type="button" onClick={addRow}>
              + Add Row
            </PrimaryButton>
            <PrimaryButton type="button" onClick={save}>
              Save
            </PrimaryButton>
            {savedAt ? (
              <span className="saved-timestamp">✓ Saved at {savedAt}</span>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
};

const QuestionsTable = ({ classCode, token, dispatch, onSaveSuccess }) => {
  const [rows, setRows] = useState([]);
  const [savedAt, setSavedAt] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (opts = {}) => {
    const silent = Boolean(opts.silent);
    if (!classCode || !token) return;
    if (!silent) {
      setLoading(true);
      setError("");
    }
    try {
      const data = await dispatch(fetchQuestions(token, classCode));
      setRows(
        (data || []).map((q) => ({
          id: q.id,
          number: q.number,
          description: q.description || "",
        }))
      );
    } catch (e) {
      setError(e.message || "Failed to load questions");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [classCode, token, dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  const updateRow = (idx, value) => {
    setRows((prev) =>
      prev.map((r, i) =>
        i === idx ? { ...r, description: value } : r
      )
    );
  };

  const deleteRow = (idx) =>
    setRows((prev) => prev.filter((_, i) => i !== idx));

  const addRow = () => {
    if (rows.length >= 3) return;
    setRows((prev) => [...prev, { description: "" }]);
  };

  const save = async () => {
    setError("");
    const questions = rows.map((r) => ({
      description: (r.description || "").trim(),
    }));
    if (questions.some((q) => !q.description)) {
      setError("Each question needs non-empty text (max 3).");
      return;
    }
    if (questions.length > 3) {
      setError("At most 3 questions.");
      return;
    }
    try {
      const out = await dispatch(
        saveQuestions(token, classCode, questions)
      );
      setSavedAt(out.saved_at || "");
      await load({ silent: true });
      if (typeof onSaveSuccess === "function") onSaveSuccess();
    } catch (e) {
      setError(e.message || "Failed to save questions");
    }
  };

  return (
    <div className="admin-section">
      <h3>Questions (max 3)</h3>
      {error ? (
        <div className="admin-message-area">
          <p className="admin-inline-msg admin-inline-msg--error" role="alert">
            {error}
          </p>
        </div>
      ) : null}
      {loading ? (
        <p className="admin-inline-msg admin-inline-msg--muted">
          Loading questions…
        </p>
      ) : (
        <>
          <div className="admin-section__data">
          <div className="admin-table-wrap">
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
                <tr key={row.id ?? `q-${idx}`}>
                  <td>{idx + 1}</td>
                  <td>
                    <input
                      type="text"
                      value={row.description}
                      onChange={(e) => updateRow(idx, e.target.value)}
                    />
                  </td>
                  <td className="admin-table__action-cell">
                    <DangerButton type="button" onClick={() => deleteRow(idx)}>
                      Delete
                    </DangerButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          </div>
          <div className="admin-save-bar">
            <PrimaryButton
              type="button"
              onClick={addRow}
              disabled={rows.length >= 3}
            >
              + Add Row
            </PrimaryButton>
            <PrimaryButton type="button" onClick={save}>
              Save
            </PrimaryButton>
            {savedAt ? (
              <span className="saved-timestamp">✓ Saved at {savedAt}</span>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
};

const Downloads = ({ classCode, token, dispatch }) => {
  const [selected, setSelected] = useState(["rate"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSelected(["rate"]);
    setError("");
    setLoading(false);
  }, [classCode]);

  const toggle = (ds) =>
    setSelected((prev) =>
      prev.includes(ds)
        ? prev.filter((d) => d !== ds)
        : [...prev, ds]
    );

  const options = ["rate", "user", "question_answer"];

  const download = async () => {
    if (!selected.length || !classCode) return;
    setError("");
    setLoading(true);
    const cc = classCode;
    try {
      const res = await dispatch(downloadData(token, cc, selected));
      const blob = await res.blob();
      const name = pickFilename(
        res.headers.get("Content-Disposition"),
        selected.length > 1 ? `r2r_data_${cc}.zip` : `${selected[0]}.csv`
      );
      triggerBlobDownload(blob, name);
    } catch (e) {
      setError(e.message || "Failed to download data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-section">
      <h3>Download Data</h3>
      {error ? (
        <div className="admin-message-area">
          <p className="admin-inline-msg admin-inline-msg--error" role="alert">
            {error}
          </p>
        </div>
      ) : null}
      <div className="admin-download-options">
        {options.map((ds) => (
          <label key={ds}>
            <input
              type="checkbox"
              checked={selected.includes(ds)}
              onChange={() => toggle(ds)}
            />
            {ds}
          </label>
        ))}
      </div>
      <div className="admin-download-toolbar">
        <PrimaryButton
          type="button"
          onClick={download}
          disabled={!selected.length || loading}
        >
          {loading
            ? "Preparing..."
            : selected.length > 1
            ? "Download ZIP"
            : "Download CSV"}
        </PrimaryButton>
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

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classesError, setClassesError] = useState("");
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [pageSuccess, setPageSuccess] = useState("");

  useEffect(() => {
    if (!pageSuccess) return undefined;
    const t = window.setTimeout(() => setPageSuccess(""), 5000);
    return () => window.clearTimeout(t);
  }, [pageSuccess]);

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
    }
  }, [token, navigate]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoadingClasses(true);
      setClassesError("");
      try {
        const list = await dispatch(fetchMyClasses(token));
        if (cancelled) return;
        setClasses(normalizeClassCodes(list || []));
      } catch (e) {
        if (!cancelled) {
          setClassesError(e.message || "Failed to load classes");
          setClasses([]);
        }
      } finally {
        if (!cancelled) setLoadingClasses(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, dispatch]);

  useEffect(() => {
    if (!classes.length) {
      setSelectedClass(null);
      return;
    }
    if (!selectedClass || !classes.includes(selectedClass)) {
      setSelectedClass(classes[0]);
    }
  }, [classes, selectedClass]);

  useEffect(() => {
    setPageSuccess("");
  }, [selectedClass]);

  const notifySaveSuccess = () => {
    setPageSuccess("Changes saved successfully.");
  };

  return (
    <>
      {pageSuccess ? (
        <AdminStatusBanner message={pageSuccess} />
      ) : null}
      <div className="admin-section">
        <h3>Class Admin</h3>

        {loadingClasses ? (
          <p className="admin-inline-msg admin-inline-msg--muted">
            Loading classes…
          </p>
        ) : classesError ? (
          <div className="admin-message-area">
            <p className="admin-inline-msg admin-inline-msg--error" role="alert">
              {classesError}
            </p>
          </div>
        ) : classes.length === 0 ? (
          <p className="admin-inline-msg admin-inline-msg--muted">
            No classes assigned to this admin.
          </p>
        ) : (
          <div className="admin-class-picker">
            <ClassSelector
              value={selectedClass || ""}
              onChange={(e) => setSelectedClass(e.target.value || null)}
            >
              {classes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </ClassSelector>
          </div>
        )}
      </div>

      {token && selectedClass && classes.includes(selectedClass) && (
        <>
          <GroupsTable
            key={`groups-${selectedClass}`}
            classCode={selectedClass}
            token={token}
            dispatch={dispatch}
            onSaveSuccess={notifySaveSuccess}
          />
          <QuestionsTable
            key={`questions-${selectedClass}`}
            classCode={selectedClass}
            token={token}
            dispatch={dispatch}
            onSaveSuccess={notifySaveSuccess}
          />
          <Downloads
            classCode={selectedClass}
            token={token}
            dispatch={dispatch}
          />
          <AnalysisPlaceholder />
        </>
      )}
    </>
  );
};

export default CourseAdminDashboard;
