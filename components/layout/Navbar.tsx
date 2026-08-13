"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import MobileNav from "./MobileNav";
import PuterUsageBadge from "./PuterUsageBadge";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { logout } from "@/store/authSlice";

export default function Navbar() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  const handleLogout = async () => {
    await dispatch(logout());
    router.push("/login");
  };

  return (
    <>
      <nav className="border-b border-hairline bg-canvas">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-base font-semibold text-ink"
            >
              Flowpath
            </Link>
            <div className="hidden items-center gap-6 md:flex">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-body hover:text-ink"
              >
                Dashboard
              </Link>
              <Link
                href="/workflows"
                className="text-sm font-medium text-body hover:text-ink"
              >
                Workflows
              </Link>
              <Link
                href="/chat"
                className="text-sm font-medium text-body hover:text-ink"
              >
                Chat
              </Link>
              <Link
                href="/executions"
                className="text-sm font-medium text-body hover:text-ink"
              >
                Executions
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted sm:inline">
              {user?.firstName} {user?.lastName}
            </span>
            <PuterUsageBadge />
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-body hover:text-ink cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>
      <MobileNav />
    </>
  );
}
