"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  children: ReactNode;
  tabLabel: string;
};

type State = { hasError: boolean };

export class SettingsPanelBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV === "development") {
      console.error(`[Settings:${this.props.tabLabel}]`, error, info.componentStack);
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.tabLabel !== this.props.tabLabel && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center"
          role="alert"
        >
          <AlertCircle className="mx-auto size-8 text-destructive" aria-hidden />
          <h3 className="mt-3 text-sm font-medium">
            Could not load {this.props.tabLabel}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Try switching tabs or refreshing the page.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
