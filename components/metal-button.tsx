"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

interface MetalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default";
}

export const MetalButton = forwardRef<HTMLButtonElement, MetalButtonProps>(
  ({ variant = "default", children, className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`metal-btn ${className}`.trim()}
        {...props}
      >
        {children}
      </button>
    );
  }
);

MetalButton.displayName = "MetalButton";
