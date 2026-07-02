"use client"
import React from 'react'
import { DynamicFormDialog } from '../../ReusableComponents/DynamicFormDialog';
import { AssetsAPI } from '@/Apis/AssetsApi';
import { showToast } from '@/lib/ToastService';

const UpdateOrganizationAssests = () => {
  // Configuration for the dynamic form dialog
  const formConfig = {
    Title: "Update Organization Assets",
    Desc: "Upload your organization's logo, stamp, and banner assets below.",
    DialogLabel: " Update Organization Assets",
    submitLabel: "Update Assets",
    DialogVariant: "default",
    onSubmit: async (formData) => {
      try {
        const res = await AssetsAPI.UpdateAssets(formData);
        if (res.success) {
          showToast(res?.message || "Console logged successfully", "success");
        } else {
          showToast(res?.error || "Failed to update organization assets", "error");
        }
      } catch (error) {
        showToast(res?.error || "Failed to update organization assets", "error");
      }
    },

    // Only three file fields for assets - orgLogo, orgStamp, orgBanner
    Fields: [
      {
        name: "orgLogo",
        type: "file",
        label: "Organization Logo",
        required: false,
        fileType: "image",
        maxSize: 5, // MB
        allowedTypes: [
          "image/png",
          "image/jpeg",
          "image/jpg",
          "image/svg+xml",
          "image/webp"
        ],
        validate: (file) => {
          if (!file) return "Logo is required";
          const allowed = [
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/svg+xml",
            "image/webp"
          ];
          if (!allowed.includes(file.type)) {
            return "Accepted formats: PNG, JPG, JPEG, SVG, WEBP";
          }
          if (file.size / (1024 * 1024) > 5) {
            return "File size should not exceed 5MB";
          }
          return true;
        },
        errorMessage: "Valid logo image is required"
      },
      {
        name: "orgStamp",
        type: "file",
        label: "Organization Stamp",
        required: false,
        fileType: "image",
        maxSize: 5, // MB
        allowedTypes: [
          "image/png",
          "image/jpeg",
          "image/jpg",
          "image/svg+xml",
          "image/webp"
        ],
        validate: (file) => {
          if (!file) return "Stamp is required";
          const allowed = [
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/svg+xml",
            "image/webp"
          ];
          if (!allowed.includes(file.type)) {
            return "Accepted formats: PNG, JPG, JPEG, SVG, WEBP";
          }
          if (file.size / (1024 * 1024) > 5) {
            return "File size should not exceed 5MB";
          }
          return true;
        },
        errorMessage: "Valid stamp image is required"
      },
      {
        name: "orgBanner",
        type: "file",
        label: "Organization Banner",
        required: false,
        fileType: "image",
        maxSize: 5, // MB
        allowedTypes: [
          "image/png",
          "image/jpeg",
          "image/jpg",
          "image/svg+xml",
          "image/webp"
        ],
        validate: (file) => {
          if (!file) return "Banner is required";
          const allowed = [
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/svg+xml",
            "image/webp"
          ];
          if (!allowed.includes(file.type)) {
            return "Accepted formats: PNG, JPG, JPEG, SVG, WEBP";
          }
          if (file.size / (1024 * 1024) > 5) {
            return "File size should not exceed 5MB";
          }
          return true;
        },
        errorMessage: "Valid banner image is required"
      }
    ]
  };
  return (
    <DynamicFormDialog config={formConfig} />
  )
}

export default UpdateOrganizationAssests