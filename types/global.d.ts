export {}; // Ensures this is treated as a module

declare global {
  interface Window {
    Pusher: any; // ✅ Define Pusher globally for TypeScript
  }
}
