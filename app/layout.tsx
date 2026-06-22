import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Lensa Suara',
  description: 'Vision Assist - Aplikasi berbasis AI untuk membantu pengguna dengan kebutuhan khusus dalam mengenali objek, membaca teks, dan memahami lingkungan sekitar melalui suara.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
