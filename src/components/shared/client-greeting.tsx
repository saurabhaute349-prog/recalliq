"use client";

import { useEffect, useState } from "react";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

type ClientGreetingProps = {
  className?: string;
};

export function ClientGreeting({ className }: ClientGreetingProps) {
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  return (
    <p className={className} suppressHydrationWarning>
      {greeting}
    </p>
  );
}
