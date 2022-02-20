import React, { Fragment } from "react";
import { useQuery, gql, useMutation } from '@apollo/client';
import { Link } from "react-router-dom";

// === Set-up API calls ===
// queries
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
// mutations
const DELETE_NOTE = gql`
mutation ($id: String!) {
  deleteNote(id: $id) {
    id
    title
    body
    insertedAt
  }
}
`;

// === Frontend component ===

const List = () => {
  // == Execute API calls ==

  const { loading, error, data } = useQuery(LIST_NOTES, {
    // configure query to make a full fetch initially, 
    // and then subsequently read from the cache for future updates
    // reference: https://www.apollographql.com/docs/react/data/queries/#setting-a-fetch-policy
    fetchPolicy: "network-only",   // Used for first execution
    nextFetchPolicy: "cache-first" // Used for subsequent executions
  });
  const [deleteNote, deleteNoteStatus] = useMutation(DELETE_NOTE);

  // == HTML event hooks ==

  function handleNoteDeletion(ev, _bIsRetry) {
    const element = ev.target;
    const noteIdAttr = element.getAttribute('note_id');
    // KNOWN BUG:
    // sometimes the note_id is returned as NULL, but then appears later  (could not figure out why), so we simply retry:
    if (noteIdAttr === null && !_bIsRetry) {
      ev.persist();
      handleNoteDeletion(ev, true); // set bIsRetry to TRUE to avoid potential for infinite loops 
      return;
    }
    // .. if the note_id attribute still hasn't spawned, let's do a final attempt to extract it from the element ID instead
    const noteID = (noteIdAttr === null && _bIsRetry) ? element.id.split('_')[0] : noteIdAttr;
    if (!noteID || noteID === null) {
      console.error('Unable to detect note ID for deletion!');
    } else {
      // now we delete our note
      deleteNote({
        variables: { id: noteID },
        // update the cache to reflect the change in the UI before the user's very eyes, 
        // so they needn't refresh
        update: cache => {
          // first we grab our existing data cache..
          const data = cache.readQuery({ query: LIST_NOTES });
          // ... then we make some new transformed "notes" data ..
          const newNoteData = data.notes.filter(note => note.id !== noteID);
          // ... merging it in with any other attributes of 'data' that may or may not be added in future ..
          const newData = { ...data, notes: newNoteData };
          // .. finally writing it back to the cache for the LIST_NOTES query
          cache.writeQuery({ query: LIST_NOTES, data: newData });
        }
      });
      console.log(`Note ${noteID} deleted!`);
    }
  }

  // == Build main component HTML ==

  // accomodating HTML where API query data is not yet available
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error!</p>;
  // build page based on API query data
  return (
    <Fragment>
      <header>
        <div className="max-w-7xl mx-auto mb-4">
          <h1 className="text-3xl font-bold leading-tight text-gray-900">
            Notes
          </h1>
        </div>
      </header>

      {/* Wrapped the button element in a Link to our /createNote dir */}
      <Link to="/createNote" className="ml-auto">
        <button type="button" className="inline-flex mt-4 items-center px-4 py-2 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
          Create New
        </button>
      </Link>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {data.notes.map(note => (
            <li key={note.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-indigo-600 truncate">
                    {note.title}
                  </p>
                  <div className="flex justify-between space-x-3">
                    {/* Edit note icon */}
                    <Link to={`/createNote?id=${note.id}`}>
                      <svg id={`${note.id}_edit`} note_id={note.id} className="cursor-pointer" xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="butt" strokeLinejoin="arcs"><path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"></path><polygon points="18 2 22 6 12 16 8 16 8 12 18 2">
                      </polygon>
                        <title>Edit note</title>
                      </svg>
                    </Link>
                    {/* Delete note icon */}
                    <svg id={`${note.id}_del`} note_id={note.id} onClick={handleNoteDeletion} className="cursor-pointer" xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="butt" strokeLinejoin="arcs"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>
                      <title>Delete note</title>
                    </svg>
                  </div>
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
    </Fragment>
  )
}

export default List;
