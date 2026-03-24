import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'AskElira — Swarm Intelligence for Better Decisions',
  description:
    '10,000-agent debates that dissect your toughest decisions. Research, debate, audit, synthesize — in seconds.',
  keywords: [
    'AI',
    'swarm intelligence',
    'decision making',
    'multi-agent',
    'debate',
  ],
  openGraph: {
    title: 'AskElira',
    description: 'What decision are you tired of making?',
    url: 'https://askelira.com',
    siteName: 'AskElira',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
