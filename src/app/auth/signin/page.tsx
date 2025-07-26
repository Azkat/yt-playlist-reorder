"use client";

import { signIn, getSession } from "next-auth/react";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const session = await getSession();
      if (session) {
        // Check for stored redirect URL
        const redirectUrl = sessionStorage.getItem('redirectAfterAuth') || "/playlists";
        sessionStorage.removeItem('redirectAfterAuth');
        router.push(redirectUrl);
      }
    };
    checkAuth();

    // Get error parameter from URL
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(`Authentication error: ${errorParam}`);
    }
  }, [router, searchParams]);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use stored redirect URL or default to playlists
      const redirectUrl = sessionStorage.getItem('redirectAfterAuth') || "/playlists";
      const result = await signIn("google", { 
        callbackUrl: redirectUrl,
        redirect: false 
      });
      if (result?.error) {
        setError(`Sign-in error: ${result.error}`);
      }
    } catch (error) {
      console.error("Sign-in error:", error);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            YouTube Playlist Editor
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in with your YouTube account to manage playlists
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}
        
        <div>
          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-youtube-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-youtube-red disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Sign in with YouTube"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Loading...</div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}