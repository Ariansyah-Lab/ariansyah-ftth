import Link from "next/link";

export default function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-30 px-5 pt-7 sm:px-10 lg:px-20">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full bg-[#dedfe1] px-5 py-3.5 text-[#3f4043] shadow-[7px_7px_14px_#bfc0c3,-7px_-7px_14px_#f7f7f8] sm:px-6">
        <Link
          href="/"
          className="text-sm font-medium tracking-[-0.02em] transition-opacity hover:opacity-60"
        >
          Ariansyah-Lab
        </Link>

        <a
          href="https://www.linkedin.com/in/ahmadariansyah/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium transition-opacity hover:opacity-60 sm:text-sm"
        >
          Contact
        </a>
      </div>
    </header>
   );
}
