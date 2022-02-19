import React, { Fragment } from "react";
import { gql, useMutation, useQuery } from '@apollo/client';
import { Redirect } from "react-router-dom";

/**
 * Frontend component 
 */

const NewNote = () => {

    // == HTML event hooks ==
    function handleSubmission(event) {
        event.preventDefault();
        console.log('New note submitted!');
    }
    // == build main component HTML ==
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