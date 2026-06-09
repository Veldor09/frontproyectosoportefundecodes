// src/app/ClientProviders.tsx
"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools"; // opcional
import { Toaster } from "sonner";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  // crea un único QueryClient por sesión de la app
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
