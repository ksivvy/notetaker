defmodule NotetakerWeb.Schema do
  use Absinthe.Schema
  import_types(Absinthe.Type.Custom)
  alias Notetaker.{Note, Repo}

  # Queries

  query do
    field :notes, list_of(:note) do
      resolve(fn _, _ ->
        notes = Repo.all(Note)
        {:ok, notes}
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
  end

  # Defined available Note obj parameters for API

  object :note do
    field :id, :id
    field :title, :string
    field :body, :string
    field :inserted_at, :naive_datetime
  end
end
