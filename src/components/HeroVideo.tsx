interface HeroVideoProps {
  className?: string;
  src?: string;
  posterSrc?: string;
}

const DEFAULT_VIDEO_SRC = "/hero-bg-720.mp4";
const DEFAULT_POSTER_SRC = "/hero-bg-poster.jpg";
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v", ".ogv"];

function isVideoFile(src: string): boolean {
  const normalizedSrc = src.split("?")[0].toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => normalizedSrc.endsWith(ext));
}

export default function HeroVideo({
  className,
  src = DEFAULT_VIDEO_SRC,
  posterSrc = DEFAULT_POSTER_SRC,
}: HeroVideoProps) {
  const mediaSrc = src || DEFAULT_VIDEO_SRC;
  const isVideo = isVideoFile(mediaSrc);

  if (!isVideo) {
    return (
      <div
        className={className}
        style={{ backgroundImage: `url(${mediaSrc})`, backgroundSize: "cover", backgroundPosition: "center" }}
      />
    );
  }

  return (
    <video
      className={className}
      autoPlay
      muted
      loop
      playsInline
      poster={posterSrc}
      preload="auto"
    >
      <source src={mediaSrc} />
    </video>
  );
}
