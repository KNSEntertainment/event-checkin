import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Sign In</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to create and manage your events
          </p>
        </div>
        <SignIn 
          // forceRedirectUrl="/create-event"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  );
}
