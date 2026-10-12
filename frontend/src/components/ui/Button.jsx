import { forwardRef, useCallback, useRef } from "react";

const VARIANTS = {
  primary:
    "ds-btn-shine bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] hover:text-[var(--color-primary-foreground)] shadow-[0_12px_32px_-12px_var(--ds-glow),inset_0_1px_0_rgb(255_255_255/18%)]",
  secondary:
    "border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] hover:bg-[var(--color-card-hover)] hover:text-[var(--color-text-primary)]",
  outline:
    "border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-card)_55%,transparent)] text-[var(--color-text-primary)] backdrop-blur hover:border-[color-mix(in_srgb,var(--color-primary)_55%,var(--color-border))] hover:bg-[var(--color-card-hover)] hover:text-[var(--color-text-primary)]",
  ghost:
    "text-[var(--color-text-secondary)] hover:bg-[var(--color-card-hover)] hover:text-[var(--color-text-primary)]",
  danger:
    "bg-[var(--color-danger)] text-[var(--color-danger-foreground)] hover:brightness-95",
};

const SIZES = {
  sm: "px-3.5 py-2 text-xs rounded-lg",
  md: "px-5 py-3 text-sm rounded-xl",
  lg: "px-6 py-3.5 text-[0.95rem] rounded-2xl",
};

/**
 * Button — supports rendering as <a> when `href` is passed.
 * `magnetic` adds a subtle pointer-follow offset (disabled for reduced motion).
 */
const Button = forwardRef(function Button(
  { children, variant = "primary", size = "md", magnetic = false, href, className = "", icon, as, onPointerMove, onPointerLeave, ...props },
  ref
) {
  const localRef = useRef(null);
  const setRefs = useCallback((node) => {
    localRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  }, [ref]);

  const handleMove = (event) => {
    onPointerMove?.(event);
    if (!magnetic || event.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const node = localRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) * 0.18;
    const y = (event.clientY - rect.top - rect.height / 2) * 0.28;
    node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  const handleLeave = (event) => {
    onPointerLeave?.(event);
    if (localRef.current) localRef.current.style.transform = "";
  };

  const classes = `group inline-flex items-center justify-center gap-2 font-sans font-semibold transition-[transform,background-color,border-color,color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none ${SIZES[size] || SIZES.md} ${(VARIANTS[variant] || VARIANTS.primary)} ${className}`;

  if (href) {
    return (
      <a ref={setRefs} href={href} className={classes} onPointerMove={handleMove} onPointerLeave={handleLeave} {...props}>
        {icon}
        {children}
      </a>
    );
  }

  const Component = as || "button";
  return (
    <Component ref={setRefs} className={classes} onPointerMove={handleMove} onPointerLeave={handleLeave} {...props}>
      {icon}
      {children}
    </Component>
  );
});

export default Button;
