import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { isAuthenticated, getCurrentUser } from "@/lib/actions/auth.action";

const Layout = async ({ children }: { children: ReactNode }) => {
  const isUserAuthenticated = await isAuthenticated();
  if (!isUserAuthenticated) redirect("/sign-in");

  const user = await getCurrentUser();
  const userRole = user?.role || 'candidate';
  const isBusiness = userRole === 'business' || userRole === 'admin';
  const isCandidate = userRole === 'candidate';

  return (
    <div className="root-layout">
      <nav className="flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="GetHiredAI Logo" width={40} height={40} />
          <h2 className="text-primary-100">GetHiredAI</h2>
        </Link>

        {/* NEW: Conditional Navigation */}
        <div className="flex gap-4">
            {isCandidate && (
                <>
                    <Link href="/jobs" className="text-light-100 hover:text-primary-200">Jobs</Link>
                    <Link href="/gigs" className="text-light-100 hover:text-primary-200">Gigs</Link>
                    <Link href="/interview" className="text-light-100 hover:text-primary-200">Practice</Link>
                </>
            )}
            {isBusiness && (
                <>
                    <Link href="/business/post" className="text-light-100 hover:text-primary-200">Post</Link>
                    <Link href="/business/applications" className="text-light-100 hover:text-primary-200">Applications</Link>
                    <Link href="/business/analytics" className="text-light-100 hover:text-primary-200">Analytics</Link>
                    <Link href="/business/exit-start" className="text-light-100 hover:text-primary-200">Exit Interview</Link>
                </>
            )}
            {/* Live Chat for all users who are logged in */}
            <Link href="/messages" className="text-light-100 hover:text-primary-200">Chat</Link>
        </div>
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
