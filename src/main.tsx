import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

console.log('Application initialization starting in environment:', import.meta.env.MODE);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      meta: {
        onError: (error: Error) => {
          console.error('Query error:', error);
        }
      }
    },
  },
});

// Initialize deferredPrompt for use later to show browser install prompt.
declare global {
  interface Window {
    deferredPrompt: any;
  }
}

window.deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('PWA: beforeinstallprompt event fired');
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later.
  window.deferredPrompt = e;
});

window.addEventListener('appinstalled', () => {
  console.log('PWA: Application was installed');
  window.deferredPrompt = null;
});

// Ensure page starts at the top
window.addEventListener('load', () => {
  console.log('PWA: Scrolling to top on load');
  window.scrollTo(0, 0);
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    console.log('Attempting to register service worker...');
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New content is available; please refresh.');
              }
            });
          }
        });
      })
      .catch(err => {
        console.error('ServiceWorker registration failed: ', err);
      });
  });
} else {
  console.log('ServiceWorker is not supported in this browser');
}

console.log('Mounting React application...');

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);

console.log('React application mounted');