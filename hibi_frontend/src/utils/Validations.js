// We'll only allow profile images up to 2MB
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

export const Genders = [
    { _id: "MALE", name: "Male" },
    { _id: "FEMALE", name: "Female" },
    { _id: "PREFER NOT TO SAY", name: "Prefer not to say" }
]

export const ValidateEmployeeCode = (value) => {
    if (!value) return "Employee code is required";
    if (!/^[A-Za-z0-9]{4,10}$/.test(value)) {
        return "Employee code must be 4-10 alphanumeric characters, no spaces or special characters";
    }
    return true;
}
export const ValidateFirstName = (value) => {
    if (!value) return "First name is required";
    if (!/^[A-Z][a-zA-Z ]{1,49}$/.test(value)) {
        return "First name must start with a capital letter, can contain spaces, only alphabets and spaces, 2-50 characters";
    }
    return true;
}
export const ValidateLastName = (value) => {
    if (!value) return true;
    if (!/^[A-Z][a-zA-Z ]{1,49}$/.test(value)) {
        return "Last name must start with a capital letter, can contain spaces, only alphabets and spaces, 2-50 characters";
    }
    return true;
}
export const ValidatePhone = (value) => {
    if (!value) return "Phone number is required";
    if (!/^[6-9]\d{9}$/.test(value)) {
        return "Phone number must start with 6 or higher and be exactly 10 digits";
    }
    return true;
}
export const ValidateSalary = (value) => {
    if (!value) return "Salary per month is required";
    if (!/^\d+(\.\d{1,2})?$/.test(value)) {
        return "Salary must be a valid number (up to 2 decimal places)";
    }
    if (parseFloat(value) <= 0) {
        return "Salary must be greater than zero";
    }
    return true;
}
export const ValidateDOB = (value) => {
    if (!value) return "Date of birth is required";
    const dob = new Date(value);
    const age = Math.floor((new Date() - dob) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18) return "Employee must be at least 18 years old";
    if (age > 65) return "Employee must be at most 65 years old";
    return true;
}
export const ValidateGender = (value) => {
    console.log(value)
    if (!value) return "Gender is required";
    return true;
}
export const ValidateDOJ = (value) => {
    if (!value) return "Date of joining is required";
    const doj = new Date(value);
    if (doj > new Date()) return "Date of joining cannot be in the future";
    return true;
}


export const ValidateProfilePicture = (file) => {
    if (!file) return true;
    const validTypes = ["image/webp", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
        return "Only .webp or .svg files are allowed";
    }
    if (file.size > MAX_IMAGE_SIZE) {
        return "File size must be less than 2MB";
    }
    return true;
}
export const ValidateRole = (value) => {
    if (!value) return "Role is required";
    return true;
}
export const ValidatePrivileges = (value) => {
    if (!value) return "Privilege is required";
    return true;
}