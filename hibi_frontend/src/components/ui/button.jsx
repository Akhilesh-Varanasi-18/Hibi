"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { UsersContext } from "@/app/context/UserContext";
import { ColorOpacityChange } from "@/utils/CustomColorPalettes";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "shadow rounded-lg dark:bg-white dark:text-black bg-black text-white ",
        green:
          "bg-[radial-gradient(circle_at_center,#1B9356,#046A3B)] text-white shadow rounded-lg",
        blue:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive dark:bg-red-600 text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input shadow-sm", // Custom hover for outline handled separately
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  (
    { className, variant, size, asChild = false, style, ...props },
    ref
  ) => {
    const { colorPalettesFromBackend } = React.useContext(UsersContext);
    const Comp = asChild ? Slot : "button";
    const mainColor = colorPalettesFromBackend?.mainColor;
    const textOnMainColor = colorPalettesFromBackend?.textOnMainColor;

    // Memo for dynamic styles for default and outline (for hover, outline will use a custom CSS var)
    const dynamicStyles = React.useMemo(() => {
      if ((variant === "default" || variant === undefined) && mainColor && textOnMainColor) {
        return {
          backgroundColor: mainColor,
          color: textOnMainColor,
          ...style,
        };
      }
      // outline default: just use user style, bg handled by cva
      return style;
    }, [variant, mainColor, textOnMainColor, style]);

    // For outline: for hover, use color at 0.4 opacity, for additional effect pass also 0.3 as requested
    const outlineHoverVar = React.useMemo(() => {
      if (variant === "outline" && mainColor) {
        return {
          "--outline-hover-bg-color": ColorOpacityChange(mainColor, 0.2),
          "--outline-hover-bg-color-30": ColorOpacityChange(mainColor, 0.2),
        };
      }
      return undefined;
    }, [variant, mainColor]);

    React.useEffect(() => {
      if (variant === "default" || variant === undefined) {
        // eslint-disable-next-line no-console
        console.log("Main Color:", colorPalettesFromBackend?.mainColor);
        // eslint-disable-next-line no-console
        console.log("Text Color:", colorPalettesFromBackend?.textOnMainColor);
      }
    }, [colorPalettesFromBackend, variant]);

    /**
     * Outline button uses vars for the custom hover BG color, as per requirements.
     */
    return (
      <motion.div whileTap={{ scale: 0.98 }}>
        <Comp
          className={cn(
            buttonVariants({ variant, size }),
            className,
            variant === "outline" && "custom-outline-hover"
          )}
          style={{
            ...dynamicStyles,
            ...(outlineHoverVar || {}),
          }}
          ref={ref}
          {...props}
        />
      </motion.div>
    );
  }
);

Button.displayName = "Button";

// Add/replace a style tag for the custom outline hover effect (uses the 0.4 opacity var as main hover bg)
if (typeof window !== "undefined" && !document.getElementById('custom-outline-button-style')) {
  const style = document.createElement('style');
  style.id = 'custom-outline-button-style';
  // As per requirements, use --outline-hover-bg-color (opacity 0.4).
  // "--outline-hover-bg-color-30" is included for usage if needed in future, currently not used in the CSS.
  style.innerHTML = `
    .custom-outline-hover:hover {
      background-color: var(--outline-hover-bg-color) !important;
      /* You can also use var(--outline-hover-bg-color-30) for an overlay effect if desired */
    }
    .custom-outline-hover:focus-visible {
      background-color: var(--outline-hover-bg-color) !important;
    }
  `;
  document.head.appendChild(style);
}

export { Button, buttonVariants };