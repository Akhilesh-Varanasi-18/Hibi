import React from 'react'
import SampleTemplate from '../dashboard/payslips/Components/sampleTemplate'

const page = () => {
    const config = {
        Title: "Approve Request",
        DialogLabel: "Approve",
        Desc : "You cannot revoke this action . so make sure to do this correctly.",
        submitLabel : "Approve",
        submitVariant : "default",
        onSubmit: (data) => {
          console.log("Form data:", data);
        //   alert("Form submitted!");
        },
        Fields: [
          {
            name: "name",
            type: "multitext",
            label: "Your Name",
            required: true,
            errorMessage: "Name is required"
          },
          // {
          //   name: "email",
          //   type: "email",
          //   label: "Your Email",
          //   required: true,
          //   errorMessage: "Email is required"
          // },
          // {
          //   name: "age",
          //   type: "number",
          //   label: "Age",
          //   placeholder: "25",
          //   required: true,
          //   validate: (value) => {
          //     if (value < 18) return "Must be at least 18";
          //     if (value > 65) return "Must be under 65";
          //     return true;
          //   },
          //   errorMessage: "Age is required"
          // },
          {
            name: "role",
            type: "select",
            multiselect : true,
            showSearch : true,
            label: "Select Role",
            placeholder: "Choose a role",
            required: true,
            array: [
              { _id: "1", name: "Admin" },
              { _id: "2", name: "Manager" },
              { _id: "3", name: "Employee" }
            ],
            errorMessage: "Role is required"
          },
          {
            name: "FromTo",
            type: "multicalendar",
            label: "Select Leave From and To",
            DateStartName : "startDate",
            DateEndName : "endDate",
            required: true,
            showFrom: new Date(1960, 0, 1),  // Jan 1, 1960
            showTo: new Date(2006, 11, 31),  // Dec 31, 2006
            errorMessage: "Please select your date of birth"
          },
          {
            name: "Time",
            type: "time",
            label: "Select Time",
            startFrom : "10:30",
            endFrom : "13:30",
            required: true,
            errorMessage: "Please select your date of birth"
          },
          // {
          //   name: "resume",
          //   type: "file",
          //   label: "Upload Resume",
          //   required: true,
          //   fileType: "image",  // or omit for all file types
          //   maxSize: 5,  // MB
          //   validate: (file) => {
          //     const allowed = ["application/pdf", "image/jpeg", "image/png"];
          //     if (!allowed.includes(file.type)) {
          //       return "Only PDF, JPEG, and PNG files allowed";
          //     }
          //     return true;
          //   },
          //   errorMessage: "Resume is required"
          // },
          // {
          //   name: "description",
          //   type: "textarea",
          //   label: "Description",
          //   placeholder: "Tell us about yourself...",
          //   takeFullWidth : true ,
          //   rows: 5,
          //   required: false,
          //   validate: (value) => {
          //     if (value && value.length > 500) {
          //       return "Maximum 500 characters allowed";
          //     }
          //     return true;
          //   }
          // },

        ]
      };
  return (
    <div className='w-screen h-screen'>
      <SampleTemplate />
    </div>
  )
}

export default page