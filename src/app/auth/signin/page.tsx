"use client";

import { signIn, getSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const session = await getSession();
      if (session) {
        router.push("/playlists");
      }
    };
    checkAuth();

    // URLからエラーパラメータを取得
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(`認証エラー: ${errorParam}`);
    }
  }, [router, searchParams]);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signIn("google", { 
        callbackUrl: "/playlists",
        redirect: false 
      });
      if (result?.error) {
        setError(`サインインエラー: ${result.error}`);
      }
    } catch (error) {
      console.error("サインインエラー:", error);
      setError("予期しないエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            YouTube プレイリスト エディター
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            YouTubeアカウントでサインインして、プレイリストを管理しましょう
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
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {isLoading ? "サインイン中..." : "YouTubeでサインイン"}
          </button>
        </div>
      </div>
    </div>
  );
}