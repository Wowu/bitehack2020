import React, { useState, useEffect, Component } from "react";
import io from "socket.io-client";

export default class Room extends Component {
  constructor(props) {
    super(props);
    this.roomId = props.match.params.id;
    this.state = { ideas: [], idea: "", topic: "" };

    this.socket = io("http://localhost:5000");

    this.socket.on("roomInfo", ({ ideas, topic }) => {
      this.setState({ ideas, topic });
    });

    this.socket.on("pushNewIdeaToUsers", idea => {
      this.addIdea(idea);
    });

    this.socket.on("roomNotFound", data => {});

    this.socket.emit("connectToRoom", {
      roomId: this.roomId,
      userName: "userName"
    });
  }

  addIdea(idea) {
    this.setState({
      ideas: [...this.state.ideas, idea]
    });
  }

  publishIdea() {
    this.socket.emit("newIdea", {
      roomId: this.roomId,
      idea: this.state.idea
    });

    this.setState({
      idea: ""
    });
  }

  handleFormSubmit(e) {
    e.preventDefault();
    this.publishIdea();
  }

  render() {
    const { ideas, idea, topic } = this.state;

    return (
      <div>
        <div className="container">
          <div className="row">
            <div className="col">
              <h3>Q: {topic}</h3>

              <ul>
                {ideas.map(idea => (
                  <li key={idea}>{idea}</li>
                ))}
              </ul>

              <form onSubmit={this.handleFormSubmit.bind(this)}>
                <input
                  type="text"
                  placeholder="Wpisz pomysł"
                  value={idea}
                  onChange={e => this.setState({ idea: e.target.value })}
                />

                <button>Dodaj pomysł</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
