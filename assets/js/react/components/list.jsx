import React, { Fragment } from "react";
import { useQuery, gql, useMutation } from '@apollo/client';
import { Link } from "react-router-dom";

// === Set-up API calls ===
const LIST_NOTES = gql`
query {
  notes {
    title,
    body,
    id,
    insertedAt
  }
}
`;

// === Frontend component ===

const List = () => {
  // == Execute API calls ==

  const { loading, error, data } = useQuery(LIST_NOTES);


  // == Build main component HTML ==

  // accomodating HTML where API query data is not yet available
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error!</p>;

  return (
    <Fragment>
      <header>
        <div className="max-w-7xl mx-auto mb-4">
          <h1 className="text-3xl font-bold leading-tight text-gray-900">
            Notes
          </h1>
        </div>
      </header>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {data.notes.map(note => (
            <li key={note.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-indigo-600 truncate">
                    {note.title}
                  </p>
                </div>
                <div className="mt-2">
                  <p>{note.body}</p>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <p>
                      <time dateTime={note.insertedAt}>{new Date(Date.parse(note.insertedAt)).toLocaleString()}</time>
                    </p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Wrapped the button element in a Link to our /createNote dir */}
      <Link to="/createNote" className="ml-auto">
        <button type="button" className="inline-flex mt-4 items-center px-4 py-2 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
          Create New
        </button>
      </Link>
    </Fragment>
  )
}

export default List;
