import React, { Fragment } from "react";
import { gql, useMutation, useQuery } from '@apollo/client';
import { Redirect } from "react-router-dom";

// === Setup API calls ===
// queries
const GET_NOTE = gql`
query ($id: String!) {
  getNote(id: $id) {
    title,
    body,
    id,
    insertedAt
  }
}
`;
// mutations
// reference: https://www.apollographql.com/docs/react/data/mutations/
const CREATE_NOTE = gql`
mutation ($title: String!, $body: String!) {
  createNote(title: $title, body: $body) {
    id
    title
    body
    insertedAt
  }
}
`;

const UPDATE_NOTE = gql`
mutation ($id: String!, $title:String!, $body:String!) {
  updateNote(id: $id, title: $title, body: $body) {
    id
    title
    body
    insertedAt
    updatedAt
  }
}
`

// == Utility functions ==
// returns:
//{
//    isEditingExistingNote: boolean,
//    noteID: string
//    // OPTIONALS (if in "editing" mode):
//    queryRes: { loading, error, data },
//    noteData: { noteID, title, body } 
//}
function buildNoteEditor(props) {
    // Scan for an "id" query param in the URL..
    // possibly not the best way to be doing this, but was the quickest for the purpose of the test
    const queryParams = new URLSearchParams(props.location.search);
    const noteID = queryParams.get('id');
    // .. and if the "id" param is found, then import the Note and set-up the noteEditor to begin editing it:
    const isEditingExistingNote = noteID && noteID !== null;
    const noteEditor = { isEditingExistingNote, noteID, noteData: {} };
    if (isEditingExistingNote) {
        // { loading, error, data }
        noteEditor['queryRes'] = useQuery(GET_NOTE, { variables: { id: noteID } });
        noteEditor['noteData'] = {
            id: noteID,
            get title() {
                // using condition operator (i.e data?.getNote?.title) not supported in current config
                const conditionalReturn = noteEditor['queryRes'] && noteEditor['queryRes'].data && noteEditor['queryRes'].data.getNote
                return conditionalReturn ? noteEditor['queryRes'].data.getNote.title : null;
            },
            get body() {
                const conditionalReturn = noteEditor['queryRes'] && noteEditor['queryRes'].data && noteEditor['queryRes'].data.getNote
                return conditionalReturn ? noteEditor['queryRes'].data.getNote.body : null;
            },
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
 * the input should have a name of "newNote_[API-PROPERTY-NAME]" - the [API-PROPERTY-NAME]
 * will be provided to the mutation call with the input value used as the value.  
 */

const NewNote = (props) => {
    // == Execute API calls ==
    const [createNote, createNoteObj] = useMutation(CREATE_NOTE);
    const [updateNote, updateNoteObj] = useMutation(UPDATE_NOTE);

    // == Setup variables ==
    const noteEditor = buildNoteEditor(props);

    // == HTML event hooks ==
    function handleSubmission(event) {
        // prevent usual onSubmit functionality
        event.preventDefault();
        // first we extract our note data dynamically from the form
        const noteData = extractNoteDataFromElementChildren(event.target);
        // then we select the mutation type (create vs update)
        const mutate = noteEditor.isEditingExistingNote ? updateNote : createNote;
        if (noteEditor.isEditingExistingNote) noteData['id'] = noteEditor.noteID; // add in the additional "id" property for an UPDATE mutation
        // then we package up all our extracted form data and ship it off to the Graphql API,
        // finally returning the user to the main /notes page via the router once completed
        mutate({ variables: noteData }).then(() => props.history.push('/notes'));
    }
    // == build main component HTML ==
    // accomodating HTML where API query data is not yet available
    if (createNoteObj.loading || updateNoteObj.loading) return <p>Submitting your note, please wait...</p>;
    else if (noteEditor.queryRes && noteEditor.queryRes.loading) return <p>Loading your note, please wait...</p>;
    if (createNoteObj.error || updateNoteObj.error || (noteEditor.queryRes && noteEditor.queryRes.error)) return <p>Error!</p>;
    // build page based on API query data
    return (
        <Fragment>
            <header>
                <div className="max-w-7xl mx-auto mb-4">
                    <h1 className="text-3xl font-bold leading-tight text-gray-900">
                        Create a new note under this <i className="text-violet-600 animate-pulse">different URL</i>!
                    </h1>
                </div>
            </header>
            <form id="createNoteForm" onSubmit={handleSubmission} className="bg-gray-50 w-full border-4 p-6 shadow flex flex-row flex-wrap">
                <input type="text" name="newNote_title" className="bg-gray-100 focus:bg-white border-solid border-2 shadow mb-3.5 p-1 w-2/5 rounded" required placeholder="Give your note a title!" defaultValue={noteEditor.noteData.title} />
                <textarea name="newNote_body" form="createNoteForm" className="bg-gray-100 focus:bg-white w-full border-solid border-2 p-1 shadow h-56 rounded-md mb-5 resize-none overflow-y-scroll" required spellCheck="true" placeholder="... And enter your note here!" defaultValue={noteEditor.noteData.body} />
                <input type="submit" value="Submit your note!" className="border-solid border-1 rounded py-1.5 px-3 m-auto text-lg shadow text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer" />
            </form>
        </Fragment>
    );
}
// ==== exports ====
export default NewNote;