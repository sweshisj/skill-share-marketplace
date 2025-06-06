// frontend/src/app/page.tsx
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800">
      <h1 className="text-5xl font-bold mb-6 text-blue-700">Welcome to SkillShare Marketplace</h1>
      <p className="text-xl mb-8 text-center max-w-2xl">
        Connect with skilled providers or find tasks for your expertise.
      </p>
      <div className="space-x-4">
        <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300">
          Login
        </Link>
        <Link href="/signup" className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300">
          Sign Up
        </Link>
      </div>
    </div>
  );
}