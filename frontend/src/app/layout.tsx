// frontend/src/app/layout.tsx (Example - your file might look slightly different)
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Your global styles
import { AuthProvider } from '../context/AuthContext'; // <--- Import AuthProvider

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SkillShare App',
  description: 'Connects individuals and companies for tasks and skills.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider> {/* <--- Wrap your entire app with AuthProvider here! */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}