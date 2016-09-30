import React from 'react'
import io from 'socket.io-client'
import Display from './Display'
import Nav1 from './Nav1'
import ChatStore from '../stores/ChatStore'
import * as ChatActions from '../actions/ChatActions'

export default class Chat extends React.Component {

	constructor(){
		super()
		this.onSubmit = this.onSubmit.bind(this)
		this.handleChange = this.handleChange.bind(this)
		this.onMatchClick = this.onMatchClick.bind(this)
		this.updateMessages = this.updateMessages.bind(this)
		this.state = {
      convos: ChatStore.getConvos(),
      input: "",
      currentConvo: []
    }
	}

	componentWillMount() {
		this.socket = io()
		this.socket.on('updateMessages', this.updateMessages)
    ChatStore.on('change', () => {
      this.setState({
        convos: ChatStore.getConvos(),
        input: "",
        currentConvo: []
      })
    })
  }

  componentDidMount() {
  	setTimeout(() => {
	  	const convos = this.state.convos
	  	console.log(this.state.convos, "before loop")
	  	this.socket.emit('subscribe', this.props.user._id)
	  	for (var i = 0; i < convos.length; i++) {
	  		var convoId = convos[i]._id
	  		this.setState({convoId:false})
	  		this.socket.emit('subscribe', convos[i]._id)
	  	}
  	}, 100);
  }

  handleChange(e) {
    this.setState({input: e.target.value})
  }

  onSubmit(e) {
  	console.log(this.state)
  	e.preventDefault()
  	const inputText = this.refs.form.value
  	this.socket.emit('newMessage', {text: inputText, authorId: this.props.user._id, convoId: this.state.currentConvo._id})
  	this.refs.form.value = ""
  	this.setState({input: ""})
  } 

  updateMessages(payload) {
  	console.log(this.state.currentConvo, "current convo")
  	console.log(this.payload, "payload")
  	if (this.state.currentConvo._id == payload._id) {
			this.setState({
				currentConvo: payload
			})
  	} else {
  		const matchId = payload._id
  		this.setState({
  			matchId: true
  		})
  	}
  }

  onMatchClick(match, e) {
  	console.log(match)
  	this.setState({currentConvo: match})
  }

	render(){
		const currentUserId = this.props.user._id
    const convos = this.state.convos;
    const convosList = convos.map((match, i) => {
    								let boundMatchClick = this.onMatchClick.bind(this, match);
    								let matchId = match._id
                    return <div className="matches" key={i} onClick={boundMatchClick} ref={match._id}>
                    					<div className={this.state.matchId ? "new-message" : "notification"}></div>
                    					<h2 key={i} ref={match._id}>{currentUserId == match.user1 ? match.maleFn : match.femaleFn}</h2>
                    				</div>;
                  })

    const messageList = this.state.currentConvo.messages ? this.state.currentConvo.messages.map((message, i) =>{
    	return <div className={message.user == this.props.user._id ? "my-messages" : "other-messages"} key={i}>
    					<h4>{message.text}</h4>
    					<p>{message.dateCreated}</p>
    				 </div>
    }) : null
    const buttonColor = !this.state.input ? {color : "grey"} : {color : "black"}
		return (
							<div className="container">
								<Nav1/>
								<div id="chat-container">
									<div id="matched-container">
										{convosList}
									</div>
									<div id="message-container">
										<form id="text-form" onSubmit={this.onSubmit}>
											<input type="text" className="text-field" ref="form" value={this.state.input} onChange={this.handleChange}>
											</input>
											<input type="submit" value="Send" className="submit-button" disabled={!this.state.input} style={buttonColor}>
											</input>
										</form>
										<div className="messages">
											{messageList}
										</div>
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