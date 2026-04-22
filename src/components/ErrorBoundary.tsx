"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message =
      error instanceof Error ? error.message : "Произошла неизвестная ошибка";
    return { hasError: true, message };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          role="alert"
          className="rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-5 text-sm text-red-400"
        >
          <p className="mb-1 font-semibold">Ошибка при отображении результатов</p>
          <p className="text-red-400/70">{this.state.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
