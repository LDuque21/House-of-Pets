import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PetForm } from "@/components/pet-form";

export default function NewPetPage() {
  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-4 py-10 sm:px-6">
      <Link
        href="/pets"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Your pets
      </Link>
      <h1 className="mt-4 text-3xl font-semibold">Who&apos;s joining the family?</h1>
      <p className="mt-2 text-muted-foreground">
        Upload a photo and we&apos;ll fill in the details for you, or enter them yourself.
      </p>
      <div className="mt-8">
        <PetForm />
      </div>
    </div>
  );
}
