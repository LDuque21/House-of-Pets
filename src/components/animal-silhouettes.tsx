import type { Species } from "@/lib/pets";
import { cn } from "@/lib/utils";

// Species with a mask in public/silhouettes/. Add one here when its art lands.
const HAS_ARTWORK = new Set<Species>([
  "dog", "cat", "rabbit", "fish", "bird", "horse", "reptile", "hamster", "guinea_pig", "rat", "chinchilla", "raccoon",
]);

// The user's silhouette artwork, cut into one tight-cropped mask per species
// (public/silhouettes/<species>.png). Rendered as a CSS mask over
// currentColor, so each takes whatever text color it's given (theme tokens,
// species tints). The box is square; the animal is fitted inside it.
export function AnimalSilhouette({
  species,
  className,
  align = "bottom",
}: {
  species: Species;
  className?: string;
  align?: "bottom" | "center";
}) {
  // Species still waiting on artwork get a paw print in the same box.
  if (!HAS_ARTWORK.has(species)) {
    return (
      <span aria-hidden className={cn("inline-grid aspect-square shrink-0 place-items-center", className)}>
        <PawPrint className="w-[78%]" />
      </span>
    );
  }
  const url = `url(/silhouettes/${species}.png)`;
  const position = align === "center" ? "center" : "center bottom";
  return (
    <span
      aria-hidden
      className={cn("inline-block aspect-square shrink-0 bg-current", className)}
      style={{
        maskImage: url,
        WebkitMaskImage: url,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: position,
        WebkitMaskPosition: position,
      }}
    />
  );
}

export function PawPrint({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" aria-hidden className={className}>
      <path d="M50 52 C 64 52, 76 64, 74 76 C 72 86, 62 86, 50 83 C 38 86, 28 86, 26 76 C 24 64, 36 52, 50 52 Z" />
      <ellipse cx="27" cy="42" rx="7" ry="9" transform="rotate(-20 27 42)" />
      <ellipse cx="41" cy="29" rx="7" ry="9.5" transform="rotate(-6 41 29)" />
      <ellipse cx="59" cy="29" rx="7" ry="9.5" transform="rotate(6 59 29)" />
      <ellipse cx="73" cy="42" rx="7" ry="9" transform="rotate(20 73 42)" />
    </svg>
  );
}

// Full class strings (not built dynamically) so Tailwind generates them.
export const SPECIES_TINTS: Record<Species, { text: string; avatar: string }> = {
  dog: { text: "text-dog", avatar: "bg-dog-soft text-dog" },
  cat: { text: "text-cat", avatar: "bg-cat-soft text-cat" },
  rabbit: { text: "text-rabbit", avatar: "bg-rabbit-soft text-rabbit" },
  fish: { text: "text-fish", avatar: "bg-fish-soft text-fish" },
  bird: { text: "text-bird", avatar: "bg-bird-soft text-bird" },
  horse: { text: "text-horse", avatar: "bg-horse-soft text-horse" },
  reptile: { text: "text-reptile", avatar: "bg-reptile-soft text-reptile" },
  hamster: { text: "text-hamster", avatar: "bg-hamster-soft text-hamster" },
  guinea_pig: { text: "text-guinea-pig", avatar: "bg-guinea-pig-soft text-guinea-pig" },
  rat: { text: "text-rat", avatar: "bg-rat-soft text-rat" },
  chinchilla: { text: "text-chinchilla", avatar: "bg-chinchilla-soft text-chinchilla" },
  raccoon: { text: "text-raccoon", avatar: "bg-raccoon-soft text-raccoon" },
};

// Round avatar: the pet's own photo if they uploaded one, otherwise the
// species silhouette. Set its size with a size-* class.
export function PetAvatar({
  species,
  photoUrl,
  className,
}: {
  species: Species;
  photoUrl?: string | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full",
        SPECIES_TINTS[species].avatar,
        className
      )}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- a stored data: URL, nothing to optimize
        <img src={photoUrl} alt="" className="size-full object-cover" />
      ) : (
        <AnimalSilhouette species={species} align="center" className="w-[64%]" />
      )}
    </span>
  );
}
