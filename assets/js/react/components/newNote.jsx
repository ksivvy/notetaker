import React, { Fragment } from "react";
import { gql, useMutation, useQuery } from '@apollo/client';
import { Redirect } from "react-router-dom";

// === Setup API calls ===
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

/**
 * Frontend component
 * Please note, in order to export one of the Form inputs to the createNote API call,
 * the input should have a name of "newNote_[API-PROPERTY-NAME]" - the [API-PROPERTY-NAME]
 * will be provided to the mutation call with the input value used as the value.  
 */

const NewNote = () => {
    // == Execute API calls ==
    const [createNote, { loading, error, data }] = useMutation(CREATE_NOTE);

    // == HTML event hooks ==
    function handleSubmission(event) {
        // prevent usual onSubmit functionality
        event.preventDefault();
        // first we extract our note data dynamically from the form
        const noteData = Object.values(event.target.children)
            .filter(el => el.name.startsWith('newNote_'))
            .map(el => ({ [el.name.replace('newNote_', '')]: el.value }))
            .reduce((res, curr) => ({ ...res, ...curr }), {})
        // then we package up all our extracted form data and ship it off to the Graphql API
        createNote({ variables: noteData })
        // finally returning the user to the main /notes page via the router once completed
        window.open('/notes', '_self');
    }
    // == build main component HTML ==
    // accomodating HTML where API query data is not yet available
    if (loading) return <p>Submitting your note, please wait...</p>;
    if (error) return <p>Error!</p>;
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
                <input type="text" name="newNote_title" className="bg-gray-100 focus:bg-white border-solid border-2 shadow mb-3.5 p-1 w-2/5 rounded" required placeholder="Give your note a title!" />
                <textarea name="newNote_body" form="createNoteForm" className="bg-gray-100 focus:bg-white w-full border-solid border-2 p-1 shadow h-56 rounded-md mb-5 resize-none overflow-y-scroll" required spellCheck="true" placeholder="... And enter your note here!" />
                <input type="submit" value="Submit your note!" className="border-solid border-1 rounded py-1.5 px-3 m-auto text-lg shadow text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer" />
            </form>
        </Fragment>
    );
}
// ==== exports ====
export default NewNote;