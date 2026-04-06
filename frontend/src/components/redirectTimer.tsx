"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectTimer({ url }: { url: string }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(url);
    }, 5000);

    return () => clearTimeout(timer);
  }, [url, router]);

  return null;
}
