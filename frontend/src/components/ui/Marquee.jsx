/**
 * Infinite, pause-on-hover marquee. Content is duplicated for a seamless loop;
 * the duplicate is hidden from assistive technology.
 */
export default function Marquee({ children, duration = 40, className = "" }) {
  return (
    <div className={`ds-marquee ${className}`} style={{ "--duration": `${duration}s` }}>
      <div className="ds-marquee__track">{children}</div>
      <div className="ds-marquee__track" aria-hidden="true">{children}</div>
    </div>
  );
}
