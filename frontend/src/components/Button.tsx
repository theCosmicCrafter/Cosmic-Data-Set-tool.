
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'cosmic' | 'glass';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon';
  glow?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  glow = false,
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group";
  
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/20 border border-indigo-500/50",
    secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700 hover:border-slate-600",
    danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/50",
    ghost: "hover:bg-white/5 text-slate-400 hover:text-white",
    outline: "border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-300",
    
    // High-Fidelity Variants
    cosmic: "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] border border-white/10 hover:border-white/20",
    glass: "bg-white/5 backdrop-blur-md border border-white/10 text-slate-200 hover:bg-white/10 hover:text-white shadow-inner",
  };

  const sizes = {
    xs: "h-7 px-2 text-[10px]",
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 py-2 text-sm",
    lg: "h-12 px-8 text-base",
    icon: "h-9 w-9",
  };

  const glowStyle = glow ? "shadow-[0_0_15px_currentColor]" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${glowStyle} ${className}`} 
      {...props}
    >
      {(variant === 'cosmic' || variant === 'primary') && (
        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0 pointer-events-none" />
      )}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
};
