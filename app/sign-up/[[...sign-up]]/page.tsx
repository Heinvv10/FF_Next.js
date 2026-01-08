import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--ff-bg-primary)]">
      <SignUp
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
