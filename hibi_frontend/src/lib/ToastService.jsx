import { RxCross2 } from "react-icons/rx";
import { TiTick } from "react-icons/ti"; 
import React from "react";

let toastFn = null;

export const setToast = (fn) => {
  toastFn = fn;
};

export const showToast = (message, type = "default", hideCross) => {
  if (toastFn) {
    toastFn({
      title: (
        <span className="flex items-center gap-2">
          {type === "error" ? (
            <RxCross2 className="text-red-500 w-5 h-5" />
          ) : (
            <TiTick className="text-green-500 w-5 h-5" />
          )}
          <span>
            {type === "error" && !hideCross ? "Error" : type !== "error" ? "Success" : ""}
          </span>
        </span>
      ),
      description: message,
      variant: "default",
    });
  }
};
