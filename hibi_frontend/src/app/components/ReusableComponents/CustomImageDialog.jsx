"use client";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const CustomImageDialog = ({ url, label, content }) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="font-medium px-4 py-2 hover:bg-accent hover:text-accent-foreground transition"
        >
          {label || "View Details"}
        </Button>
      </DialogTrigger>

      <DialogContent
        className="w-[98vw] sm:w-[90vw] md:w-[80vw] max-w-4xl flex flex-col gap-3 items-center justify-center p-3 sm:p-5 md:p-6 max-h-[80vh] overflow-y-auto bg-background/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl"
      >
        {/* Shows the text content above the image */}
        <div
          className="w-full text-center px-2 sm:px-4 py-2 sm:py-3 rounded-lg bg-muted/40 leading-relaxed text-xs sm:text-sm md:text-base text-foreground/90 break-words"
          style={{ maxHeight: "40vh", overflowY: "auto", wordBreak: "break-word" }}
        >
          {content}
        </div>

        {/* Displays the image if a URL is provided */}
        { /* url && (
        //   <div className="w-full flex justify-center items-center">
        //     <Image
        //       src={url}
        //       alt={label || "Dialog Image"}
        //       width={900}
        //       height={506}
        //       unoptimized
        //       className="rounded-xl shadow-lg object-contain w-full max-w-3xl aspect-video"
        //       style={{ maxHeight: "35vh" }}
        //     />
        //   </div>
        ) /* }
        {/* Displays the image if a URL is provided */}
        {url && (
          <div className="w-full flex justify-center items-center">
            <img
              src={url}
              alt={label || "Dialog Image"}
              className="rounded-xl shadow-lg object-contain w-full max-w-3xl aspect-video"
              style={{ maxHeight: "35vh" }}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CustomImageDialog;
