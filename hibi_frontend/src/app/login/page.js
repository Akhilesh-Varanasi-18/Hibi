"use client";
import { GalleryVerticalEnd } from "lucide-react";
import { LoginForm } from "./loginForm";
import React, { useState, useRef, useEffect } from "react";
import gsap from "gsap";

export default function Page() {
  const [bannerObject, setBannerObject] = useState(null);
  const loginPanelRef = useRef(null);
  const bannerPanelRef = useRef(null);
  const textContainerRef = useRef(null);

  const shouldShowBanner =
    bannerObject &&
    typeof bannerObject === "object" &&
    bannerObject.userType === "EMPLOYEE";

  // Helper to detect lg screen (1024px and up)
  const isLargeScreen = () =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;

  // Animate to initial panel positions and widths on mount and resize
  useEffect(() => {
    const runInitial = () => {
      if (isLargeScreen()) {
        if (loginPanelRef.current && bannerPanelRef.current) {
          gsap.set(loginPanelRef.current, { width: "100vw" });
          gsap.set(bannerPanelRef.current, { width: "0vw" });
        }
      } else {
        if (loginPanelRef.current) {
          loginPanelRef.current.style.width = "";
        }
        if (bannerPanelRef.current) {
          bannerPanelRef.current.style.width = "";
        }
      }
    };
    runInitial();
    window.addEventListener("resize", runInitial);
    return () => window.removeEventListener("resize", runInitial);
  }, []);

  // Animate panels when banner visibility changes
  useEffect(() => {
    if (!isLargeScreen()) {
      if (loginPanelRef.current) loginPanelRef.current.style.width = "";
      if (bannerPanelRef.current) bannerPanelRef.current.style.width = "";
      return;
    }
    if (loginPanelRef.current && bannerPanelRef.current) {
      if (shouldShowBanner) {
        //banner animation
        gsap.to(bannerPanelRef.current, {
          width: "60vw",
          duration: 1,
          ease: "power2.inOut",
        });
        gsap.to(loginPanelRef.current, {
          width: "40vw",
          duration: 1,
          ease: "power2.inOut",
        });
      } else {
        // login to full width and banner to hidden
        gsap.to(loginPanelRef.current, {
          width: "100vw",
          duration: 1,
          ease: "power2.inOut",
        });
        gsap.to(bannerPanelRef.current, {
          width: "0vw",
          duration: 1,
          ease: "power2.inOut",
        });
      }
    }
  }, [shouldShowBanner]);

  return (
    <div className="relative min-h-svh w-[100vw] overflow-hidden bg-background flex">
      {/* LEFT BANNER PANEL*/}
      <div
        ref={bannerPanelRef}
        className="relative hidden lg:flex flex-col items-center justify-center transition-colors duration-500 order-1"
        style={{
          height: "100svh",
          minWidth: 0,
          width: "",
          willChange: "width, background",
          overflow: "hidden",
          position: "relative",
          background:
            shouldShowBanner && bannerObject && bannerObject.orgBanner
              ? undefined
              : shouldShowBanner
              ? "#0a0f12"
              : "var(--muted, #f3f4f6)",
        }}
      >
        {shouldShowBanner && (
          <>
            {/* Background orgBanner image*/}
            {bannerObject.orgBanner && (
              <img
                src={bannerObject.orgBanner}
                alt="Organization Banner"
                className="absolute inset-0 w-full h-full object-cover z-0 opacity-60"
                style={{ pointerEvents: "none", userSelect: "none" }}
              />
            )}

            {/* Top logo commented for now */}
            {bannerObject.orgLogo && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
                {/* <img
                  src={bannerObject.orgLogo}
                  alt="Organization Logo"
                  className="h-14 w-14 rounded-full shadow-md bg-white/80 object-contain p-2"
                /> */}
              </div>
            )}

            {/* Overlay to adjust readability if needed */}
            {bannerObject.orgBanner && (
              <div className="absolute inset-0 z-10 bg-black/60" />
            )}

            {/* Main content */}
            <div className="relative z-30 flex flex-col items-center justify-center h-full text-white text-center px-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-3 drop-shadow-lg">
                {bannerObject.orgName || "Welcome"}
              </h2>
              <p className="text-lg md:text-xl mb-4 opacity-60">
                {bannerObject.orgName
                  ? `Welcome to ${bannerObject.orgName}!`
                  : "Your trusted partner in success."}
              </p>
              <p className="text-base md:text-lg max-w-md opacity-30">
                Seamlessly manage your HR tasks, payroll, and growth — all in one place.
              </p>
            </div>
          </>
        )}
      </div>
      {/* LOGIN PANEL */}
      <div
        ref={loginPanelRef}
        className="flex flex-col gap-4 p-8 md:p-12 bg-background justify-center transition-all duration-700 lg:transition-all lg:duration-700 order-2"
        style={{
          height: "100svh",
          minWidth: 0,
          maxWidth: "100vw",
          willChange: "width",
          overflow: "hidden",
          zIndex: 10,
        }}
      >
        <div ref={textContainerRef} className="mx-auto w-full max-w-[420px]">
          {/* Top logo and welcome section */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-md shadow-md">
                <GalleryVerticalEnd className="size-5" />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">
              Welcome back!
            </h1>
            <p className="text-muted-foreground text-sm">
              Login to your account
            </p>
          </div>

          {/* Login form */}
          <div>
            <LoginForm
              bannerObject={bannerObject}
              setBannerObject={setBannerObject}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
