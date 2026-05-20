"use client";

import { useCallback, useState } from "react";

import { signInWithGoogle } from "@/lib/auth/oauth";

export function useGoogleAuth() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = useCallback(async () => {
    if (isGoogleLoading) {
      return;
    }

    setIsGoogleLoading(true);

    const result = await signInWithGoogle();

    if (result.error) {
      setIsGoogleLoading(false);
    }
  }, [isGoogleLoading]);

  return { handleGoogleSignIn, isGoogleLoading };
}
