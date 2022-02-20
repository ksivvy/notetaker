defmodule NotetakerWeb.Schema do
  use Absinthe.Schema
  import_types(Absinthe.Type.Custom)
  alias Notetaker.{Note, Repo}

  # Queries

  query do
    @desc "Retrieve all notes in the system"
    field :notes, list_of(:note) do
      resolve(fn _, _ ->
        notes = Repo.all(Note)
        {:ok, notes}
      end)
    end

    @desc "Retrieve a note by it's ID"
    field :get_note, :note do
      arg(:id, non_null(:string), description: "The ID of the note")

      resolve(fn args, _ ->
        note = Repo.get(Note, args.id)
        {:ok, note}
      end)
    end
  end

  # Mutations

  mutation do
    @desc "Insert a new note into the system"
    field :create_note, :note do
      arg(:title, non_null(:string), description: "The title of the note")
      arg(:body, non_null(:string), description: "The contents of the note")
      resolve(fn args, _ ->
        note = %Note{title: to_string(args.title), body: to_string(args.body)}
        # auto-generates the "id" and "insertedAt" properties
        insertedNote = Repo.insert!(note)
        {:ok, insertedNote}
      end)
    end

    @desc "Delete an existing note from the system. Returns the deleted note."
    field :delete_note, :note do
      arg(:id, non_null(:string), description: "The ID of the note")

      resolve(fn args, _ ->
        # if Repo.exists?(Note, args.id) do
        noteForDeletion = Repo.get(Note, args.id)
        Repo.delete!(noteForDeletion)
        {:ok, noteForDeletion}
        # else
        #  {:error, "The Note ID #{args.id} is not registered in the system!"}
        # end
      end)
    end

    @desc "Update an existing note in the system. Returns the updated note."
    field :update_note, :note do
      arg(:id, non_null(:string), description: "The ID of the note")
      arg(:title, non_null(:string), description: "The title of the note")
      arg(:body, non_null(:string), description: "The contents of the note")
      # arg(:location, :string, description: "[Optional] The browser location at time of note creation")

      resolve(fn args, _ ->
        # reference: https://hexdocs.pm/ecto/Ecto.Repo.html#c:update/2
        note = Repo.get(Note, args.id)
        # location = args.location || note.location || nil
        # reference: https://elixirschool.com/en/lessons/ecto/changesets
        changeset = Ecto.Changeset.change(note, %{title: args.title, body: args.body})
        Repo.update!(changeset)
        {:ok, note}
      end)
    end

    @desc "For dev purposes - spawn a desired quantity of sample notes into the system. Returns the entire list of Notes in the system."
    field :spawn, list_of(:note) do
      arg(:quantity, non_null(:integer), description: "The quantity of sample notes to spawn")

      resolve(fn args, _ ->
        quantity = args.quantity

        Enum.each(0..quantity, fn num ->
          Repo.insert!(%Note{title: "Spawned Note #{num}", body: "This is a note"})
        end)

        notes = Repo.all(Note)
        {:ok, notes}
      end)
    end
  end

  # Defined available Note obj parameters for API

  object :note do
    field :id, :id
    field :title, :string
    field :body, :string
    field :inserted_at, :naive_datetime
    field :updated_at, :naive_datetime
  end
end
