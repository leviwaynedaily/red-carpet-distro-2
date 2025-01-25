import { InstallPWA } from "./InstallPWA";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <InstallPWA />
    </>
  );
} 