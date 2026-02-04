import { LoginForm } from '@/features/auth';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <LoginForm />
    </div>
  );
}
