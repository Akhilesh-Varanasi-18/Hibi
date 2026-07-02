const productDefinedPrivileges = [
    "ULTIMATEADMIN",
    "SUPERADMIN",
    "ADMIN",
    "GENERAL"
];

const productDefinedRoles = [
    "ORGANIZATIONHEAD",
    "CEO",
    "HR",
    "MANAGER",
    "TEAM LEAD",
    "EMPLOYEE",
    "INTERN"
];

const productDefinedLeaveTypes = [
    "CASUAL",
    "SICK",
    "UNPAID",
    "EMERGENCY",
    "VACATION",
    "MATERNITY"
];

const productDefinedPermissionTypes = [
    "EARLYOUT",
    "LATEIN",
    "EMERGENCY",
    "GENERAL"
];

const productDefinedStatus = [
    "PENDING",
    "PROCESSING",
    "INACTIVE",
    "ACTIVE",
    "ACCEPTED",
    "REJECTED",
    "ESCALATED",
    "CANCELLED",
    "APPROVED",
    "ONHOLD",
    "CLOSED",
    "EXPIRED"
];

const productDefinedAttendenceStatus = {
    "ABSENT": "AB",
    "PRESENT": "PR",
    "FIRST HALF": "FH",
    "SECOND HALF": "SH",
    "WORK FROM HOME": "WFH",
    "FULL DAY": "FD"
};

const productDefinedLeaveConsiderations = {
    "CASUAL LEAVE": "CL",
    "ON DUTY": "OD",
    "LOSS OF PAY": "LOP",
    "BOTH CL & OD": "CL&OD",
    "VACATION": "VAC"
};

const productDefinedTripTypes = [
    "EVENT",
    "MEETING",
    "TRAINING",
    "CLIENT VISIT",
    "OTHER"
]

module.exports = {
    productDefinedPrivileges,
    productDefinedRoles,
    productDefinedStatus,
    productDefinedLeaveTypes,
    productDefinedPermissionTypes,
    productDefinedAttendenceStatus,
    productDefinedLeaveConsiderations,
    productDefinedTripTypes
};