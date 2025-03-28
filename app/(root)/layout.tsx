import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { isAuthenticated } from "@/lib/actions/auth.action";

const Layout = async ({ children }: { children: ReactNode }) => {
  const isUserAuthenticated = await isAuthenticated();
  if (!isUserAuthenticated) redirect("/sign-in");

  return (
    <div className="root-layout">
      <nav className="flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="YourHiredAI Logo"
            width={40}
            height={40}
          />
          <h2 className="text-primary-100">YourHiredAI</h2>
        </Link>

        {/* Optional: Add navigation links or user menu here */}
      </nav>

      <main className="flex-1">{children}</main>

      <footer className="mt-auto py-8 border-t border-input">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="https://beroniinnovations.com"
              target="_blank"
              className="hover:opacity-80 transition-opacity"
            >
              <div className="relative h-8 w-8">
                {" "}
                {/* 1:1 container */}
                <Image
                  src="/B.png"
                  alt="Beroni Innovations Logo"
                  fill
                  className="object-contain" // Maintains aspect ratio
                  priority
                />
              </div>
            </Link>
            <span className="text-light-400 text-sm">
              Built by{" "}
              <span className="text-light-400 text-sm">Beroni Innovations</span>
            </span>
          </div>

          <div className="text-light-400 text-sm">
            <p>Inspired by JS Mastery tutorial</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
