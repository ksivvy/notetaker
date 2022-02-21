import React, { Fragment } from "react";
import { gql, useMutation, useQuery } from '@apollo/client';
import { Redirect } from "react-router-dom";

/**
 * Setup API calls
 */

// queries
const GET_NOTE = gql`
query ($id: ID!) {
  getNote(id: $id) {
    title
    body
    user
    location
    id
    insertedAt
    updatedAt
  }
}
`;
// mutations
// reference: https://www.apollographql.com/docs/react/data/mutations/
const CREATE_NOTE = gql`
mutation ($title: String!, $body: String!, $location:String, $user:String) {
  createNote(title: $title, body: $body, location:$location, user:$user) {
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
const UPDATE_NOTE = gql`
mutation ($id: ID!, $title:String!, $body:String!, $location:String, $user:String) {
  updateNote(id: $id, title: $title, body: $body, location:$location, user:$user) {
    id
    title
    body
    user
    location
    insertedAt
    updatedAt
  }
}
`

/**
 * Utility functions
 */

// will return null if the location could not be accessed or determined
async function getBrowserLocation() {
    const position = await new Promise((resolve, reject) => {
        const onError = err => {
            console.warn('Failed to retrieve browser location!', err);
            resolve(null);
        };
        navigator.geolocation.getCurrentPosition(resolve, onError);
    });
    if (position === null) {
        return null;
    } else {
        const asString = `(${position.coords.latitude.toFixed(2)}°N, ${position.coords.longitude.toFixed(2)}°E)`;
        return { location: asString, position };
    }
}
// returns:
// { isEditingExistingNote: boolean, noteID: string[, queryRes: { loading, error }, noteObj: Note] }
function buildNoteEditor(props) {
    // Scan for an "id" query param in the URL..
    // possibly not the best way to be doing this, but was the quickest for the purpose of the test
    const queryParams = new URLSearchParams(props.location.search);
    const noteID = queryParams.get('id');
    // .. then if the "id" param is found, import the Note and setup the noteEditor:
    const isEditingExistingNote = noteID && noteID !== null;
    const noteEditor = { isEditingExistingNote, noteID, noteData: {} };
    if (isEditingExistingNote) {
        // using conditional operator (i.e data?.getNote?.title) not supported in current config
        const canReturn = () => noteEditor['queryRes'] && noteEditor['queryRes'].data && noteEditor['queryRes'].data.getNote;
        noteEditor['queryRes'] = useQuery(GET_NOTE, { variables: { id: noteID } });
        noteEditor['noteData'] = {
            id: noteID,
            get title() { return canReturn() ? noteEditor['queryRes'].data.getNote.title : null; },
            get body() { return canReturn() ? noteEditor['queryRes'].data.getNote.body : null; },
            get user() { return canReturn() ? noteEditor['queryRes'].data.getNote.user : null; },
            get location() { return canReturn() ? noteEditor['queryRes'].data.getNote.location : null; }
        }
    }
    return noteEditor;
}

// any elements prepended with "newNote_" will be extracted with the
// right-side of the "_" being used as the key
// this allows the extraction to scale with any new properties added to the HTML,
// so long as they follow the "newNote_" naming convention
function extractNoteDataFromElementChildren(element) {
    const onlyNewNotePrepends = el => el.name.startsWith('newNote_');
    const toNotePropObj = el => ({ [el.name.replace('newNote_', '')]: el.value });
    const toOneMergedObject = (obj1, obj2) => ({ ...obj1, ...obj2 })
    return Object.values(element.children)
        .filter(onlyNewNotePrepends)
        .map(toNotePropObj)
        .reduce(toOneMergedObject, {})
}

/**
 * Frontend component
 * Please note, in order to export one of the Form inputs to the createNote API call,
 * the input should have a name of "newNote_[NOTE-PROPERTY-NAME]" - the [NOTE-PROPERTY-NAME]
 * will be provided to the mutation call with the input value used as the value.  
 */

const NewNote = (props) => {
    // === Execute API calls ===
    const [createNote, createNoteObj] = useMutation(CREATE_NOTE);
    const [updateNote, updateNoteObj] = useMutation(UPDATE_NOTE);

    // === Setup variables ===
    const noteEditor = buildNoteEditor(props);

    /**
     * HTML event hooks
     */

    async function handleSubmission(event) {
        event.preventDefault();
        // first let's extract the note data dynamically from the form
        const noteData = extractNoteDataFromElementChildren(event.target);
        // then select the mutation type (create vs update)
        const mutate = noteEditor.isEditingExistingNote ? updateNote : createNote;
        // configure the note
        const browserLoc = await getBrowserLocation();
        noteData.location = browserLoc !== null ? browserLoc.location : null;
        if (noteEditor.isEditingExistingNote) noteData['id'] = noteEditor.noteID;
        // and package up all the extracted form data, ship it off to the backend,
        // finally returning the user to the main /notes page via the router once completed
        mutate({ variables: noteData }).then(() => props.history.push('/notes'));
    }

    /**
     * Build component HTML
     */

    // accomodating HTML where API query data is not yet available
    if (createNoteObj.loading || updateNoteObj.loading) return <p>Submitting your note, please wait...</p>;
    else if (noteEditor.queryRes && noteEditor.queryRes.loading) return <p>Loading your note, please wait...</p>;
    if (createNoteObj.error || updateNoteObj.error) return <p>Error!</p>;
    else if (noteEditor.queryRes && noteEditor.queryRes.error) return <p>Error: Attempted to edit note which does not exist!</p>;

    // ==== main component HTML ====

    return (
        <Fragment>
            <header>
                <div className="max-w-7xl mx-auto mb-4">
                    <h1 className="text-3xl font-bold leading-tight text-gray-900">
                        Create a new note under this <i className="text-violet-600 animate-pulse">different URL</i>!
                    </h1>
                </div>
            </header>
            <form id="createNoteForm" onSubmit={handleSubmission} className="flex flex-row flex-wrap w-full border-4 p-6 bg-gray-50 shadow">
                <input type="text" name="newNote_title" maxLength="80" className="mb-3.5 p-1 w-2/5 border-solid border-2 shadow rounded bg-gray-100 focus:bg-white" required placeholder="Give your note a title!" defaultValue={noteEditor.noteData.title} />
                <input type="text" name="newNote_user" maxLength="50" className="ml-auto border-solid border-2 mb-3.5 p-1 w-1/5 shadow rounded bg-gray-100 focus:bg-white" placeholder="Who is creating this note..?" defaultValue={noteEditor.noteData.user} />
                <textarea name="newNote_body" form="createNoteForm" maxLength="20000" className="w-full h-56 p-1 mb-5 border-solid border-2 shadow rounded-md resize-none overflow-y-scroll bg-gray-100 focus:bg-white" required spellCheck="true" placeholder="... And enter your note here!" defaultValue={noteEditor.noteData.body} />
                <input type="submit" value="Submit your note!" className="py-1.5 px-3 m-auto border-solid border-1 rounded text-lg text-white shadow bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer" />
            </form>
        </Fragment>
    );
}
// ==== exports ====
export default NewNote;