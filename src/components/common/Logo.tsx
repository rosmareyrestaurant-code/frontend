import Image from "next/image";

interface LogoProps {
  className?: string;
}

export default function Logo({ className = "" }: LogoProps) {
  return (
    <span
      role="img"
      aria-label="روزماري - مطعم روزماري"
      className={`inline-flex items-center ${className}`}
    >
      <Image
        src="/images/logo.png"
        alt="Rosemary Logo"
        width={160}
        height={56}
        priority
        style={{ width: "auto" }}
        className="h-10 object-contain drop-shadow-[0_2px_8px_rgba(255,122,0,0.25)] sm:h-12 lg:h-14"
      />
    </span>
  );
}
