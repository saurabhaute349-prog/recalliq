"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

type ErrorBoundaryProps = {
  children: ReactNode;
  fallbackTitle?: string;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ErrorBoundary]", error, info.componentStack);
    }
    void import("@/lib/monitoring/client").then(({ captureClientException }) => {
      captureClientException(error, {
        componentStack: info.componentStack,
        boundary: this.props.fallbackTitle ?? "default",
      });
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card p-8 text-center"
          role="alert"
        >
          <h2 className="text-lg font-semibold">
            {this.props.fallbackTitle ?? "Something went wrong"}
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            This section could not load. Try refreshing the page.
          </p>
          <Button
            type="button"
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
          >
            Reload
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
