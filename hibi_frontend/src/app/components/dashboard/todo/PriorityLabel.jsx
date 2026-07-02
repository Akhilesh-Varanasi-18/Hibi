"use client";
import React from "react";
import { getPriorityDetails } from "./priorityStore"; // import function to get priority information

// Displays a label with appropriate styling for the given priority
const PriorityLabel = ({ priority }) => {
  const { label, className } = getPriorityDetails(priority); // get label and css class for this priority
  if (!label) return null; // do nothing if no priority label found

  return <span className={className}>{label}</span>; // render the styled priority label
};

export default PriorityLabel;
