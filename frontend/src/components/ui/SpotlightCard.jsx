import { forwardRef, useCallback } from "react";

/**
 * Card surface with a pointer-following spotlight and glowing border.
 * Purely visual: all props/children are forwarded to the underlying element.
 */
const SpotlightCard = forwardRef(function SpotlightCard(
  { as: Component = "div", interactive = true, className = "", children, onPointerMove, ...props },
  ref
) {
  const handlePointerMove = useCallback((event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--my", `${event.clientY - rect.top}px`);
    onPointerMove?.(event);
  }, [onPointerMove]);

  return (
    <Component
      ref={ref}
      onPointerMove={handlePointerMove}
      className={`ds-card ds-spotlight ${interactive ? "ds-card--interactive" : ""} ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
});

export default SpotlightCard;
