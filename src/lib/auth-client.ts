// src/lib/auth-client.ts
export function logout(): void {
  if (typeof window === 'undefined') return;   
  localStorage.removeItem('token');           
  
}