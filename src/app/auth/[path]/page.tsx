"use client";

import { AuthView } from "@neondatabase/auth-ui";
import { use } from "react";
import { AnimalSilhouette } from "@/components/animal-silhouettes";

export default function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = use(params);
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
      <div aria-hidden className="flex items-end gap-1.5">
        <AnimalSilhouette species="dog" className="size-14 text-dog" />
        <AnimalSilhouette species="cat" className="size-12 text-cat" />
        <AnimalSilhouette species="rabbit" className="size-12 text-rabbit" />
      </div>
      <AuthView path={path} />
    </div>
  );
}
