import Link from "next/link";
import { SignedIn, SignedOut } from "@neondatabase/auth-ui";
import { ArrowRight } from "lucide-react";
import { AnimalSilhouette, PawPrint, SPECIES_TINTS } from "@/components/animal-silhouettes";
import { CATEGORY_META, CATEGORY_ORDER } from "@/components/category-meta";
import { buttonVariants } from "@/components/ui/button";
import { SPECIES } from "@/lib/pets";
import { SPECIES_LABELS } from "@/lib/format";

const STEPS = [
  {
    title: "Tell us about your pet",
    body: "Species, breed, age, and anything special about them. It takes a minute.",
  },
  {
    title: "Get a care plan in seconds",
    body: "Five specialist AI agents each write one part of the plan, all at the same time.",
  },
  {
    title: "Keep up with daily care",
    body: "Feeding, grooming, and vet visits become a simple checklist of what's due next.",
  },
];

function HeroArt() {
  return (
    <div aria-hidden className="relative mx-auto aspect-[5/4] w-full max-w-md">
      <div
        className="absolute inset-[4%] bg-secondary"
        style={{ borderRadius: "42% 58% 55% 45% / 52% 45% 55% 48%" }}
      />
      <PawPrint className="absolute left-[10%] top-[10%] size-8 -rotate-12 text-primary/25" />
      <PawPrint className="absolute right-[14%] top-[8%] size-6 rotate-12 text-primary/20" />
      <PawPrint className="absolute right-[6%] top-[42%] size-7 rotate-45 text-primary/25" />
      <div className="absolute inset-x-[12%] bottom-[16%] flex items-end justify-center gap-1">
        <AnimalSilhouette species="dog" className="w-[40%] text-dog" />
        <AnimalSilhouette species="cat" className="w-[31%] text-cat" />
        <AnimalSilhouette species="rabbit" className="w-[29%] text-rabbit" />
      </div>
      <div className="absolute inset-x-[14%] bottom-[15%] h-1.5 rounded-full bg-foreground/10" />
    </div>
  );
}

export default function Home() {
  return (
    <div>
      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 md:grid-cols-2 md:py-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">
            <PawPrint className="size-4 text-primary" />
            For new pet parents
          </span>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            A happy, healthy home for every pet.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            Dog, cat, bird, fish, or something scalier: tell us about your pet and get a
            personalized care plan, from diet and grooming to vet visits and insurance, plus a
            checklist of the care they need.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <SignedOut>
              <Link href="/auth/sign-up" className={buttonVariants({ size: "xl" })}>
                Get started
                <ArrowRight />
              </Link>
              <Link href="/auth/sign-in" className={buttonVariants({ size: "xl", variant: "outline" })}>
                I have an account
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/pets" className={buttonVariants({ size: "xl" })}>
                Go to your pets
                <ArrowRight />
              </Link>
            </SignedIn>
          </div>
        </div>
        <HeroArt />
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6">
        <h2 className="text-center text-2xl font-semibold">Made for every kind of pet</h2>
        <ul className="mt-8 grid grid-cols-4 gap-x-4 gap-y-6 sm:grid-cols-6">
          {SPECIES.map((species) => (
            <li key={species} className="flex flex-col items-center gap-2">
              <AnimalSilhouette species={species} className={`w-14 sm:w-16 ${SPECIES_TINTS[species].text}`} />
              <span className="text-sm font-semibold text-muted-foreground">{SPECIES_LABELS[species]}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-border/70 bg-card/60">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-center text-3xl font-semibold">Everything in one plan</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            Each part comes from its own specialist, tuned to your pet&apos;s species, breed, and age.
          </p>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {CATEGORY_ORDER.map((category) => {
              const { label, Icon, tint, blurb } = CATEGORY_META[category];
              return (
                <li key={category} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <span className={`grid size-11 place-items-center rounded-xl ${tint}`}>
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{label}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-center text-3xl font-semibold">How it works</h2>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-2xl bg-secondary/70 p-6">
              <span className="grid size-10 place-items-center rounded-full bg-primary font-heading text-lg font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="mt-1 text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
