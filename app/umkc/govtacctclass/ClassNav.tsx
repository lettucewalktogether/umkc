"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { course, nav } from "@/lib/course";

export default function ClassNav() {
  const pathname = usePathname();

  return (
    <header className="masthead">
      <div className="masthead-inner">
        <Link href={course.basePath} className="wordmark">
          Govt Accounting
        </Link>
        <nav aria-label="Course sections">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
