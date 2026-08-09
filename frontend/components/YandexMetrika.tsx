'use client';

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const METRIKA_ID = 111230462;

interface CustomWindow extends Window {
  ym?: (id: number, action: string, ...args: unknown[]) => void;
}

function MetrikaTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const customWindow = window as CustomWindow;
      if (typeof customWindow.ym === "function") {
        const url = `${pathname}${searchParams.toString() ? "?" + searchParams.toString() : ""}`;
        customWindow.ym(METRIKA_ID, "hit", url);
      }
    }
  }, [pathname, searchParams]);

  return null;
}

export default function YandexMetrika() {
  return (
    <Suspense fallback={null}>
      <MetrikaTracker />
    </Suspense>
  );
}
