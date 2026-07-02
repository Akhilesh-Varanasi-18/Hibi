// Stores the config for each priority level: label and associated styling classes
export const priorityData = {
  LOW: {
    label: "Low Priority",
    className: "bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-semibold ml-2", // Green shade for low
  },
  MEDIUM: {
    label: "Medium Priority",
    className: "bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-semibold ml-2", // Yellow for medium
  },
  HIGH: {
    label: "High Priority",
    className: "bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-semibold ml-2", // Red for high
  },
};

// Returns the display label and className for a given priority type
export const getPriorityDetails = (priority) => {
  if (!priority) return { label: "", className: "" }; // For undefined/empty priorities
  const key = priority.toUpperCase(); // Make case-insensitive
  return priorityData[key] || { label: "", className: "" }; // Return default if unknown
};