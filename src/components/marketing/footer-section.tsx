import Link from "next/link";

import { RecalliqLogo } from "@/components/brand";
import { BRAND } from "@/lib/brand/config";

const links = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/login", label: "Sign in" },
  { href: "/signup", label: "Sign up" },
] as const;

export function FooterSection() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-10 md:flex-row md:px-8">
        <RecalliqLogo size="sm" />
        <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-muted-foreground" suppressHydrationWarning>
          © {new Date().getFullYear()} {BRAND.name}. {BRAND.tagline}
        </p>
      </div>
    </footer>
  );
}
