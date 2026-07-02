"use client";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Dialog with only content (no image), content fills the height
const CustomDialog = ({ label, content }) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
          {label || "View Details"}
      </DialogTrigger>

      <DialogContent
        className="w-[98vw] sm:w-[90vw] md:w-[80vw] max-w-4xl flex flex-col items-center justify-center p-3 sm:p-5 md:p-6 max-h-[80vh] backdrop-blur-xl border border-border shadow-2xl rounded-2xl"
        style={{ minHeight: "250px" }}
      >
        <div
          className="w-full text-center px-2 sm:px-4 py-2 sm:py-3 rounded-lg leading-relaxed text-xs sm:text-sm md:text-base text-foreground/90 break-words flex-1"
          style={{ height: "100%", overflowY: "auto", wordBreak: "break-word" }}
        >
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomDialog;
