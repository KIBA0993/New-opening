import type { Metadata } from "next";
import { Suspense } from "react";
import { StartFlow } from "./StartFlow";

export const metadata: Metadata = { title: "Free check", robots: { index: false } };

export default function StartPage() {
  return (
    <Suspense>
      <StartFlow />
    </Suspense>
  );
}
