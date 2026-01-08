import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--ff-bg-primary)]">
      <SignIn
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'bg-[var(--ff-bg-secondary)] border border-[var(--ff-border-light)]',
          }
        }}
      />
    </div>
  );
}
