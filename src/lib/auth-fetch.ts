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
    
    // Redirect to sign-in page
    if (typeof window !== 'undefined') {
      // Store the current URL to redirect back after sign-in
      sessionStorage.setItem('redirectAfterAuth', window.location.pathname + window.location.search);
      window.location.href = '/auth/signin';
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