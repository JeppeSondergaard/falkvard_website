import Image from "next/image";

interface TentIconProps {
  size?: number;
  className?: string;
  variant?: "dark" | "white";
}

export default function TentIcon({
  size = 24,
  className,
  variant = "white",
}: TentIconProps) {
  const src = variant === "white" ? "/logo/tent-white.png" : "/logo/tent-dark.png";

  return (
    <Image
      src={src}
      alt="Falkvard Tattoo"
      width={size}
      height={Math.round(size * 0.9)}
      className={className}
      unoptimized
    />
  );
}
