defmodule Notetaker.Repo.Migrations.SetupNotes do
  use Ecto.Migration

  def change do
    create table("note") do
      add :title, :string
      add :body, :text
      add :user, :string
      add :location, :string
      timestamps()
    end
  end
end
