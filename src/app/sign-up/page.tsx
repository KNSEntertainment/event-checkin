import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Sign Up</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create an account to start managing events
          </p>
        </div>
        <SignUp 
          forceRedirectUrl="/create-event"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  );
}
