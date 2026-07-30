import { useRef, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import "./CandidateUpload.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || ""
).replace(/\/$/, "");

export default function CandidateUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    setSelectedFile(file);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleUpload = async () => {
    setSuccessMessage("");
    setErrorMessage("");

    if (!selectedFile) {
      setErrorMessage("Please select a PDF file.");
      return;
    }

    const isPdf =
      selectedFile.type === "application/pdf" ||
      selectedFile.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setErrorMessage("Only PDF files are allowed.");
      return;
    }

    if (!API_BASE_URL) {
      setErrorMessage("VITE_API_BASE_URL is missing.");
      return;
    }

    try {
      setIsUploading(true);

      // 1. Get the current Cognito ID token
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();

      if (!idToken) {
        throw new Error("Unable to obtain Cognito ID token.");
      }

      // 2. Request an S3 presigned upload URL from Lambda
      const presignedResponse = await fetch(
        `${API_BASE_URL}/upload-url`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filename: selectedFile.name,
            size: selectedFile.size,
          }),
        }
      );

      const presignedData = await presignedResponse
        .json()
        .catch(() => ({}));

      if (!presignedResponse.ok) {
        throw new Error(
          presignedData.message ||
            `Unable to create upload URL (${presignedResponse.status}).`
        );
      }

      if (!presignedData.uploadUrl) {
        throw new Error("The API did not return an upload URL.");
      }

      // 3. Upload the PDF directly to private S3
      const s3Response = await fetch(presignedData.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/pdf",
        },
        body: selectedFile,
      });

      if (!s3Response.ok) {
        throw new Error(
          `S3 upload failed (${s3Response.status}).`
        );
      }

      setSuccessMessage(
        `${selectedFile.name} uploaded successfully.`
      );

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Upload failed."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="candidate-upload">
      <h2>Upload your resume</h2>

      <p className="upload-description">
        Select a PDF resume and upload it securely.
      </p>

      <input
        ref={fileInputRef}
        className="file-input"
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
        disabled={isUploading}
      />

      {selectedFile && (
        <div className="selected-file">
          <strong>Selected file:</strong> {selectedFile.name}
          <br />
          <strong>Size:</strong>{" "}
          {(selectedFile.size / 1024).toFixed(1)} KB
        </div>
      )}

      <button
        className="upload-button"
        type="button"
        onClick={handleUpload}
        disabled={!selectedFile || isUploading}
      >
        {isUploading ? "Uploading..." : "Upload resume"}
      </button>

      {successMessage && (
        <div className="upload-message success-message">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="upload-message error-message">
          {errorMessage}
        </div>
      )}
    </div>
  );
}