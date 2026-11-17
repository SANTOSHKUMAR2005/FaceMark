export default function Logo({ className = "h-8 w-8" }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 11V6a2 2 0 0 1 2-2h5M21 4h5a2 2 0 0 1 2 2v5M28 21v5a2 2 0 0 1-2 2h-5M11 28H6a2 2 0 0 1-2-2v-5" />
      <circle cx="16" cy="13.5" r="4" />
      <path d="M8.5 24c1.2-3.2 4-4.8 7.5-4.8s6.300 1.600 7.500 4.800" />
    </svg>
  );
}
