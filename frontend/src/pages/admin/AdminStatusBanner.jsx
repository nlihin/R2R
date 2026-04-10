const AdminStatusBanner = ({ message }) => {
  if (!message) return null;
  return (
    <div
      className="admin-status-banner admin-status-banner--success"
      aria-live="polite"
      aria-atomic="true"
      tabIndex={-1}
    >
      {message}
    </div>
  );
};

export default AdminStatusBanner;
