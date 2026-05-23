import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Allo Reservations',
  description: 'Inventory reservation demo for multi-warehouse stock.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-slate-50">
          <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
