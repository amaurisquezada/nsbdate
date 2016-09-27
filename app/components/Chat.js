import React from 'react'
import io from 'socket.io-client'
import Display from './Display'
import Nav1 from './Nav1'
import ChatStore from '../stores/ChatStore'
import * as ChatActions from '../actions/ChatActions'

export default class Chat extends React.Component {

	constructor(){
		super()
		this.convoTrigger = this.convoTrigger.bind(this)
		this.onSubmit = this.onSubmit.bind(this)
		this.handleChange = this.handleChange.bind(this)
		this.onMatchClick = this.onMatchClick.bind(this)
		this.state = {
      convos: ChatStore.getConvos()
    }
	}

	componentWillMount() {
    ChatStore.on('change', () => {
      this.setState({
        convos: ChatStore.getConvos(),
        input: "",
        currentConvo: ""
      })
    })
  }

  convoTrigger(){
  	ChatActions.getConvos();
  	console.log(this.state)
  }

  handleChange(e) {
    this.setState({input: e.target.value})
  }

  onSubmit(e) {
  	e.preventDefault()
  	const inputText = this.refs.form.value
  	ChatActions.addMessageToConversation(this.state.currentConvo._id, this.props.user._id, inputText)
  	this.refs.form.value = ""
  	this.setState({input: ""})
  } 

  onMatchClick(match, e) {
  	this.setState({currentConvo: match})
  }

	render(){
		const currentUserId = this.props.user._id
    const convos = this.state.convos;
    const convosList = convos.map((match, i) => {
    								let boundMatchClick = this.onMatchClick.bind(this, match);
                    return <div className="matches" key={i} onClick={boundMatchClick} ref={match._id}>
                    					<h2 key={i} ref={match._id}>{currentUserId == match.user1 ? match.maleFn : match.femaleFn}</h2>
                    				</div>;
                  })
    const buttonColor = !this.state.input ? {color : "grey"} : {color : "black"}
		return (
							<div className="container">
								<Nav1/>
								<div id="chat-container">
									<div id="matched-container">
										{convosList}
									</div>
									<div id="message-container">
										<div className="messages">
										</div>
										<form id="text-form" onSubmit={this.onSubmit}>
											<input type="text" className="text-field" ref="form" value={this.state.input} onChange={this.handleChange}>
											</input>
											<input type="submit" value="Send" className="submit-button" disabled={!this.state.input} style={buttonColor}>
											</input>
										</form>
									</div>
								</div>
							</div>
					 )
	}






}
								// <h1 onClick={this.convoTrigger}>"Hello World"</h1>
								// 	<Display if={this.state.grabbed}>
								// 		{namesList}
								// 	</Display>