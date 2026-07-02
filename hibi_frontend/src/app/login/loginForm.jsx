"use client";
/**
 * LoginForm.jsx
 *   0. LOGIN     = enter email/employee code
 *   1. PASSWORD  = enter password only
 *   2. TWO_FA    = user scans QR for 2FA setup
 *   3. OTP       = enter One-Time Password
 *   4. DONE      = show success & redirect
 *   5. MFA       = lost authenticator/reset flow
 *
 */

import { useContext, useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FaMicrosoft, FaArrowLeft } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { UsersContext } from "../context/UserContext";
import { TiTick } from "react-icons/ti";
import { useToast } from "@/hooks/use-toast";
import { RxCross2 } from "react-icons/rx";
import LoginApi from "@/Apis/LoginApi";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import Image from "next/image";
import MFA_api from "@/Apis/twofactor";
import axiosInstance from "@/config/axiosConfig";
import { defaultColorPalettes } from "../ColorPalettes";


const STEPS = {
  LOGIN: 0,    // Only identifier input
  PASSWORD: 1, // Only password input
  TWO_FA: 2,   // 2FA QR code setup
  OTP: 3,      // OTP input
  DONE: 4,     // Success
  MFA: 5       // MFA reset
};

const REGEXP_ONLY_DIGITS = /^[0-9]+$/;

