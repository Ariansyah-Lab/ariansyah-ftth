import Link from "next/link";

export default function Header() {
  return (
    <header
      className="
        absolute
        left-0
        top-0
        z-20
        px-10
        py-6
      "
    >
      <Link
        href="/"
        className="
          text-2xl
          font-medium
          tracking-wide
          text-white
        "
      >
        Ariansyah-Lab
      </Link>
    </header>
  );
}