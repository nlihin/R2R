import { loginAdmin } from "./admin-Slice";
import { BaseURL } from "../../routes/url";

const jsonHeaders = (token) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export const fetchAdminLogin = (adminId, password) => async (dispatch) => {
  const res = await fetch(`${BaseURL}admin/login`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ admin_id: adminId, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.msg || "Login failed");
  }
  dispatch(
    loginAdmin({
      token: data.access_token,
      role: data.role,
      mustChangePassword: data.must_change_password,
      adminId: data.admin_id,
      adminUsername: data.admin_username,
    })
  );
  return data;
};

export const fetchAdminMe = (token) => async () => {
  const res = await fetch(`${BaseURL}admin/me`, {
    method: "GET",
    headers: jsonHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.msg || "Failed to load admin profile");
  }
  return data;
};

export const changeAdminPassword =
  (token, currentPassword, newPassword) => async (dispatch) => {
    const res = await fetch(`${BaseURL}admin/change-password`, {
      method: "POST",
      headers: jsonHeaders(token),
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.msg || "Password change failed");
    }
    if (data.access_token) {
      dispatch(
        loginAdmin({
          token: data.access_token,
          role: data.role,
          mustChangePassword: Boolean(data.must_change_password),
          adminId: data.admin_id,
          adminUsername: data.admin_username,
        })
      );
    }
    return data;
  };

export const fetchMyClasses = (token) => async () => {
  const res = await fetch(`${BaseURL}admin/my-classes`, {
    method: "GET",
    headers: jsonHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.msg || "Failed to load classes");
  }
  return data.data || [];
};

export const fetchClassSettings = (token, classCode) => async () => {
  const res = await fetch(
    `${BaseURL}admin/classes/${classCode}/settings`,
    {
      method: "GET",
      headers: jsonHeaders(token),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.msg || "Failed to load class settings");
  }
  return data;
};

export const saveClassSettings = (token, classCode, btsEnabled) => async () => {
  const res = await fetch(
    `${BaseURL}admin/classes/${classCode}/settings`,
    {
      method: "POST",
      headers: jsonHeaders(token),
      body: JSON.stringify({ bts_enabled: Boolean(btsEnabled) }),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.msg || "Failed to save class settings");
  }
  return data;
};

export const fetchAdmins = (token) => async () => {
  const res = await fetch(`${BaseURL}admin/admins`, {
    method: "GET",
    headers: jsonHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.msg || "Failed to load admins");
  }
  return data.data || [];
};

export const createAdmin = (token, payload) => async () => {
  const res = await fetch(`${BaseURL}admin/admins`, {
    method: "POST",
    headers: jsonHeaders(token),
    body: JSON.stringify({
      admin_username: payload.admin_username,
      admin_email: payload.admin_email,
      role: payload.role || "courseadmin",
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.msg || "Failed to create admin");
  }
  return data;
};

export const updateAdmin = (token, adminId, payload) => async () => {
  const res = await fetch(`${BaseURL}admin/admins/${adminId}`, {
    method: "PUT",
    headers: jsonHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.msg || "Failed to update admin");
  }
  return data;
};

export const resetAdminPassword = (token, adminId) => async () => {
  const res = await fetch(`${BaseURL}admin/admins/${adminId}/reset-password`, {
    method: "POST",
    headers: jsonHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.msg || "Failed to reset password");
  }
  return data;
};

export const deleteAdmin = (token, adminId) => async () => {
  const res = await fetch(`${BaseURL}admin/admins/${adminId}`, {
    method: "DELETE",
    headers: jsonHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.msg || "Failed to delete admin");
  }
  return data;
};

export const fetchAdminClassesAssignments = (token) => async () => {
  const res = await fetch(`${BaseURL}admin/admin-classes`, {
    method: "GET",
    headers: jsonHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.msg || "Failed to load assignments");
  }
  return data.data || [];
};

export const assignClassToAdmin = (token, adminId, classCode) => async () => {
  const res = await fetch(`${BaseURL}admin/admin-classes`, {
    method: "POST",
    headers: jsonHeaders(token),
    body: JSON.stringify({ admin_id: adminId, class_code: classCode }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.msg || "Failed to assign class");
  }
  return data;
};

export const removeClassAssignment = (token, adminId, classCode) => async () => {
  const res = await fetch(
    `${BaseURL}admin/admin-classes/${adminId}/${classCode}`,
    {
      method: "DELETE",
      headers: jsonHeaders(token),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.msg || "Failed to remove assignment");
  }
  return data;
};

export const fetchAvailableClasses = (token) => async () => {
  const res = await fetch(`${BaseURL}admin/available-classes`, {
    method: "GET",
    headers: jsonHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.msg || "Failed to load classes");
  }
  return data.data || [];
};

export const fetchClassCodes = (token) => async () => {
  const res = await fetch(`${BaseURL}admin/classes`, {
    method: "GET",
    headers: jsonHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.msg || "Failed to load class codes");
  }
  return data.data || [];
};

export const createClassCode = (token, payload) => async () => {
  const res = await fetch(`${BaseURL}admin/classes`, {
    method: "POST",
    headers: jsonHeaders(token),
    body: JSON.stringify({
      class_code: payload.class_code,
      bts_enabled: payload.bts_enabled,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.msg || "Failed to create class code");
  }
  return data;
};

export const deleteClassCode = (token, classCode) => async () => {
  const res = await fetch(
    `${BaseURL}admin/classes/${encodeURIComponent(classCode)}`,
    {
      method: "DELETE",
      headers: jsonHeaders(token),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.msg || "Failed to delete class code");
  }
  return data;
};

export const fetchGroups = (token, classCode) => async () => {
  const res = await fetch(`${BaseURL}admin/classes/${classCode}/groups`, {
    method: "GET",
    headers: jsonHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.msg || "Failed to load groups");
  }
  return data.data || [];
};

export const saveGroups = (token, classCode, groups) => async () => {
  const res = await fetch(`${BaseURL}admin/classes/${classCode}/groups`, {
    method: "POST",
    headers: jsonHeaders(token),
    body: JSON.stringify({ groups }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.msg || "Failed to save groups");
  }
  return data;
};

export const downloadGroupsTemplate = (token, classCode) => async () => {
  const res = await fetch(
    `${BaseURL}admin/classes/${classCode}/groups/csv-template`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.msg || "Failed to download template");
  }
  return res;
};

export const importGroupsCSV = (token, classCode, file) => async () => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(
    `${BaseURL}admin/classes/${classCode}/groups/import-csv`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.msg || "Failed to import CSV");
  }
  return data;
};

export const fetchQuestions = (token, classCode) => async () => {
  const res = await fetch(`${BaseURL}admin/classes/${classCode}/questions`, {
    method: "GET",
    headers: jsonHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.msg || "Failed to load questions");
  }
  return data.data || [];
};

export const saveQuestions = (token, classCode, questions) => async () => {
  const res = await fetch(`${BaseURL}admin/classes/${classCode}/questions`, {
    method: "POST",
    headers: jsonHeaders(token),
    body: JSON.stringify({ questions }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.msg || "Failed to save questions");
  }
  return data;
};

export const downloadData = (token, classCode, datasets) => async () => {
  const res = await fetch(`${BaseURL}admin/classes/${classCode}/download`, {
    method: "POST",
    headers: jsonHeaders(token),
    body: JSON.stringify({ datasets }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.msg || "Failed to download data");
  }
  return res;
};