"use client";
import { useState, useContext, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PencilIcon, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { UsersContext } from "../../../context/UserContext";
import ProfileAPi from "@/Apis/Profile_Api";
import { useToast } from "@/hooks/use-toast";
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";

export function EmployeeProfileDialog({ onSuccess, data }) {
  const { setUser, user } = useContext(UsersContext);
  const [open, setOpen] = useState(false);
  const [employee, setEmployee] = useState({});
  const [previewImage, setPreviewImage] = useState("");
  const { toast } = useToast();
  const [loader, setloader] = useState(false);
  const [error, seterror] = useState("");

  // initialize state
  useEffect(() => {
    if (open && data) {
      setEmployee(data);
      setPreviewImage(data.profileImage || null);
    }
  }, [open, data]);

  // console.log(data)
  // input change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmployee((prev) => ({ ...prev, [name]: value }));
  };

  // file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEmployee((prev) => ({ ...prev, profileImage: file }));
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const validate = () => {
    let newErrors = {};

    // First Name
    if (!employee.firstName?.trim()) {
      newErrors.firstName = "First name is required";
    } else if (/\d/.test(employee.firstName)) {
      newErrors.firstName = "First name should not contain digits";
    } else if (!/^[A-Z]/.test(employee.firstName)) {
      newErrors.firstName = "First letter of first name must be capital";
    }

    // Last Name
    if (!employee.lastName?.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (/\d/.test(employee.lastName)) {
      newErrors.lastName = "Last name should not contain digits";
    } else if (!/^[A-Z]/.test(employee.lastName)) {
      newErrors.lastName = "First letter of last name must be capital";
    }

    // Phone
    if (!/^[6-9]\d{9}$/.test(employee.phone)) {
      newErrors.phone = "Enter a valid 10-digit phone number starting with 6-9";
    }

    // Date of Birth
    if (!employee.dateOfBirth) {
      newErrors.dateOfBirth = "Date of Birth is required";
    } else {
      const birthDate = new Date(employee.dateOfBirth);
      const today = new Date();
      const minAgeDate = new Date(
        today.getFullYear() - 18,
        today.getMonth(),
        today.getDate()
      );
      if (birthDate > minAgeDate) {
        newErrors.dateOfBirth = "You must be at least 18 years old";
      }
    }

    // Personal Email
    if (!employee.personalEmail?.trim()) {
      newErrors.personalEmail = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.personalEmail)) {
      newErrors.personalEmail = "Invalid email format";
    }

    // PF Number


    if (employee.pfNumber && !/^\d{12}$/.test(employee.pfNumber)) {
      newErrors.pfNumber = "PF Number must be exactly 12 digits";
    }

    if (employee.esicNumber && !/^\d{16}$/.test(employee.esicNumber)) {
      newErrors.esicNumber = "ESIC Number must be exactly 16 digits";
    }

    // LinkedIn Profile
    if (!employee.linkedInProfile) {
      newErrors.linkedInProfile = "LinkedIn Profile is required";
    } else if (
      !/^(https?:\/\/)?(www\.)?linkedin\.com\/.*$/.test(employee.linkedInProfile)
    ) {
      newErrors.linkedInProfile =
        "Enter a valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/username)";
    }


    // ✅ Set all errors at once
    seterror(newErrors);

    // Return true if no errors, false otherwise
    return Object.keys(newErrors).length === 0;
  };


  useEffect(() => { validate() }, [employee]);

  const handleSubmit = async () => {
    try {
      if (!validate()) return;
      setloader(true);
      const formData = new FormData();
      formData.append("firstName", employee.firstName || "");
      formData.append("lastName", employee.lastName || "");
      formData.append("dateOfBirth", employee.dateOfBirth || "");
      formData.append("personalEmail", employee.personalEmail || "");
      formData.append("phone", employee.phone || "");
      formData.append("esicNumber", employee.esicNumber);
      formData.append("pfNumber", employee.pfNumber);
      formData.append("linkedInProfile", employee.linkedInProfile);

      if (employee.profileImage instanceof File) {
        formData.append("profileImage", employee.profileImage);
      }

      const response = await ProfileAPi.updateEmployeeData(formData);

      if (response.success) {
        toast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-green-500 rounded-full text-lg">
                <TiTick />
              </div>{" "}
              <span>{response?.data}</span>
            </div>
          ),
        });
        setOpen(false);

        const updatedValues = {
          ...user,
          firstName: employee.firstName,
          lastName: employee.lastName,
          dateOfBirth: employee.dateOfBirth,
          personalEmail: employee.personalEmail,
          profileImage: previewImage,
          phone: employee.phone
        };
        setUser(updatedValues);
        onSuccess(updatedValues);
      } else {
        toast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-red-500 rounded-full text-lg">
                <RxCross2 />
              </div>{" "}
              <span>{response?.error}</span>
            </div>
          ),
        });
      }
    } catch (error) {
      console.error("Error while submitting profile:", error);
    }
    setloader(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <PencilIcon className="h-4 w-4 cursor-pointer" />
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90%] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Employee Profile</DialogTitle>
        </DialogHeader>

        <Card className="border-0 shadow-none">
          <CardHeader className="flex flex-col items-center gap-4 pb-4 border-b">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={previewImage} />
                <AvatarFallback>
                  {employee.firstName?.charAt(0)}
                  {employee.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="profileImage"
                className="absolute bottom-0 right-0 bg-primary rounded-full p-2 cursor-pointer"
              >
                <PencilIcon className="h-4 w-4 text-white" />
                <input
                  id="profileImage"
                  type="file"
                  accept="image/svg+xml,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      if (file.size > 2 * 1024 * 1024) {
                        toast({
                          title: (
                            <div className="flex gap-2 items-center">
                              <div className="text-white bg-red-500 rounded-full text-lg">
                                <RxCross2 />
                              </div>{" "}
                              <span>Image size must be less than 2MB</span>
                            </div>
                          ),
                        });
                        e.target.value = "";
                        return;
                      }
                      handleFileChange(e);
                    }
                  }}
                />
              </label>
            </div>
          </CardHeader>

          <CardContent className="grid gap-6 py-6">
            <div>
              <h2 className="text-lg font-semibold mb-3">About</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 items-center">
                  <Label htmlFor="phone">First Name *</Label>
                  <div className="flex flex-col gap-1">
                    <Input
                      name="firstName"
                      value={employee.firstName || ""}
                      onChange={handleChange}
                      placeholder="First Name"
                    />
                    {error?.firstName &&
                      <p className="text-sm text-red-600 dark:text-red-400">{error.firstName}</p>
                    }
                  </div>
                </div>

                <div className="grid grid-cols-2 items-center">
                  <Label htmlFor="phone">Last Name *</Label>
                  <div>
                    <Input
                      name="lastName"
                      value={employee.lastName || ""}
                      onChange={handleChange}
                      placeholder="Last Name"
                    />
                    {error?.lastName &&
                      <p className="text-sm text-red-600 dark:text-red-400">{error.lastName}</p>
                    }
                  </div>
                </div>

                <div className="grid grid-cols-2 items-center">
                  <Label htmlFor="phone">Phone</Label>
                  <div>
                    <Input
                      id="phone"
                      name="phone"
                      value={employee.phone || ""}
                      onChange={handleChange}
                    />
                    {error?.phone &&
                      <p className="text-sm text-red-600 dark:text-red-400">{error.phone}</p>
                    }
                  </div>
                </div>

                <div className="grid grid-cols-2 items-center">
                  <Label htmlFor="personalEmail">Personal Email</Label>
                  <div>
                    <Input
                      id="personalEmail"
                      name="personalEmail"
                      value={employee.personalEmail || ""}
                      onChange={handleChange}
                    // disabled
                    />
                    {error?.personalEmail &&
                      <p className="text-sm text-red-600 dark:text-red-400">{error.personalEmail}</p>
                    }
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-3">Employee Details</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 items-center">
                  <Label>Date of Birth</Label>
                  <div>
                    <Input
                      type="date"
                      name="dateOfBirth"
                      value={
                        employee.dateOfBirth
                          ? employee.dateOfBirth.split("T")[0]
                          : ""
                      }
                      onChange={handleChange}
                    />
                    {error?.dateOfBirth &&
                      <p className="text-sm text-red-600 dark:text-red-400">{error.dateOfBirth}</p>
                    }
                  </div>
                </div>

                <div className="grid grid-cols-2 items-center">
                  <Label>esic Number*</Label>
                  <div>
                    <Input name="esicNumber" value={employee.esicNumber || ""} onChange={handleChange} />
                    {error?.esicNumber &&
                      <p className="text-sm text-red-600 dark:text-red-400">{error.esicNumber}</p>
                    }
                  </div>
                </div>

                <div className="grid grid-cols-2 items-center">
                  <Label>linkedIn Profile*</Label>
                  <div>
                    <Input name="linkedInProfile" value={employee.linkedInProfile || ""} onChange={handleChange} />
                    {error?.linkedInProfile &&
                      <p className="text-sm text-red-600 dark:text-red-400">{error.linkedInProfile}</p>
                    }
                  </div>
                </div>

                <div className="grid grid-cols-2 items-center">
                  <Label>pf Number*</Label>
                  <div>
                    <Input name="pfNumber" value={employee.pfNumber || ""} onChange={handleChange} />
                    {error?.pfNumber &&
                      <p className="text-sm text-red-600 dark:text-red-400">{error.pfNumber}</p>
                    }
                  </div>
                </div>

                <div className="grid grid-cols-2 items-center">
                  <Label>Gender</Label>
                  <Input value={employee.gender || ""} disabled />
                </div>


                <div className="grid grid-cols-2 items-center">
                  <Label>Role</Label>
                  <Input value={employee?.roleId?.name || ""} disabled />
                </div>

                <div className="grid grid-cols-2 items-center">
                  <Label>Privilege</Label>
                  <Input value={employee?.privilegeId?.name || ""} disabled />
                </div>

                <div className="grid grid-cols-2 items-center">
                  <Label>Organization</Label>
                  <Input value={employee?.orgId?.name || ""} disabled />
                </div>
              </div>
            </div>
          </CardContent>


          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loader || Object.keys(error).length > 0}>
              {loader ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
