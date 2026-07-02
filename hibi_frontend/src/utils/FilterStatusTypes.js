// for Admins they can approve , reject and escalate any request
export const FilterStatusTypesForProcessing = (statusTypes) => {
    const Filtered = statusTypes?.filter((item , i) => 
        item?.statusType === "ACCEPTED" || 
        item?.statusType === "REJECTED" || 
        item?.statusType === "ESCALATED"
    );
    return Filtered;
};

// for SuperAdmins they can only approve , reject any request
export const FilterStatusTypesForCEOandCOO = (statusTypes) => {
    const Filtered = statusTypes.filter((item , i) => 
        item?.statusType === "ACCEPTED" || 
        item?.statusType === "REJECTED"
    );
    return Filtered;
};

// Filters for recent requests like permissions etc
export const FilterStatusTypesForDropdown = (statusTypes) => {
    const list = ["ACCEPTED", "REJECTED", "CANCELLED"];
    return statusTypes.filter(
        (item) => list.includes(item?.label?.toUpperCase())
    );
};

// attendance Status types for adding attendance only firsthalf , secondhalf and fullday need to be added
export const FilterAttendanceStatusTypesForAddingAttendance = (statusTypes) => {
    const list = ["firsthalf", "secondhalf", "fullday"];
    return statusTypes.filter(
        (item) => list.includes(item?.name?.toLowerCase()?.split(" ").join(""))
    );
};