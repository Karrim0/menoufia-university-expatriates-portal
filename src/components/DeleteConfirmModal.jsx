import React from "react";
import "./DeleteConfirmModal.css";

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  newsTitle,
  isLoading,
}) {
  if (!isOpen) return null;

  return (
    <div className="delete-modal-overlay">
      <div className="delete-modal">
        <h3>Are you sure?</h3>

        <p>
          Do you want to delete:
          <br />
          <strong>{newsTitle}</strong>
        </p>

        <div className="delete-modal-actions">
          <button
            className="cancel-btn"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>

          <button
            className="delete-btn"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}