import React from 'react';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  declare readonly props: Readonly<AppErrorBoundaryProps>;
  declare setState: (state: AppErrorBoundaryState) => void;

  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('D LEAGUE page render failed', error, info);
  }

  private retry = (): void => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-[70vh] items-center bg-white px-4 py-16 md:px-12">
        <div className="mx-auto w-full max-w-3xl text-center">
          <p className="font-display text-sm font-black uppercase tracking-[0.25em] text-brand-blue">
            D LEAGUE
          </p>
          <h1 className="mt-4 font-display text-3xl font-black uppercase tracking-tight text-brand-black md:text-5xl">
            資料暫時無法載入
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-7 text-neutral-500 md:text-base">
            頁面發生非預期錯誤，請重新載入；若問題持續，請返回首頁
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={this.retry}
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brand-black px-6 text-sm font-black text-white transition-colors hover:bg-brand-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
            >
              重新載入
            </button>
            <a
              href={import.meta.env.BASE_URL}
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-neutral-300 px-6 text-sm font-black text-brand-black transition-colors hover:border-brand-blue hover:text-brand-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
            >
              返回首頁
            </a>
          </div>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
