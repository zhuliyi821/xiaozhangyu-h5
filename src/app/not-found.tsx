import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg p-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-gold/10">
        <svg className="h-10 w-10 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="mb-2 text-4xl font-semibold text-text">404</h1>
      <h2 className="mb-2 text-lg font-medium text-text">页面不存在</h2>
      <p className="mb-8 text-sm text-text-tertiary">
        你访问的页面不存在或已被移除。
      </p>
      <Link
        href="/"
        className="rounded-xl bg-brand-teal px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-teal-dark transition-all"
      >
        返回首页
      </Link>
    </div>
  );
}
