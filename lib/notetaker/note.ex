defmodule Notetaker.Note do
  use Ecto.Schema

  schema "note" do
    field :title, :string
    field :body, :string
    field :user, :string, default: nil
    field :location, :string, default: nil
    timestamps()
  end
end
