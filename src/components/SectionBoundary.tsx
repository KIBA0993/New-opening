"use client";
import { Component, type ReactNode } from "react";

/**
 * Keeps one failed part of the free check from taking down the whole page (and the buy button
 * with it). Without this, any error in a streamed section replaces the page with Next's
 * "Application error" screen.
 */
export class SectionBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("report section failed", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="status" className="card mt-8 p-6">
        <p className="text-ink-2">This part of your check didn&apos;t load. Refresh the page in a minute to try again.</p>
      </div>
    );
  }
}
