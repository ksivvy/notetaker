import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect
} from "react-router-dom";
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import List from "./components/list.jsx";
import NewNote from "./components/newNote.jsx";

const client = new ApolloClient({
  uri: '/graphql',
  cache: new InMemoryCache({
    typePolicies: {
      // [KS] defined custom merge function to prevent warnings in console when updating the cache
      // Per the documentation here:
      // https://www.apollographql.com/docs/react/caching/cache-field-behavior/#merging-non-normalized-objects
      // ...The configuration below will enforce the default behaviour to prefer the incoming cache data, but silences the warning message. 
      // This preferential behaviour for the incoming cache is our desired behaviour (for now), so we re-enforce it here.
      Query: {
        fields: {
          notes: { merge: false }
        }
      }
    }
  })
});

const App = () => {
  return (
    <ApolloProvider client={client}>
      {/* [KS] Removed basename="/notes" from Router to allow /createNote it's own URL (rather than a subdir of /notes/create) */}
      <Router>
        <Switch>
          <Route path="/notes" component={List} />
          <Route path="/createNote" component={NewNote} />
          {/* [KS] Retain /notes as the main page, whilst allowing us to have additional URLs */}
          <Route exact path="/">
            <Redirect to="/notes" />
          </Route>
        </Switch>
      </Router>
    </ApolloProvider>
  )
}

export default App;
