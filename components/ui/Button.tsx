import React from "react";

type ButtonVariant = "idle" | "heat" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

export function Button({ 
  variant = "idle", 
  className = "", 
  disabled, 
  children, 
  ...props 
}: ButtonProps) {
  
  const baseStyles = "px-4 py-2 font-mono text-sm uppercase transition-colors duration-100 flex items-center justify-center focus:outline-none";
  
  let variantStyles = "";
  
  if (disabled) {
    variantStyles = "border border-cold text-cold cursor-not-allowed";
  } else {
    switch (variant) {
      case "idle":
        variantStyles = "border border-idle text-idle hover:bg-idle/10 active:bg-idle active:text-void hover:shadow-[0_0_10px_rgba(0,255,65,0.3)]";
        break;
      case "heat":
        variantStyles = "border border-heat text-heat hover:bg-heat/10 active:bg-heat active:text-void hover:shadow-[0_0_10px_rgba(255,42,0,0.3)]";
        break;
      case "ghost":
        variantStyles = "border-transparent text-gray-400 hover:text-white hover:underline";
        break;
    }
  }

  return (
    <button 
      className={`${baseStyles} ${variantStyles} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
