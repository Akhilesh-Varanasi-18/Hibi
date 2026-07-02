import React, { useEffect } from "react";
import {
  ExclamationCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

export default function Toast({
  varient = "success",
  heading = "Notification Header",
  isToastVisible,
  setIsToastVisible,
}) {
  // Auto-hide toast after 4.9 seconds
  useEffect(() => {
    if (isToastVisible) {
      const timeout = setTimeout(() => {
        setIsToastVisible(false);
      }, 4000);
      return () => clearTimeout(timeout);
    }
  }, [isToastVisible, setIsToastVisible]);

  if (!isToastVisible) return null;

  return (
    <div className="fixed left-1/2 -translate-x-1/2 top-12 z-[9999]">
      <div className="bg-zinc-800 w-80 h-12 rounded-full ring-2 ring-white/30 shadow-xl pill-animation">
        <div className="flex justify-between items-center h-full w-full px-2 gap-4 inner-animation">
          <img src="/favicon.ico" alt="icon" className="rounded-full h-9 w-9" />
          <p className="text-zinc-400 font-medium">{heading}</p>
          {getSymbolIcon(varient)}
        </div>
      </div>
    </div>
  );
}

function getSymbolIcon(varient) {
  switch (varient) {
    case "success":
      return (
        <span className="flex justify-center items-center bg-green-300/20 rounded-full h-9 w-9">
          <CheckCircleIcon className="w-6 h-6 text-green-300" />
        </span>
      );
    case "error":
      return (
        <span className="flex justify-center items-center bg-red-300/20 rounded-full h-9 w-9">
          <ExclamationCircleIcon className="w-6 h-6 text-red-300" />
        </span>
      );
    case "warning":
      return (
        <span className="flex justify-center items-center bg-yellow-300/20 rounded-full h-9 w-9">
          <ExclamationTriangleIcon className="w-6 h-6 text-yellow-300" />
        </span>
      );
    case "info":
      return (
        <span className="flex justify-center items-center bg-blue-300/20 rounded-full h-9 w-9">
          <InformationCircleIcon className="w-6 h-6 text-blue-300" />
        </span>
      );
    default:
      return null;
  }
}
