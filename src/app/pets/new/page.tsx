import { createPetAction } from "@/app/pets/actions";

export default function NewPetPage() {
  return (
    <div className="mx-auto w-full max-w-md flex-1 p-8">
      <h1 className="text-xl font-semibold">Add a pet</h1>
      <form action={createPetAction} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="species" className="text-sm font-medium">
            Species
          </label>
          <select
            id="species"
            name="species"
            required
            defaultValue=""
            className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Select species
            </option>
            <option value="dog">Dog</option>
            <option value="cat">Cat</option>
            <option value="rabbit">Rabbit</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="breed" className="text-sm font-medium">
            Breed <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            id="breed"
            name="breed"
            className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="age_stage" className="text-sm font-medium">
            Age
          </label>
          <select
            id="age_stage"
            name="age_stage"
            required
            defaultValue=""
            className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Select age
            </option>
            <option value="baby">Baby</option>
            <option value="adult">Adult</option>
            <option value="senior">Senior</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="notes" className="text-sm font-medium">
            Anything else? <span className="text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Add pet
        </button>
      </form>
    </div>
  );
}
