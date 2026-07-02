// useDownload.js - MODIFIED

import { useState } from 'react';
import axiosInstance from '@/config/axiosConfig';

const useDownload = (apiPath, method = 'post', defaultPayload = {}, defaultFilename = "download.xlsx") => {
  // Keep an internal state for button-specific UI (like disabling)
  const [buttonLoading, setButtonLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Function to trigger the file download.
   * @param {object} specificPayload Optional payload to merge with the default.
   * @param {function} externalSetLoading Optional setter function for external state management.
   */
  const handleDownload = async (specificPayload = {}, externalSetLoading = () => {}) => {
    setButtonLoading(true);
    externalSetLoading(true); // Update external state
    setError(null);

    try {
      const finalPayload = { ...defaultPayload, ...specificPayload };
      const config = { responseType: 'blob' };
      let response;

      if (method.toLowerCase() === 'get') {
        response = await axiosInstance.get(apiPath, { ...config, params: finalPayload });
      } else {
        response = await axiosInstance.post(apiPath, finalPayload, config);
      }

      // ... (Rest of the download logic remains the same: filename extraction, blob creation, trigger download)

      let filename = defaultFilename;
      const disposition = response.headers['content-disposition'];
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Download failed:", err);
      setError(err);
    } finally {
      setButtonLoading(false);
      externalSetLoading(false); // Update external state
    }
  };

  return { handleDownload, downloadLoading: buttonLoading, error };
};

export default useDownload;