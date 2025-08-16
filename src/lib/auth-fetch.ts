/**
 * Enhanced fetch function that handles authentication errors
 */
export async function authFetch(url: string, options?: RequestInit): Promise<Response> {
  const response = await fetch(url, options);
  
  // Handle authentication errors
  if (response.status === 401) {
    const data = await response.json().catch(() => ({ error: "Authentication failed" }));
    
    // Show user-friendly error message
    console.error("Authentication error:", data.error);
    
    // Only redirect if we're not already on the signin page to prevent loops
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/signin')) {
      // Store the current URL to redirect back after sign-in
      sessionStorage.setItem('redirectAfterAuth', window.location.pathname + window.location.search);
      
      // Use router push instead of direct window.location to prevent hard refreshes
      const { signOut } = await import('next-auth/react');
      await signOut({ callbackUrl: '/auth/signin', redirect: true });
      return response; // This won't be reached but satisfies TypeScript
    }
    
    throw new Error(data.error || "Authentication failed");
  }
  
  return response;
}

/**
 * Enhanced fetch function specifically for JSON APIs with authentication
 */
export async function authFetchJson<T = unknown>(url: string, options?: RequestInit): Promise<T> {
  const response = await authFetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}