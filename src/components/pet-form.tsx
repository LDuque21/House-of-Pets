"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, LoaderCircle, LocateFixed, MapPin, Sparkles, Trash2, TriangleAlert, X } from "lucide-react";
import { createPetAction, deletePetAction, identifyPetAction, updatePetAction } from "@/app/pets/actions";
import { AnimalSilhouette, SPECIES_TINTS } from "@/components/animal-silhouettes";
import { SubmitButton } from "@/components/submit-button";
import { buttonVariants } from "@/components/ui/button";
import type { Identification } from "@/lib/agents/vision";
import { SPECIES_LABELS } from "@/lib/format";
import type { AgeStage, Confidence, Pet, Species } from "@/lib/pets";
import { cn } from "@/lib/utils";

// Kept local (not imported from lib/pets, which pulls in the database pool).
const SPECIES_ORDER: Species[] = ["dog", "cat", "rabbit", "fish", "bird", "horse", "reptile", "hamster"];
const AGE_OPTIONS: { value: AgeStage; label: string; hint: string }[] = [
  { value: "baby", label: "Baby", hint: "Still little" },
  { value: "adult", label: "Adult", hint: "All grown up" },
  { value: "senior", label: "Senior", hint: "Golden years" },
];

const inputClass =
  "w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";
// The radio input covers its whole tile (invisible), so clicks, keyboard
// focus and the browser's "required" bubble all land on the tile.
const tileInputClass = "peer absolute inset-0 z-10 cursor-pointer opacity-0";
const tileClass =
  "rounded-2xl border-2 border-border bg-background transition peer-hover:border-primary/40 peer-checked:border-primary peer-checked:bg-secondary peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50";

// Downscale in the browser so the stored photo (a data: URL in the database)
// and the image sent to Gemini both stay small.
async function resizePhoto(file: File, maxSide = 640): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}

function Label({ htmlFor, optional, children }: { htmlFor?: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-semibold">
      {children}
      {optional && <span className="font-normal text-muted-foreground"> (optional)</span>}
    </label>
  );
}

const CONFIDENCE_TEXT: Record<Confidence, string> = {
  high: "Pretty sure",
  medium: "Fairly sure",
  low: "Not very sure",
};

