import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import RoomCreation from "./components/RoomCreation";
import Room from "./components/Room";
import Whiteboard from "./components/Whiteboard";

import "./App.scss";

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/room/:id" component={Room} />
        <Route path="/">
          <RoomCreation />
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
