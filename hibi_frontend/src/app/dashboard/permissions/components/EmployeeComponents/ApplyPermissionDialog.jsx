"use client";
import React from "react";
import GeneralPermissionForm from "./GeneralPermissionForm";
import EarlyOutPermissionForm from "./EarlyOutPermissionForm";
import LateInPermissionForm from "./LateInPermissionForm";
import EmergencyPermissionForm from "./EmergencyPermissionForm";

// we are showing separate forms based on permissionType
const ApplyPermissionDialog = ({ id, refresh, permissionType, shiftDetails }) => {
  switch (permissionType) {
    case "GENERAL":
      return <GeneralPermissionForm id={id} refresh={refresh} shiftDetails={shiftDetails} />;
    case "EARLYOUT":
      return <EarlyOutPermissionForm id={id} refresh={refresh} shiftDetails={shiftDetails} />;
    case "LATEIN":
      return <LateInPermissionForm id={id} refresh={refresh} shiftDetails={shiftDetails} />;
    case "EMERGENCY":
      return <EmergencyPermissionForm id={id} refresh={refresh} shiftDetails={shiftDetails} />;
    default:
      return null;
  }
};

export default ApplyPermissionDialog;
