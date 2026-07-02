"use client";
import { useState, useEffect, useContext } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FiEye, FiEyeOff, FiCheck, FiX, FiLock, FiArrowLeft } from "react-icons/fi";
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";
import { useRouter } from "next/navigation";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useToast } from "@/hooks/use-toast";
import PasswordApi from "@/Apis/password_Api";
import { UsersContext } from "../context/UserContext";
import { Progress } from "@/components/ui/progress";

export default function ChangePassword() {
  const { user } = useContext(UsersContext);
  const [currentPassword, setCurrentPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(user.officeMail);
  const [emailError, setEmailError] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  // Password validations
  const validations = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  };
  const allValid = Object.values(validations).every(Boolean);
  const confirmValid = confirmPassword === newPassword && confirmPassword !== "";

  const verifyCurrentPassword = async () => {
    if (!currentPassword) return;
    setLoading(true);
    try {
      const res = await PasswordApi.verifyOldPassword({ oldPassword: currentPassword });
      if (res.success) {
        setOtpCountdown(60);
        setStep(2); // move to OTP step
        toast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-green-500 rounded-full text-lg p-1">
                <TiTick />
              </div>
              <span>{res?.data?.message}</span>
            </div>
          ),
        });
      } else {
        toast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-red-500 rounded-full text-lg p-1">
                <RxCross2 />
              </div>
              <span>{res?.error}</span>
            </div>
          ),
        });
      }
    } catch (err) {
      console.log(err);
      toast({ title: "Failed to verify current password" });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const verifyOtp = async () => {
    if (!email || !emailRegex.test(email)) {
      setEmailError("Please enter a valid email");
      return;
    }
    setEmailError("");
    if (!otp || otp.length < 6) {
      toast({ title: "Please enter a valid OTP" });
      return;
    }
    setLoading(true);
    try {
      const res = await PasswordApi.verifyOtpChangePassword({ email: email, otp: otp });
      if (res.success) {
        setStep(3); // move to new password step
        toast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-green-500 rounded-full text-lg p-1">
                <TiTick />
              </div>
              <span>{res?.data?.message}</span>
            </div>
          ),
        });
      } else {
        toast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-red-500 rounded-full text-lg p-1">
                <RxCross2 />
              </div>
              <span>{res?.error}</span>
            </div>
          ),
        });
      }
    } catch (err) {
      console.log(err);
      toast({ title: "Failed to verify OTP" });
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Submit new password
  const submitNewPassword = async () => {
    if (!allValid || !confirmValid) {
      toast({ title: "Password requirements not met or passwords do not match" });
      return;
    }
    setLoading(true);
    try {
      const res = await PasswordApi.setNewPassword({ newPassword: newPassword });
      if (res.success) {
        setStep(4); // success step
        toast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-green-500 rounded-full text-lg p-1">
                <TiTick />
              </div>
              <span>{res?.data?.message}</span>
            </div>
          ),
        });
        setTimeout(() => router.push("/logout"), 2000);
      } else {
        toast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-red-500 rounded-full text-lg p-1">
                <RxCross2 />
              </div>
              <span>{res?.error}</span>
            </div>
          ),
        });
      }
    } catch (err) {
      console.log(err);
      toast({ title: "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Manual password masking for Input fields
  function getMaskedValue(value, show) {
    return show ? value : "●".repeat(value.length);
  }

  // Step renderers
  const renderCurrentPasswordStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current-password" className="text-sm font-medium">Current Password</Label>
        <div className="relative">
          <Input
            id="current-password"
            type={showCurrent ? "text" : "password"}
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") {
                e.preventDefault();
                verifyCurrentPassword();
              }
            }}
            placeholder="Enter your current password"
            className="pr-10"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowCurrent(!showCurrent)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {showCurrent ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        </div>
      </div>
      <Button
        type="button"
        onClick={verifyCurrentPassword}
        className="w-full"
        disabled={loading || !currentPassword}
      >
        {loading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Verifying...
          </div>
        ) : (
          "Continue"
        )}
      </Button>
    </div>
  );

  const renderOtpStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">Office Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError("");
          }}
          placeholder="Enter your Office Email"
          disabled={user?.officeMail}
          className={emailError ? "border-red-500" : ""}
        />
        {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Verification Code</Label>
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={otp}
            pattern={REGEXP_ONLY_DIGITS}
            onChange={(value) => setOtp(value)}
            className="justify-center"
          >
            <InputOTPGroup className="gap-2">
              {[...Array(6)].map((_, i) => (
                <InputOTPSlot
                  key={i}
                  index={i}
                  className="w-12 h-12 text-lg border-2 rounded-lg data-[state=incomplete]:border-gray-300 data-[state=complete]:border-indigo-500 data-[state=active]:border-indigo-500"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
        <p className="text-center text-sm text-gray-500">
          Enter the 6-digit code
        </p>
      </div>

      <Button
        type="button"
        onClick={verifyOtp}
        className="w-full"
        disabled={loading || otp.length < 6 || !email}
      >
        {loading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Verifying...
          </div>
        ) : (
          "Verify OTP"
        )}
      </Button>

    </div>
  );

  const renderNewPasswordStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="new-password" className="text-sm font-medium">New Password</Label>
        <div className="relative">
          <Input
            id="new-password"
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            className="pr-10"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {showNew ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirm-password"
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            className="pr-10"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {showConfirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        </div>
        {!confirmValid && confirmPassword !== "" && (
          <p className="text-red-500 text-sm">Passwords do not match</p>
        )}
      </div>

      <div className="p-4 bg-gray-50 rounded-lg space-y-2 dark:bg-zinc-950 ">
        <p className="text-sm font-medium">Password Requirements:</p>
        {Object.entries(validations).map(([rule, valid]) => (
          <div key={rule} className="flex items-center gap-2 text-sm ">
            {valid ? (
              <FiCheck className="text-green-500" />
            ) : (
              <FiX className="text-red-500" />
            )}
            <span className={valid ? "text-green-600" : "text-gray-600"}>
              {rule === "length" && "At least 8 characters"}
              {rule === "uppercase" && "One uppercase letter (A-Z)"}
              {rule === "lowercase" && "One lowercase letter (a-z)"}
              {rule === "number" && "One number (0-9)"}
              {rule === "special" && "One special character (!@#$%^&*)"}
            </span>
          </div>
        ))}
      </div>

      <Button
        type="button"
        onClick={submitNewPassword}
        className="w-full "
        disabled={loading || !allValid || !confirmValid}
      >
        {loading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Changing...
          </div>
        ) : (
          "Change Password"
        )}
      </Button>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="space-y-6 text-center py-4">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
        <TiTick className="h-10 w-10 text-green-600" />
      </div>
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Password Changed Successfully!</h3>
        <p className="text-gray-500 mt-2">
          Your password has been updated. You will be redirected to login shortly.
        </p>
      </div>
      <Button
        onClick={() => router.push("/logout")}
        className="w-full"
      >
        Continue to Login
      </Button>
    </div>
  );

  const stepTitles = [
    "Verify Current Password",
    "Verify Your Identity",
    "Create New Password",
    "Success",
  ];

  const stepDescriptions = [
    "Enter your current password to continue",
    "Enter Otp Code from Your Authenticator",
    "Create a strong and secure new password",
    "Your password has been successfully updated",
  ];

  return (
    <div className="min-h-screen flex items-center justify-center dark:from-neutral-900 dark:to-neutral-800 p-4">
      <div className="absolute top-6 left-6">
        { (<Button
          type="button"
          onClick={handleGoBack}
          variant="outline"
          className="flex items-center gap-2 text-gray-700 dark:text-gray-400 shadow-lg"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back
        </Button>)}

      </div>

      <Card className="w-full max-w-md shadow-lg border-0 dark:bg-neutral-900">
        <CardHeader className="space-y-2 pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <FiLock className="text-black-600" />
              {stepTitles[step - 1]}
            </CardTitle>
            <div className="text-sm text-gray-500">Step {step} of 4</div>
          </div>
          <CardDescription>{stepDescriptions[step - 1]}</CardDescription>
          <Progress value={step * 25} className="h-2" />
        </CardHeader>
        <CardContent className="pt-2">
          {step === 1 && renderCurrentPasswordStep()}
          {step === 2 && renderOtpStep()}
          {step === 3 && renderNewPasswordStep()}
          {step === 4 && renderSuccessStep()}
        </CardContent>
      </Card>
    </div>
  );
}