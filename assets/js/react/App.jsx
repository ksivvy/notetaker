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
  cache: new InMemoryCache()
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
