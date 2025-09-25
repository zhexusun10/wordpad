"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type Item = { href: string; label: string };

export default function SidebarNav({ items }: { items: ReadonlyArray<Item> }) {
  const pathname = usePathname();
  return (
    <div className="space-y-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "block rounded-md px-3 py-2 text-sm font-medium transition-colors border focus-visible:outline-none select-none",
              active
                ? "bg-neutral-100 text-neutral-900 shadow-sm border-neutral-200"
                : "text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 border-transparent"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}


