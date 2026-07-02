export const ApproveConfig = {
  Title: "Approve Request",
  DialogLabel: "Approve",
  DialogVariant : "default",
  Desc: "This action is final. Please review carefully before approving.",
  submitLabel: "Approve",
  submitVariant: "default",
  Fields: []
};
export const CancelConfig = {
  Title: "Cancel Request",
  DialogLabel: "Cancel",
  DialogVariant : "destructive",
  Desc: "Are you sure you want to cancel this request? This action cannot be undone.",
  submitLabel: "Confirm",
  submitVariant: "destructive",
  Fields: []
};

export const RejectConfig = {
  Title: "Reject Request",
  DialogLabel: "Reject",
  DialogVariant : "destructive",
  Desc: "Please provide a reason for rejecting this request. This action is final.",
  submitLabel: "Reject",
  submitVariant: "destructive",
  Fields: [
    {
      name: "actionReason",
      type: "textarea",
      label: "Reason for Rejection",
      placeholder: "Please explain why you are rejecting this request...",
      takeFullWidth: true,
      rows: 5,
      required: true,
      errorMessage: "A reason is required to reject a request.",
      validate: (value) => {
        if (!value || value.trim() === "") {
          return "A reason is required to reject a request.";
        }
        if (value.length > 500) {
          return "Maximum 500 characters allowed";
        }
        return true;
      }
    },
  ]
};
export const EscalateConfig = {
  Title: "Escalate Request",
  DialogLabel: "Escalate",
  DialogVariant: "outline",
  Desc: "Please provide a reason for escalating this request. This action will notify higher authorities.",
  submitLabel: "Escalate",
  submitVariant: "outline",
  Fields: [
    {
      name: "actionReason",
      type: "textarea",
      label: "Reason for Escalation",
      placeholder: "Please explain why you are escalating this request...",
      takeFullWidth: true,
      rows: 5,
      required: true,
      errorMessage: "A reason is required to escalate a request.",
      validate: (value) => {
        if (!value || value.trim() === "") {
          return "A reason is required to escalate a request.";
        }
        if (value.length > 500) {
          return "Maximum 500 characters allowed";
        }
        return true;
      }
    },
  ]
};