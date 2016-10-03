import React from 'react'
import ReactDOM from 'react-dom'
import moment from 'moment'
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
      currentConvo: ChatStore.getCurrentConvo(),
      lastConvo: ChatStore.getLastConvo()
    }
	}

	componentWillMount() {
		this.socket = io()
		console.log(this.state, "from compnent will mount")
		this.socket.on('updateMessages', this.updateMessages)
    ChatStore.on('change', () => {
      this.setState({
        convos: ChatStore.getConvos(),
        input: "",
      })
    })
    ChatStore.on('lastConvoChange', () => {
      this.setState({
        lastConvo: ChatStore.getLastConvo(),
        currentConvo: ChatStore.getCurrentConvo(),
      })
    })
  }

  componentDidMount() {
  	setTimeout(() => {
	  	const convos = this.state.convos
	  	console.log(this.state.convos, "before loop")
	  	this.socket.emit('subscribe', this.props.user._id)
	  	var newState = {}
	  	for (var i = 0; i < convos.length; i++) {
	  		var convoId = convos[i]._id
	  		newState[convoId] = false
	  		this.socket.emit('subscribe', convos[i]._id)
	  	}
	  	this.setState(newState)
  	}, 100);
  }

  componentWillUpdate() {
  	const node = ReactDOM.findDOMNode(this.refs.chatDiv)
  	this.shouldScrollBottom = node.scrollTop + node.offsetHeight === node.scrollHeight;
  }

  componentDidUpdate() {
	  	if (this.shouldScrollBottom) {
	    const node = ReactDOM.findDOMNode(this.refs.chatDiv)
	    node.scrollTop = node.scrollHeight
	  }
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
  	this.setState({currentConvo: match, lastConvo: match._id})
  	this.socket.emit("setLastConvo", {userId: this.props.user._id, lastConvo: match._id})
  }

	render(){
		const currentUserId = this.props.user._id
    const convos = this.state.convos;
    const convosList = convos.map((match, i) => {
    								let boundMatchClick = this.onMatchClick.bind(this, match);
    								let matchId = match._id
    								const divClass = this.state.lastConvo == matchId ? "matches active" : "matches regular"
                    return <div className={divClass} key={i} onClick={boundMatchClick} ref={match._id}>
                    					<div className={this.state[matchId] ? "new-message" : "notification"}></div>
                    					<h2 key={i} ref={match._id}>{currentUserId == match.user1 ? match.maleFn : match.femaleFn}</h2>
                    				</div>;
                  })

    const messageList = this.state.currentConvo.messages ? this.state.currentConvo.messages.map((message, i) =>{
    	let timeDisplay;
    	if (moment().diff(message.dateCreated, 'days') < 1){
    		timeDisplay = moment(message.dateCreated).format("h:mm a")
    	} else if (moment().diff(message.dateCreated, 'days') == 1) {
    		timeDisplay = moment(message.dateCreated).format("[Yesterday at] h:mm a")
    	} else if (moment().diff(message.dateCreated, 'days') < 7) {
    		timeDisplay = moment(message.dateCreated).format("dddd [at] h:mm a")
    	} else {
    		timeDisplay = moment(message.dateCreated).format("MM/DD/YYYY [at] h:mm a")
    	}

    	return <div className={message.user == this.props.user._id ? "my-messages" : "other-messages"} key={i}>
    					<p className="text-messages">{message.text}</p>
    					<p className="timestamps">{timeDisplay}</p>
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
										<div className="messages" ref="chatDiv">
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