export function PetForm({ pet }: { pet?: Pet }) {
  const editing = Boolean(pet);
  const fileInput = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState(pet?.photo_url ?? "");
  const [species, setSpecies] = useState<Species | "">(pet?.species ?? "");
  const [breed, setBreed] = useState(pet?.breed ?? "");
  const [ageStage, setAgeStage] = useState<AgeStage | "">(pet?.age_stage ?? "");
  const [confidence, setConfidence] = useState<Confidence | "">(pet?.confidence ?? "");
  const [identification, setIdentification] = useState<Identification | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [identifying, startIdentify] = useTransition();
  const [locationLabel, setLocationLabel] = useState(pet?.location_label ?? "");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    pet?.latitude != null && pet?.longitude != null ? { lat: pet.latitude, lng: pet.longitude } : null
  );
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  async function onPhotoChosen(file: File | undefined) {
    if (!file) return;
    setPhotoError("");
    setIdentification(null);
    let dataUrl: string;
    try {
      dataUrl = await resizePhoto(file);
    } catch {
      setPhotoError("We couldn't read that image. Try a JPG or PNG.");
      return;
    }
    setPhoto(dataUrl);
    // New pets: let the vision agent fill in the details. Editing only swaps the photo.
    if (editing) return;
    startIdentify(async () => {
      const result = await identifyPetAction(dataUrl);
      setIdentification(result);
      if (result.ok) {
        setSpecies(result.species);
        setBreed(result.breed ?? "");
        setAgeStage(result.age_stage);
        setConfidence(result.confidence);
      }
    });
  }

  function locateMe() {
    setLocationError("");
    if (!("geolocation" in navigator)) {
      setLocationError("Your browser can't share its location. Type a city or ZIP instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: Math.round(position.coords.latitude * 1e4) / 1e4,
          lng: Math.round(position.coords.longitude * 1e4) / 1e4,
        });
        setLocationLabel((label) => label || "My current location");
        setLocating(false);
      },
      () => {
        setLocationError("We couldn't get your location. Type a city or ZIP instead.");
        setLocating(false);
      },
      { timeout: 10_000 }
    );
  }

  return (
    <form
      action={editing ? updatePetAction : createPetAction}
      className="space-y-7 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8"
    >
      {pet && <input type="hidden" name="pet_id" value={pet.id} />}
      <input type="hidden" name="photo" value={photo} />
      <input type="hidden" name="confidence" value={confidence} />
      <input type="hidden" name="latitude" value={coords?.lat ?? ""} />
      <input type="hidden" name="longitude" value={coords?.lng ?? ""} />

      <div>
        <p className="text-sm font-semibold">Photo</p>
        <div className="mt-2 flex items-center gap-4">
          <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary text-primary">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element -- a local data: URL, nothing to optimize
              <img src={photo} alt="Your pet" className="size-full object-cover" />
            ) : (
              <Camera className="size-7" />
            )}
          </span>
          <div className="flex flex-col items-start gap-1.5">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={identifying}
                className={buttonVariants({ variant: "outline", size: "pill" })}
              >
                <Camera />
                {photo ? "Choose another photo" : "Upload a photo"}
              </button>
              {photo && (
                <button
                  type="button"
                  onClick={() => {
                    setPhoto("");
                    setIdentification(null);
                  }}
                  className={buttonVariants({ variant: "ghost", size: "pill" })}
                >
                  <X />
                  Remove
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {editing
                ? "Shown instead of the species silhouette."
                : "Optional. We'll identify your pet from it and fill in the details."}
            </p>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void onPhotoChosen(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>

        {identifying && (
          <p className="mt-3 flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            Taking a look at your pet…
          </p>
        )}
        {!identifying && identification?.ok && (
          <p className="mt-3 flex items-start gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              <span className="font-semibold">Looks like a {identification.detected}.</span>{" "}
              {CONFIDENCE_TEXT[identification.confidence]}. We filled in the details below; check them before saving.
            </span>
          </p>
        )}
        {!identifying && (identification?.ok === false || photoError) && (
          <p role="alert" className="mt-3 flex items-start gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            {photoError || (identification?.ok === false && identification.error)}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <input id="name" name="name" required defaultValue={pet?.name} placeholder="e.g. Biscuit" className={inputClass} />
      </div>

      <fieldset>
        <legend className="text-sm font-semibold">Species</legend>
        <div className="mt-2 grid grid-cols-4 gap-2 sm:gap-3">
          {SPECIES_ORDER.map((option) => (
            <label key={option} className="relative">
              <input
                type="radio"
                name="species"
                value={option}
                required
                checked={species === option}
                onChange={() => setSpecies(option)}
                className={tileInputClass}
              />
              <span className={cn(tileClass, "flex flex-col items-center gap-1.5 px-1 py-3")}>
                <AnimalSilhouette species={option} className={cn("w-11 sm:w-12", SPECIES_TINTS[option].text)} />
                <span className="font-heading text-sm font-semibold">{SPECIES_LABELS[option]}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="breed" optional>
          Breed
        </Label>
        <input
          id="breed"
          name="breed"
          value={breed}
          onChange={(e) => setBreed(e.target.value)}
          placeholder="e.g. Holland Lop, budgie, leopard gecko"
          className={inputClass}
        />
      </div>

      <fieldset>
        <legend className="text-sm font-semibold">Age</legend>
        <div className="mt-2 grid grid-cols-3 gap-3">
          {AGE_OPTIONS.map((option) => (
            <label key={option.value} className="relative">
              <input
                type="radio"
                name="age_stage"
                value={option.value}
                required
                checked={ageStage === option.value}
                onChange={() => setAgeStage(option.value)}
                className={tileInputClass}
              />
              <span className={cn(tileClass, "flex h-full flex-col px-3 py-3")}>
                <span className="font-heading font-semibold">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.hint}</span>
              </span>
            </label>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <label htmlFor="age_years" className="text-sm text-muted-foreground">
            Know the exact age?
          </label>
          <input
            id="age_years"
            name="age_years"
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            defaultValue={pet?.age_years ?? ""}
            placeholder="e.g. 8"
            className={cn(inputClass, "w-24")}
          />
          <span className="text-sm text-muted-foreground">years</span>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Optional. Helps us time age-based screenings, like checkups that start at a certain age.
        </p>
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="conditions" optional>
          Health conditions
        </Label>
        <input
          id="conditions"
          name="conditions"
          maxLength={300}
          defaultValue={pet?.conditions ?? ""}
          placeholder="e.g. diabetes, arthritis, chicken allergy"
          className={inputClass}
        />
        <p className="text-xs text-muted-foreground">
          Separate with commas. Every part of the care plan takes these into account.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="location_label" optional>
          Where does your pet live?
        </Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="location_label"
              name="location_label"
              value={locationLabel}
              onChange={(e) => setLocationLabel(e.target.value)}
              placeholder="City or ZIP, e.g. Miami, FL"
              className={cn(inputClass, "pl-9")}
            />
          </div>
          <button
            type="button"
            onClick={locateMe}
            disabled={locating}
            className={buttonVariants({ variant: "outline", size: "pill" })}
          >
            {locating ? <LoaderCircle className="animate-spin" /> : <LocateFixed />}
            Use my location
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {coords
            ? `Using your GPS position (${coords.lat}, ${coords.lng}). `
            : "Used to find stores near you for the supplies in the care plan. "}
          {coords && (
            <button type="button" onClick={() => setCoords(null)} className="font-semibold underline underline-offset-2">
              Clear
            </button>
          )}
        </p>
        {locationError && <p className="text-xs font-semibold text-destructive">{locationError}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes" optional>
          Anything else we should know?
        </Label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={pet?.notes ?? ""}
          placeholder="Temperament, indoor or outdoor, picky eater…"
          className={inputClass}
        />
      </div>

      <SubmitButton
        className={cn(buttonVariants({ size: "xl" }), "w-full")}
        pendingLabel={
          <>
            <LoaderCircle className="animate-spin" />
            Saving…
          </>
        }
      >
        {editing ? "Save changes" : "Add to the family"}
      </SubmitButton>
    </form>
  );
}

export function DeletePetForm({ petId, petName }: { petId: string; petName: string }) {
  return (
    <form
      action={deletePetAction}
      onSubmit={(e) => {
        if (!confirm(`Remove ${petName}? Their care plan and tasks will be deleted too.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="pet_id" value={petId} />
      <SubmitButton
        className={buttonVariants({ variant: "destructive", size: "pill" })}
        pendingLabel={
          <>
            <LoaderCircle className="animate-spin" />
            Removing…
          </>
        }
      >
        <Trash2 />
        Remove {petName}
      </SubmitButton>
    </form>
  );
}
