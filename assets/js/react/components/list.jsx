import React, { Fragment } from "react";
import { useQuery, gql, useMutation } from '@apollo/client';
import { Link } from "react-router-dom";

/**
 * Setup API calls
 */

// === queries ===
const LIST_NOTES = gql`
query {
  notes {
    title
    body
    id
    user
    location
    insertedAt
    updatedAt
  }
}
`;
// === mutations ===
const DELETE_NOTE = gql`
mutation ($id: ID!) {
  deleteNote(id: $id) {
    id
    title
    body
    user
    location
    insertedAt
    updatedAt
  }
}
`;
const DELETE_ALL_NOTES = gql`
mutation {
  deleteAllNotes {
    id
    title
    body
    user
    location
    insertedAt
    updatedAt
  }
}
`;

/**
 * Frontend component
 */
const List = () => {
  // === Execute API calls ===

  const { loading, error, data } = useQuery(LIST_NOTES, {
    // configure query to make a full fetch initially, 
    // and then subsequently read from the cache for future updates
    // reference: https://www.apollographql.com/docs/react/data/queries/#setting-a-fetch-policy
    fetchPolicy: "network-only",   // Used for first execution
    nextFetchPolicy: "cache-first" // Used for subsequent executions
  });
  const [deleteNote, deleteNoteStatus] = useMutation(DELETE_NOTE);
  const [deleteAllNotes, deleteAllNotesStatus] = useMutation(DELETE_ALL_NOTES);

  // === Setup Sorter ===

  const [notesFilter, setNotesFilter] = React.useState('');
  const [notesSorter, setNotesSorter] = React.useState({ sort: 'none', descendingOrder: false /* set to true to order descending */ });

  const sorts = (() => {
    const alphabeticalSort = (noteA, noteB, property) => notesSorter.descendingOrder ? noteB[property].localeCompare(noteA[property]) : noteA[property].localeCompare(noteB[property]);
    return {
      none: {
        name: "Chronologically",
        sorter: null // retain natural order from DB
      },
      dateCompare: {
        name: "By date",
        sorter: (noteA, noteB) => {
          const dateA = noteToDate(noteA);
          const dateB = noteToDate(noteB);
          return notesSorter.descendingOrder ? (dateA - dateB) : (dateB - dateA);
        }
      },
      byTitle: {
        name: "By title",
        sorter: (noteA, noteB) => alphabeticalSort(noteA, noteB, 'title')
      },
      byBody: {
        name: "By body",
        sorter: (noteA, noteB) => alphabeticalSort(noteA, noteB, 'body')
      },
      byCreator: {
        name: "By creator",
        sorter: (noteA, noteB) => alphabeticalSort(noteA, noteB, 'user')
      }
    };
  })();

  /**
   * HTML event hooks
   */

  function handleNoteDeletion(ev) {
    const element = ev.target;
    const noteIdAttr = element.getAttribute('note_id');
    // sometimes, depending on where the user clicks on the DELETE icon, the ev.target returns 
    // a sub-element of the SVG rather than the SVG itself (i.e; <path> or <polygon>)
    // in these cases, note_id needs to be pulled from the parent element instead
    const noteID = (noteIdAttr !== null ? noteIdAttr : element.parentElement.getAttribute('note_id'));
    if (!noteID || noteID === null) {
      console.error('Unable to detect note ID for deletion!', element);
    } else {
      deleteNote({
        variables: { id: noteID },
        // update the cache to reflect the change in the UI before the user's very eyes, 
        // so they needn't refresh
        update: cache => {
          // first let's grab our existing data cache..
          const data = cache.readQuery({ query: LIST_NOTES });
          // ... then make some new transformed "notes" data ..
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

  function handleDeleteAllNotes(ev) {
    if (confirm('You are about to clear all Notes! Are you sure?') === true) {
      deleteAllNotes({
        update: cache => {
          const data = cache.readQuery({ query: LIST_NOTES });
          const newData = { ...data, notes: [] };
          cache.writeQuery({ query: LIST_NOTES, data: newData });
        }
      });
    }
  }

  function handleNoteFilterChange(ev) {
    const filterText = ev.target.value;
    setNotesFilter(filterText);
  }

  function handleNoteSorterChange(ev) {
    const newSort = ev.target.value;
    setNotesSorter(sorter => ({ ...sorter, sort: newSort }));
  }
  function handleNoteSorterOrderChange(ev) {
    setNotesSorter(sorter => ({ ...sorter, descendingOrder: !sorter.descendingOrder }));
  }

  /**
   * Utility functions
   */

  function noteToDate(note) {
    return new Date(Date.parse(note.updatedAt || note.insertedAt));
  }

  function processNotesList() {
    // = filtering =
    // very primitive phrase filtering to determine if any of the words inputted can be found in the title AND/OR body of the note
    const byFilterInput = (note) => {
      const aFilterWords = notesFilter.toLowerCase().split(' ');
      const includesAll = (str, words) => words.every(word => str.includes(word));
      // concat the title and body together for a quick n crude means of checking that ALL aFilterWords
      // are included in either the title AND/OR body, also optimises to only iterate each word once rather than twice
      const allNoteContentsLowerCased = `${note.title.toLowerCase()}\n${note.body.toLowerCase()}`;
      return includesAll(allNoteContentsLowerCased, aFilterWords);
    }
    const filteredNotes = data.notes.filter(byFilterInput);
    // = sorting =
    const selectedSorter = (sorts[notesSorter.sort] || sorts['none']).sorter;
    if (!selectedSorter || selectedSorter === null) {
      return notesSorter.descendingOrder ? filteredNotes.reverse() : filteredNotes;
    } else {
      return filteredNotes.sort(selectedSorter);
    }
  }

  /**
   * Build component HTML
   */

  // accomodating HTML where API query data is not yet available
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error!</p>;

  // ==== main component HTML ====

  const sortOrderIcon = (() => {
    const className = "m-auto w-12 cursor-pointer hover:text-indigo-700 focus:text-indigo-600";
    if (notesSorter.descendingOrder) {
      return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="butt" strokeLinejoin="arcs" className={className} onClick={handleNoteSorterOrderChange}><circle className="shadow" cx="12" cy="12" r="10" /><path className="shadow" d="M16 12l-4-4-4 4M12 16V9" /></svg>
    } else {
      return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="butt" strokeLinejoin="arcs" className={className} onClick={handleNoteSorterOrderChange}> <circle className="shadow" cx="12" cy="12" r="10" /><path className="shadow" d="M16 12l-4 4-4-4M12 8v7" /></svg>
    }
  })();
  return (
    <Fragment>
      <header>
        <div className="max-w-7xl mx-auto mb-4">
          <h1 className="text-3xl font-bold leading-tight text-gray-900">
            Notes
          </h1>
        </div>
      </header>


      {/* Controls for the Notes list */}
      <section className="flex justify-between flex-col space-x-3 mt-3">
        {/* Wrapped the button element in a Link to our /createNote dir */}
        <Link to="/createNote" className="ml-auto">
          <button type="button" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            Create New
          </button>
        </Link>
      </section>
      <section className="flex justify-between mt-3 mb-3">
        {/* Left side */}
        <button type="button" onClick={handleDeleteAllNotes} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="butt" strokeLinejoin="arcs"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          Delete All
        </button>
        {/* Right side */}
        <section className="inline-flex justify-between space-x-4 mt-auto w-3/5">
          <input type="text" value={notesFilter} name="filterSearch" id="filterSearch" maxLength="150" className="p-1 w-full border-solid border-2 shadow rounded focus:bg-gray-100" placeholder="Filter notes by phrase..." onChange={handleNoteFilterChange} />
          {sortOrderIcon}
          <select name="sortSelect" id="sortSelect" value={notesSorter.sort} onChange={handleNoteSorterChange} className="mt-auto px-20 py-1 border-2 shadow-sm">
            {Object.entries(sorts).map(([sortKey, sort]) => (<option key={`sort_${sortKey}`} value={sortKey}>{sort.name}</option>))};
          </select>
        </section>
      </section>
      {/* Notes list */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {processNotesList().map(note => (
            <li key={note.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-indigo-600 truncate">
                    {note.title}
                  </p>
                  <div id={`${note.id}_controls`} className="flex justify-between space-x-3">
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
                  <p className="break-words">{note.body}</p>
                </div>
                {/* Creator */}
                {(() => {
                  if (note.user) {
                    return <div className="mt-2 ml-auto sm:flex sm:justify-between">
                      <div className="sm:flex">
                      </div>
                      <div className="flex items-center mt-2 text-sm text-gray-500 sm:mt-0">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="butt" strokeLinejoin="arcs"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        <p>{note.user}</p>
                      </div>
                    </div>
                  } else {
                    return undefined;
                  }
                })()}
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                  </div>
                  <section className="flex items-center space-x-3 mt-0.5 text-sm text-gray-500 sm:mt-0">
                    {/* Location */}
                    {(() => {
                      if (note.location) {
                        return <div className="flex">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="butt" strokeLinejoin="arcs"><circle cx="12" cy="10" r="3" /><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z" /></svg>
                          <p>{note.location}</p>
                        </div>
                      } else {
                        return undefined;
                      }
                    })()}
                    {/* Date */}
                    <div className="flex">
                      <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      <p>
                        <time dateTime={note.updatedAt || note.insertedAt}>{noteToDate(note).toLocaleString()}</time>
                      </p>
                    </div>
                  </section>
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