export function LoginForm({ className, bannerObject, setBannerObject }) {
  const { toast } = useToast();
  // Context setters for user/role/privilege
  const { setUser, setRole, setPrevilege, setmainrole, colorPalettesFromBackend, setColorPalettesFromBackend } = useContext(UsersContext);
  // Timer for OTP resend
  const [timer, setTimer] = useState(0);
  const [mfaloader, setmfaloader] = useState(false);
  const timerRef = useRef(null);
  const router = useRouter();

  // Form state
  const [credentials, setCredentials] = useState({ identifier: "", password: "" }); // User input
  const [errors, setErrors] = useState({ identifier: "", password: "" }); // Validation errors
  const [isLoading, setIsLoading] = useState(false); // Loading state for async actions
  const [showPassword, setShowPassword] = useState(false); // Toggle password visibility
  const [capsLock, setCapsLock] = useState(false); // Caps lock warning
  const [mfaemail, setmfaemail] = useState(""); // For MFA reset

  // Step management
  const [step, setStep] = useState(STEPS.LOGIN); // Current step
  const [otp, setOtp] = useState(""); // OTP input
  const [loginRes, setLoginRes] = useState(null); // Store login response
  const [swipe, setSwipe] = useState(false); // Animation state for transitions
  const [otpauthUrl, setOtpauthUrl] = useState(""); // QR code image URL for 2FA

  const [isResending, setIsResending] = useState(false);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const EMP_CODE_REGEX = /^[a-zA-Z0-9]{3,}$/;

  useEffect(() => {
    if (timer > 0) {
      timerRef.current = setTimeout(() => setTimer(timer - 1), 1000);
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timer]);

  useEffect(() => {
    if (step === STEPS.LOGIN) {
      const input = document.getElementById("identifier");
      if (input) input.focus();
    }
    if (step === STEPS.PASSWORD) {
      const input = document.getElementById("password");
      if (input) input.focus();
    }
  }, [step]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateIdentifier = () => {
    let valid = true;
    const newErrors = { identifier: "" };
    if (
      !EMAIL_REGEX.test(credentials.identifier) &&
      !EMP_CODE_REGEX.test(credentials.identifier)
    ) {
      newErrors.identifier = "Enter a valid email or employee code";
      valid = false;
    }
    setErrors((prev) => ({ ...prev, identifier: newErrors.identifier }));
    return valid;
  };

  const validatePassword = () => {
    let valid = true;
    const newErrors = { password: "" };
    if (credentials.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      valid = false;
    }
    setErrors((prev) => ({ ...prev, password: newErrors.password }));
    return valid;
  };

  // form validations
  const validateForm = () => {
    let valid = true;
    const newErrors = { password: "", identifier: "" };
    if (
      !EMAIL_REGEX.test(credentials.identifier) &&
      !EMP_CODE_REGEX.test(credentials.identifier)
    ) {
      newErrors.identifier = "Enter a valid email or employee code";
      valid = false;
    }
    if (credentials.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      valid = false;
    }
    setErrors(newErrors);
    return valid;
  };

  const showToast = (toastProps) => toast({ ...toastProps });

  // Handle moving from identifier to password
  const handleIdentifierSubmit = async (e) => {
    e.preventDefault();
    if (!validateIdentifier()) return;
    setSwipe(true);
    try {
      const res = await LoginApi.getBannerDetails({ email: credentials?.identifier });
      // alert(JSON.stringify(res.data))
      // based on this banner object the animated left side content and banner changes
      setBannerObject(res?.data)
    } catch (error) {

    } finally {

      setTimeout(() => {
        setStep(STEPS.PASSWORD);
        setSwipe(false);
      }, 200);
    }


  };

  // Password visibility/input logic
  const handlePasswordChange = (e) => {
    const inputValue = e.target.value;
    // if (showPassword) {
      setCredentials((prev) => ({ ...prev, password: inputValue }));
    // } else {
    //   const unmasked = inputValue.replace(/●/g, "");
    //   if (unmasked.length > 0) {
    //     setCredentials((prev) => ({
    //       ...prev,
    //       password: prev.password + unmasked,
    //     }));
    //   } else {
    //     setCredentials((prev) => ({
    //       ...prev,
    //       password: prev.password.slice(0, -1),
    //     }));
    //   }
    // }
  };

  // handles login submitting
  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setOtp(""); // Clear OTP if any

    try {
      const loginPayload = {
        email: credentials.identifier,
        password: credentials.password,
      };
      const response = await LoginApi.Login(loginPayload);

      if (response.success) {
        if (!response?.success) {
          showToast({
            title: (
              <div className="flex gap-2 items-center">
                <div className="text-white bg-red-500 rounded-full text-lg">
                  <RxCross2 />
                </div>
                <span>{response?.error || "Unexpected Server Error"}</span>
              </div>
            ),
          });
          return;
        }

        if (response.status == "202" && response?.data?.qrCodeDataUrl) {
          setOtpauthUrl(response.data.qrCodeDataUrl);
          setLoginRes(response);
          setSwipe(true);
          setTimeout(() => {
            setStep(STEPS.TWO_FA);
            setSwipe(false);
          }, 200);
          return;
        }
        if (response.status == "200") {
          const empData = await LoginApi.GetEmployeeData();
          if (!empData.success) {
            showToast({
              title: (
                <div className="flex gap-2 items-center">
                  <div className="text-white bg-red-500 rounded-full text-lg">
                    <RxCross2 />
                  </div>
                  <span>{empData?.error}</span>
                </div>
              ),
            });
          } else {
            setColorPalettesFromBackend(empData?.data?.orgId?.colorPalette || defaultColorPalettes)
            showToast({
              title: (
                <div className="flex gap-2 items-center">
                  <div className="text-white bg-green-500 rounded-full text-lg">
                    <TiTick />
                  </div>
                  <span>
                    {loginRes?.message || "Logged In Successfully"}
                  </span>
                </div>
              ),
            });
          }
          setUser(empData?.data);
          setRole(empData?.data?.roleId?.name || (empData.data?.productManager && "PRODUCTMANAGER"));
          setPrevilege(empData?.data?.privilegeId?.name)
          setmainrole(empData?.data?.roleId?.name)
          setTimeout(() => {
            if (empData?.data?.roleId?.name == "ORGANIZATIONHEAD") {
              router.push("/orgHead")
            } else if (empData?.data?.roleId?.name == "PRODUCTMANAGER" || empData.data?.productManager) {
              router.push("/organizationManagement")
            } else {
              router.push("/dashboard/home")
            }
          }, 200)
        } else {
          if (response.success && response.status == "203") {
            setLoginRes(response);
            setSwipe(true);
            setTimeout(() => {
              setStep(STEPS.OTP);
              setSwipe(false);
              setTimer(60);
            }, 200);
          } else {
            showToast({
              title: (
                <div className="flex gap-2 items-center">
                  <div className="text-white bg-red-500 rounded-full text-lg">
                    <RxCross2 />
                  </div>
                  <span>{response?.error}</span>
                </div>
              ),
            });
          }
        }
      } else {
        showToast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-red-500 rounded-full text-lg">
                <RxCross2 />
              </div>
              <span>{response?.error || "invalid credentials"}</span>
            </div>
          ),
        });
      }
    } catch (error) {
      console.log(error)
      setErrors({
        identifier: "Invalid credentials",
        password: "Invalid credentials",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value) => {
    setOtp(value);
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      showToast({
        title: (
          <div className="flex gap-2 items-center">
            <div className="text-white bg-red-500 rounded-full text-lg">
              <RxCross2 />
            </div>
            <span>Enter the OTP sent to your Authenticator App</span>
          </div>
        ),
      });
      return;
    }
    setIsLoading(true);

    try {
      const verifyRes = await LoginApi.Verify({
        email: credentials.identifier,
        otp,
      });

      if (verifyRes.success) {
        const empData = await LoginApi.GetEmployeeData();
        setUser(empData?.data);
        setRole(empData?.data?.roleId?.name);
        setPrevilege(empData?.data?.privilegeId?.name);

        showToast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-green-500 rounded-full text-lg">
                <TiTick />
              </div>
              <span>
                {verifyRes?.data?.message || "Logged In Successfully"}
              </span>
            </div>
          ),
        });

        setStep(STEPS.DONE);
        setTimeout(() => {
          if (empData?.data?.roleId?.name === "ORGANIZATIONHEAD")
            router.push("/orgHead");
          else router.push("/dashboard/home");
        }, 900);
      } else {
        showToast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-red-500 rounded-full text-lg">
                <RxCross2 />
              </div>
              <span>{verifyRes?.error || "Invalid OTP"}</span>
            </div>
          ),
        });
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      showToast({
        title: (
          <div className="flex gap-2 items-center">
            <div className="text-white bg-red-500 rounded-full text-lg">
              <RxCross2 />
            </div>
            <span>Invalid OTP</span>
          </div>
        ),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQrScanned = () => {
    setSwipe(true);
    setTimeout(() => {
      setStep(STEPS.OTP);
      setSwipe(false);
    }, 200);
  };

  // handles back click
  const handleBack = () => {
    setSwipe(true);
    if (step === STEPS.PASSWORD) {
      //resetting it to initial state so that the animation reverts back
      setBannerObject(null);
      credentials.password = ""
      setStep(STEPS.LOGIN);
    } else if (step === STEPS.TWO_FA) {
      setStep(STEPS.PASSWORD);
    } else if (step === STEPS.OTP) {
      if (otpauthUrl) {
        setStep(STEPS.TWO_FA);
      } else {
        setStep(STEPS.PASSWORD);
      }
    }
    setSwipe(false);
  };

  const ResetMfa = async () => {
    setmfaloader(true);
    const res = await MFA_api.Request_2fa_reset(mfaemail);
    if (res.success) {
      showToast({
        title: (
          <div className="flex gap-2 items-center">
            <div className="text-white bg-green-500 rounded-full text-lg">
              <TiTick />
            </div>
            <span>{res?.data}</span>
          </div>
        ),
      });
      setStep(STEPS.LOGIN);
    }
    else {
      showToast({
        title: (
          <div className="flex gap-2 items-center">
            <div className="text-white bg-red-500 rounded-full text-lg">
              <RxCross2 />
            </div>
            <span>{res?.error}</span>
          </div>
        ),
      });
    }
    setmfaloader(false);
  };

  const swipeClass = swipe
    ? "transition-transform duration-300 ease-in-out -translate-x-full opacity-0 pointer-events-none"
    : "transition-transform duration-300 ease-in-out translate-x-0 opacity-100";

  return (
    <div
      className={cn("flex flex-col gap-6 rounded-md", className)}
    >
      <Card
      >
        <CardContent>
          {/* Step 1: Only EMAIL/EMP CODE field */}
          {step === STEPS.LOGIN && (
            <form
              onSubmit={handleIdentifierSubmit}
              className={cn("space-y-4", step === STEPS.LOGIN ? swipeClass : "hidden")}
              aria-live="polite"
              style={{ minHeight: 180 }}
            >
              <CardHeader className="text-center">
                <CardTitle>
                  Login
                </CardTitle>
                <CardDescription>
                  Secure Access – Welcome back!
                </CardDescription>
              </CardHeader>
              <div className="space-y-2">
                <div className="flex">
                  <Label
                    htmlFor="identifier"
                  >
                    Email or Employee Code
                  </Label>
                  {/* MFA Reset link */}
                  <p
                    tabIndex={isLoading ? -1 : 0}
                    style={{ marginLeft: "auto" }}
                    onClick={() => { setStep(STEPS.MFA) }}
                  >
                    Reset
                  </p>
                </div>
                <Input
                  id="identifier"
                  type="text"
                  name="identifier"
                  value={credentials.identifier}
                  onChange={handleChange}
                  required
                  autoComplete="username"
                  disabled={isLoading}
                />
                {errors.identifier && (
                  <p className="text-sm text-red-500">{errors.identifier}</p>
                )}
              </div>
              <Button
                type="submit"
                variant="default"
                className={cn("w-full font-medium")}
                disabled={
                  isLoading ||
                  (!EMAIL_REGEX.test(credentials.identifier) &&
                    !EMP_CODE_REGEX.test(credentials.identifier))
                }
              >
                Next
              </Button>
            </form>
          )}

          {/* Step 2: Password Field Only */}
          {step === STEPS.PASSWORD && (
            <form
              onSubmit={handleLoginSubmit}
              className={cn("space-y-4", step === STEPS.PASSWORD ? swipeClass : "hidden")}
              aria-live="polite"
              style={{ minHeight: 180 }}
            >
              <CardHeader className="text-center">
                <CardTitle >
                  Enter your password
                </CardTitle>
                <CardDescription>
                  For {credentials.identifier}
                </CardDescription>
              </CardHeader>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label
                    htmlFor="password"
                  >
                    Password
                  </Label>
                  {/* Forgot Password Link */}
                  <a
                    href="/forgotPassword"
                    tabIndex={isLoading ? -1 : 0}
                    style={{ marginLeft: "auto" }}
                    className="text-xs text-foreground/70"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    // type="text"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={credentials.password}
                    // value={
                    //   showPassword
                    //     ? credentials.password
                    //     : "●".repeat(credentials.password.length)
                    // }
                    onChange={handlePasswordChange}
                    onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                    required
                    // autoComplete="current-password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {capsLock && (
                  <p className="text-xs text-yellow-500">Caps Lock is ON</p>
                )}
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>
              {/* Terms and privacy policy */}
              <div
                className={cn(
                  "text-xs mb-3 text-neutral-600 dark:text-neutral-400 text-left"
                )}
              >
                By logging in, you agree to our{" "}
                <a
                  href="#"
                  className="underline underline-offset-4 hover:text-black dark:hover:text-neutral-300"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  className="underline underline-offset-4 hover:text-black dark:hover:text-neutral-300"
                >
                  Privacy Policy
                </a>
                .
              </div>
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSwipe(true);
                    //resetting it to initial state so that the animation reverts back
                    setBannerObject(null)
                    credentials.password = ""
                    setTimeout(() => {
                      setStep(STEPS.LOGIN);
                      setSwipe(false);
                    }, 200);
                  }}
                  disabled={isLoading}
                  tabIndex={isLoading ? -1 : 0}
                  style={{ minWidth: 96 }}
                >
                  <FaArrowLeft className="mr-2 h-3 w-3" /> Back
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  className={cn("font-medium")}
                  disabled={
                    isLoading || credentials.password.length < 8
                  }
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </div>
            </form>
          )}

          {/* 
            Step 3: 2FA Setup with QR Code
            - Shows QR code for user to scan in authenticator app
            - After scanning, user clicks to continue to OTP step
          */}
          {step === STEPS.TWO_FA && (
            <div className="space-y-6 animate-fade-in" style={{ minHeight: 260 }}>
              {/* Back Button */}
              <button
                onClick={handleBack}
                className="flex items-center text-sm text-muted-foreground hover:text-foreground dark:hover:text-neutral-100 mb-4 mt-5"
                type="button"
              >
                <FaArrowLeft className="mr-2 h-3 w-3" />
                Back to Password
              </button>

              <div className="flex flex-col items-center gap-4 pt-4">
                <Label
                  className={cn(
                    "text-base font-semibold"
                  )}
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
                <Button
                  onClick={handleQrScanned}
                  variant="default"
                  className={cn("w-full font-medium mt-4")}
                >
                  I've Scanned the QR Code
                </Button>
              </div>
            </div>
          )}

          {/* 
            Step 4: OTP Verification
            - User enters 6-digit OTP from authenticator app
            - On submit, triggers handleOtpSubmit
          */}
          {step === STEPS.OTP && (
            <form
              onSubmit={handleOtpSubmit}
              className="space-y-6 animate-fade-in"
              style={{ minHeight: 260 }}
            >
              {/* Back Button */}
              <button
                onClick={handleBack}
                className="flex items-center text-sm text-muted-foreground hover:text-foreground dark:hover:text-neutral-100 mb-4 mt-5"
                type="button"
              >
                <FaArrowLeft className="mr-2 h-3 w-3" />
                {otpauthUrl
                  ? "Back to QR Setup"
                  : "Back to Password"}
              </button>

              <div className="flex flex-col items-center gap-2 pt-4">
                <Label
                  className={cn(
                    "text-base"
                  )}
                >
                  Enter OTP
                </Label>
                <p className="text-xs text-muted-foreground text-center mb-2">
                  Please enter the OTP from your authenticator app
                </p>
                {/* OTP input (6 digits) */}
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={handleOtpChange}
                  disabled={isLoading}
                  inputMode="numeric"
                  pattern={REGEXP_ONLY_DIGITS}
                  className="flex gap-2 justify-center"
                  autoFocus
                  onKeyDown={(e) => {
                    // Allow Enter to submit the form
                    if (e.key === "Enter") {
                      // Let the form submit
                    }
                  }}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} inputMode="numeric" pattern="[0-9]*" />
                    <InputOTPSlot index={1} inputMode="numeric" pattern="[0-9]*" />
                    <InputOTPSlot index={2} inputMode="numeric" pattern="[0-9]*" />
                    <InputOTPSlot index={3} inputMode="numeric" pattern="[0-9]*" />
                    <InputOTPSlot index={4} inputMode="numeric" pattern="[0-9]*" />
                    <InputOTPSlot index={5} inputMode="numeric" pattern="[0-9]*" />
                  </InputOTPGroup>
                </InputOTP>
                <input type="submit" style={{ display: "none" }} tabIndex={-1} />
              </div>
              {/* Verify OTP button */}
              <Button
                type="submit"
                variant="default"
                className={cn("w-full font-medium")}
                disabled={isLoading || otp.length < 6}
              >
                {isLoading ? "Verifying..." : "Verify OTP"}
              </Button>
            </form>
          )}

          {/* 
            Step 5: Success
            - Shows success tick and message
            - Redirects after short delay
          */}
          {step === STEPS.DONE && (
            <div
              className={cn(
                "flex flex-col items-center justify-center min-h-[200px] pt-12",
                "animate-fade-in"
              )}
            >
              <div className="text-green-500 text-4xl mb-2">
                <TiTick />
              </div>
              <div className="text-lg font-semibold">Login Successful!</div>
              <div className="text-muted-foreground text-sm mt-1">
                Redirecting...
              </div>
            </div>
          )}

          {/* 
            Step 6: MFA Reset
            - User can request to reset their 2FA if lost authenticator
            - Calls ResetMfa on submit
          */}
          {step === STEPS.MFA && (
            <div className="">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-center">
                  Reset Authentication Login
                </CardTitle>
                <CardDescription className="text-center">
                  Enter your Email or Employee Code to continue
                </CardDescription>
              </CardHeader>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  ResetMfa();
                }}
              >
                <CardContent className="space-y-4">
                  <div>
                    <label className="block mb-1 font-medium">
                      Email / Employee Code
                    </label>
                    <Input
                      placeholder="Enter email or employee code"
                      type="text"
                      value={mfaemail}
                      onChange={(e) => setmfaemail(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>

                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(STEPS.LOGIN)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="default" disabled={!mfaemail || mfaloader}>
                    {
                      mfaloader ? "Processing..." : "Reset MFA"
                    }
                  </Button>
                </CardFooter>
              </form>
            </div>
          )}

        </CardContent>
      </Card>
      {/* Animation for step transitions */}
      <style jsx global>{`
        .animate-fade-in {
          animation: fadeIn 0.4s;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}