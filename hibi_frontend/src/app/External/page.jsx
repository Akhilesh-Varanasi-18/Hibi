"use client";
import React, { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import MFA_api from "@/Apis/twofactor";
import { TiTick } from "react-icons/ti";
import { RxCross2 } from "react-icons/rx";

const Page = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const Route = useRouter();
  if (!token) {
    Route.push("/login");
  }
  const { toast } = useToast();
  const [captchaText, setCaptchaText] = useState("");
  const [userInput, setUserInput] = useState("");
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef(null);

  // Generate a simple CAPTCHA
  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let text = "";
    for (let i = 0; i < 5; i++) {
      text += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setCaptchaText(text);
    setUserInput("");
    setIsCaptchaVerified(false);

    // Draw CAPTCHA on canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#f3f4f6";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add noise (dots)
        for (let i = 0; i < 50; i++) {
          ctx.fillStyle = `rgba(${Math.random() * 100}, ${Math.random() * 100}, ${Math.random() * 100}, 0.2)`;
          ctx.beginPath();
          ctx.arc(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            Math.random() * 2,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }

        // Draw text
        ctx.font = "24px Arial";
        ctx.fillStyle = "#1f2937";
        ctx.textAlign = "center";

        // Add slight distortion to each character
        for (let i = 0; i < text.length; i++) {
          const x = 30 + i * 20;
          const y = 25 + Math.random() * 10 - 5;
          ctx.fillText(text[i], x, y);
        }

        // Add a line through the text
        ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
        ctx.beginPath();
        ctx.moveTo(10, 15);
        ctx.lineTo(110, 35);
        ctx.stroke();
      }
    }
  };

  const verifyCaptcha = () => {
    if (userInput.toUpperCase() === captchaText) {
      setIsCaptchaVerified(true);
    } else {
      setIsCaptchaVerified(false);
      toast({
        title: "Incorrect CAPTCHA",
        description: "Please try again.",
        variant: "destructive",
      });
      generateCaptcha();
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();

    if (!isCaptchaVerified) {
      toast({
        title: "CAPTCHA Required",
        description: "Please complete the CAPTCHA verification first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await MFA_api.Confirm_2fa_reset(token);
      // Handle API response here
      if (res.success) {
        toast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-green-500 rounded-full text-lg p-1">
                <TiTick />
              </div>
              <span>{res?.data}</span>
            </div>
          ),
        });
        Route.push("/login")
      }
      else {
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
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center">
            Reset Authenticator Options
          </CardTitle>
          <CardDescription className="text-center">
            Hi, clicking the button below will reset your Authenticator options.
            Please complete the CAPTCHA verification first.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* CAPTCHA Section */}
          <div className="space-y-2">
            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                width={120}
                height={40}
                className="border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Enter CAPTCHA"
                disabled={isCaptchaVerified}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button
                type="button"
                variant="outline"
                onClick={verifyCaptcha}
                disabled={isCaptchaVerified}
                className="whitespace-nowrap"
              >
                Verify
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {isCaptchaVerified ? (
                  <span className="text-green-600 flex items-center">
                    <span className="mr-1">✓</span> CAPTCHA verified
                  </span>
                ) : (
                  "Not verified"
                )}
              </div>
              <button
                type="button"
                onClick={generateCaptcha}
                disabled={isCaptchaVerified}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Refresh CAPTCHA
              </button>
            </div>
          </div>

          {/* Reset Button */}
          <Button
            className="w-full"
            variant="destructive"
            onClick={handleReset}
            disabled={!isCaptchaVerified || isLoading}
          >
            {isLoading ? "Processing..." : "Reset MFA"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;