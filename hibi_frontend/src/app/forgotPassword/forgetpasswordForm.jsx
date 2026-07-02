"use client";
import { useState } from "react";
import axios from "axios";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";
import axiosInstance from "@/config/axiosConfig";
import PasswordApi from "@/Apis/password_Api";
import { useRouter } from "next/navigation";
import { set } from "zod";
import Image from "next/image";

export function ForgotPasswordForm({ className, ...props }) {
  // Theme classes for neutral/White
  const darkNeutral = "dark:bg-neutral-900";
  const cardBorder = "border border-neutral-200 dark:border-neutral-900";
  const inputBg = "bg-white dark:bg-neutral-900";
  const labelColor = "text-neutral-700 dark:text-neutral-200";
  const mutedText = "text-neutral-500 dark:text-neutral-400";
  const White = "bg-[#ffffff]";
  const inputBorder = "border-neutral-300 dark:border-neutral-700";
  const outlineButton =
    "border-neutral-300 dark:border-neutral-900 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800";

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [otpauthUrl, setOtpauthUrl] = useState(null);
  // Only allow office emails (e.g. must end with @company.com)
  // You can adjust the regex to your office domain
  const OFFICE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Replace with e.g. /@company\.com$/ if needed
  const REGEXP_ONLY_DIGITS = /^[0-9]+$/;

  const handleChange = (field) => (value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateEmail = () => {
    if (!formData.email) {
      setErrors((prev) => ({ ...prev, email: "Email is required" }));
      return false;
    }
    if (!OFFICE_EMAIL_REGEX.test(formData.email)) {
      setErrors((prev) => ({
        ...prev,
        email: "Enter your valid office email",
      }));
      return false;
    }
    return true;
  };

  const validateOtp = () => {
    if (formData.otp.length !== 6) {
      setErrors((prev) => ({ ...prev, otp: "OTP must be 6 digits" }));
      return false;
    }
    if (!REGEXP_ONLY_DIGITS.test(formData.otp)) {
      setErrors((prev) => ({ ...prev, otp: "OTP must contain only digits" }));
      return false;
    }
    return true;
  };

  // Step 1: Send OTP to office email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setIsLoading(true);
    const payLoad = {
      email: formData.email,
    };
    const response = await PasswordApi.ForgotPassword(payLoad);
    if (response.success) {
      if (response?.data?.qrCodeDataUrl) {
        toast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-green-500 rounded-full text-lg">
                <TiTick />
              </div>
              <span>{response.message || "OTP sent to your office email."}</span>
            </div>
          ),
        });
        router.push('/login');
        return;
      }
      setStep(2);
      toast({
        title: (
          <div className="flex gap-2 items-center">
            <div className="text-white bg-green-500 rounded-full text-lg">
              <TiTick />
            </div>
            <span>{response.message || "OTP sent to your office email."}</span>
          </div>
        ),
      });
    } else {
      setErrors({
        email: response?.error || "Failed to send OTP. Please try again.",
      });
      toast({
        title: (
          <div className="flex gap-2 items-center">
            <div className="text-white bg-red-500 rounded-full text-lg">
              <RxCross2 />
            </div>
            <span>
              {response?.error || "Failed to send OTP. Please try again."}
            </span>
          </div>
        ),
      });
    }
    setIsLoading(false);
  };

  // Step 2: Verify OTP and reset password (new password will be sent to email)
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!validateOtp()) return;

    setIsLoading(true);
    const payload = {
      email: formData.email,
      otp: formData.otp,
    }
    const response = await PasswordApi.VerifyOTPForgotPassword(payload);
    // console.log(response);
    if (response.success) {
      toast({
        title: (
          <div className="flex gap-2 items-center">
            <div className="text-white bg-green-500 rounded-full text-lg">
              <TiTick />
            </div>
            <span>
              {response?.message ||
                "OTP verified. A new password has been sent to your office email."}
            </span>
          </div>
        ),
      });
      router.push("/login");
      // setStep(3); // No step 3 in this flow, password is sent to email
    } else {
      setErrors({ otp: response?.error || "Invalid OTP. Please try again." });
      toast({
        title: (
          <div className="flex gap-2 items-center">
            <div className="text-white bg-red-500 rounded-full text-lg">
              <RxCross2 />
            </div>
            <span>{response?.error || "Invalid OTP. Please try again."}</span>
          </div>
        ),
      });
    }
    setIsLoading(false);

  };

  // Step 3: (Commented out, not used in this flow)
  // const handleResetPassword = async (e) => {
  //   e.preventDefault();
  //   // Not needed: password is generated and sent to email by backend after OTP verification
  // };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className={cn(White, darkNeutral, cardBorder, "shadow-lg")}>
        <CardHeader className="text-center">
          <CardTitle className="text-xl text-neutral-900 dark:text-neutral-100">
            Reset your password
          </CardTitle>
        </CardHeader>

        <CardContent>
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="grid gap-4">
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <Label htmlFor="email" className={labelColor}>
                    Enter your office email
                  </Label>
                  {/* {errors.email && (
                    <span className="text-red-600 text-xs">{errors.email}</span>
                  )} */}
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.office@email.com"
                  value={formData.email}
                  onChange={(e) => handleChange("email")(e.target.value)}
                  required
                  className={cn(inputBg, inputBorder)}
                />
              </div>

              <Button
                type="submit"
                className={cn("w-full rounded-md")}
                disabled={!OFFICE_EMAIL_REGEX.test(formData.email) || isLoading}
              >
                {isLoading ? "Processing..." : "Proceed for OTP"}
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="grid gap-4">
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <Label htmlFor="otp" className={labelColor}>
                    Enter 6-digit OTP
                  </Label>
                  {errors.otp && (
                    <span className="text-red-600 text-xs">{errors.otp}</span>
                  )}
                </div>

                <div className="flex justify-center items-center">
                  <InputOTP
                    maxLength={6}
                    value={formData.otp}
                    pattern={REGEXP_ONLY_DIGITS}
                    onChange={(value) => handleChange("otp")(value)}
                  >
                    <InputOTPGroup>
                      {[...Array(6)].map((_, i) => (
                        <InputOTPSlot
                          className="dark:border-zinc-800 border-zinc-400 "
                          key={i}
                          index={i}
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              <div className="flex justify-between gap-2">
                <Button
                  type="button"
                  onClick={() => setStep(1)}
                  // className={cn("w-1/2 rounded-md", outlineButton)}
                  variant="outline"
                  disabled={isLoading}
                >
                  Back
                </Button>

                <Button
                  type="submit"
                  className={cn("w-1/2 rounded-md")}
                  disabled={formData.otp.length !== 6 || isLoading}
                >
                  {isLoading ? "Verifying..." : "Verify OTP"}
                </Button>
              </div>
            </form>
          )}


          {step === 3 && (
            <div className="space-y-6 animate-fade-in" style={{ minHeight: 260 }}>
              {/* Back Button */}

              <div className="flex flex-col items-center gap-4 pt-4">
                <Label
                >
                  Set Up Two-Factor Authentication
                </Label>
                <p className="text-sm text-muted-foreground text-center">
                  Scan this QR code with your authenticator app to enable 2FA.
                </p>

                {/* QR code image */}
                {otpauthUrl && (
                  <div className="p-4 bg-white rounded-lg border border-border dark:bg-neutral-800 dark:border-neutral-700">
                    <Image
                      src={otpauthUrl}
                      alt="2FA QR Code"
                      width={200}
                      height={200}
                      className="mx-auto"
                      unoptimized
                    />
                  </div>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  After scanning the QR code, click continue to verify your setup.
                </p>

                {/* Continue to OTP button */}

                <div className="flex gap-2 w-full items-center justify-center">
                  <Button
                    type="button"
                    onClick={() => setStep(1)}
                    variant="outline"
                    disabled={isLoading}
                  >
                    Back
                  </Button>

                  <Button
                    onClick={() => setStep(2)}
                    variant="default"
                    className={cn("w-full font-medium")}
                  >
                    I've Scanned the QR Code
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 
            Step 3: Reset password form is not needed in this flow.
            After successful OTP verification, a new password is generated and sent to the user's office email.
            The UI can optionally show a message or redirect to login.
          */}
        </CardContent>
      </Card>
    </div>
  );
}
