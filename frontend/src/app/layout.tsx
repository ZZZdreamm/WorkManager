import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WorkFlex — Employees',
  description: 'WorkFlex employees & projects management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-4">
            <h1 className="text-lg font-semibold tracking-tight">
              WorkFlex<span className="text-gray-400"> / employees</span>
            </h1>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
