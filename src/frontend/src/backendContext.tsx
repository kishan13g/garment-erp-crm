import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import type { backendInterface } from "./backend";
import { createActorWithConfig } from "./config";

const BackendContext = createContext<backendInterface | null>(null);

export function BackendProvider({ children }: { children: ReactNode }) {
  const [actor, setActor] = useState<backendInterface | null>(null);

  useEffect(() => {
    createActorWithConfig().then(setActor).catch(console.error);
  }, []);

  return (
    <BackendContext.Provider value={actor}>{children}</BackendContext.Provider>
  );
}

export function useBackend(): backendInterface {
  const ctx = useContext(BackendContext);
  if (!ctx) throw new Error("No backend");
  return ctx;
}
