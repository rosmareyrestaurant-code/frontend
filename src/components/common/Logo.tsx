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
        src="/images/logo-rosemary-green.png"
        alt="Rosemary Logo"
        width={160}
        height={83}
        priority
        style={{ width: "auto" }}
        className="h-10 object-contain drop-shadow-[0_2px_8px_rgba(82,107,88,0.28)] sm:h-12 lg:h-14"
      />
    </span>
  );
}
