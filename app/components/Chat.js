import React from 'react'
import ReactDOM from 'react-dom'
import moment from 'moment'
import io from 'socket.io-client'
import Display from './Display'
import NavBar from './NavBar'
import ChatStore from '../stores/ChatStore'
import * as ChatActions from '../actions/ChatActions'
import * as NavActions from '../actions/NavActions'

export default class Chat extends React.Component {

	constructor(){
		super()
		this.onSubmit = this.onSubmit.bind(this)
		this.handleChange = this.handleChange.bind(this)
		this.onMatchClick = this.onMatchClick.bind(this)
		this.updateMessages = this.updateMessages.bind(this)
		this.updateCurrentConvo = this.updateCurrentConvo.bind(this)
		this.state = {
      convos: ChatStore.getConvos(),
      input: "",
      currentConvo: ChatStore.getCurrentConvo(),
      lastConvo: ChatStore.getLastConvo(),
      lastClicked: ChatStore.getLastClicked(),
      convoStatuses: {}
    }
	}

	componentWillMount() {
    //Store listener for a change in the total number on conversations.
    ChatStore.on('change', () => {
      this.setState({
        convos: ChatStore.getConvos()
      })
    })
    //Store listener for a change in the most recent conversation.
    ChatStore.on('lastConvoChange', () => {
      this.setState({
        lastConvo: ChatStore.getLastConvo(),
        currentConvo: ChatStore.getCurrentConvo(),
        lastClicked: ChatStore.getLastClicked()
      })
    })
  }

  componentDidMount() {
    /*Retrieves all of the user's conversations. Creates a socket listener for each conversation to track new messages. Also checks to
      see if any of the conversations' messages are more recent than the last time the conversation was viewed. */
    ReactDOM.findDOMNode(this.refs.form).focus()
  	this.socket = io()
		this.socket.on('updateMessages', this.updateMessages)
		this.socket.on('updatedConvo', this.updateCurrentConvo)
  	ChatActions.getConvos()
    ChatActions.getLastConvo()
  	this.timer1 = setTimeout(() => {
	  	const convos = this.state.convos,
            currentConvo = this.state.currentConvo;
	  	this.socket.emit('subscribe', this.props.user._id)
      this.socket.emit('updateUserLastClick', this.props.user._id)
      NavActions.clearNotifications()
	  	let newState = {}
	  	for (let i in convos) {
	  		let convoId = convos[i]._id,
	  		    lastMessage = convos[i].messages.reverse().find((message) => {
	  			return message.user != this.props.user._id
	  		}),
	  		lastMessageDate = lastMessage ? moment(lastMessage.dateCreated).valueOf() : moment(convos[i].dateCreated).valueOf(),
	  		lastConvoClick = convos[i].lastClicked[this.props.user._id]
	  		newState[convoId] = lastMessageDate > lastConvoClick && convoId != currentConvo._id ? true : false 
	  		this.socket.emit('subscribe', convos[i]._id)
	  		if (convoId == currentConvo._id) {
	  			this.socket.emit("updateLastClicked", {convoId: convoId, userId: this.props.user._id})
	  		}
	  	}
	  	this.setState({convoStatuses: newState})
  	}, 200)
  }
  
  componentWillUnmount() {
  	this.socket.close()
  	clearTimeout(this.timer1)
  	ChatStore.removeAllListeners()
    this.socket.removeAllListeners()
  }

  componentWillUpdate() {
    //Determines whether messages div should scroll to bottom on new message.
  	const node = ReactDOM.findDOMNode(this.refs.chatDiv)
  	this.shouldScrollBottom = node.scrollTop + node.offsetHeight >= node.scrollHeight;
  }

  componentDidUpdate() {
     //Determines whether messages div should scroll to bottom on new message.
	  if (this.shouldScrollBottom) {
	    const node = ReactDOM.findDOMNode(this.refs.chatDiv)
	    node.scrollTop = node.scrollHeight
	  }
	  localStorage.user = this.props.user.firstName;
  }

  handleChange(e) {
    this.setState({input: e.target.value})
  }

  onSubmit(e) {
     //Sends new messages to the server via the socket.
  	e.preventDefault()
    const recipient = this.props.user.gender === "Female" ? this.state.currentConvo.user2 : this.state.currentConvo.user1,
  	      inputText = this.refs.form.value;
  	this.socket.emit('newMessage', {text: inputText, authorId: this.props.user._id, convoId: this.state.currentConvo._id, recipient: recipient})
    this.socket.emit('updateUserLastClick', this.props.user._id)
    NavActions.clearNotifications()
  	this.refs.form.value = ""
  	this.setState({input: ""})
  } 

  updateMessages(payload) {
    /*If the new message received should update the current conversation, replaces the state of the current conversation with the updated
      version from the server. Otherwise, changes the ID of the conversation in the state to true which triggers a class change. The class
      change renders a new message notification. */
  	if (this.state.currentConvo._id == payload._id) {
			this.setState({
				currentConvo: payload
			})
  	} else {
  		ChatActions.getConvos()
  		let matchId = payload._id,
          convosState = this.state.convoStatuses;
  		convosState[matchId] = true
  		this.setState({convoStatuses: convosState})
  	}
  }

  updateCurrentConvo(payload) {
  	this.setState({currentConvo: payload})
  }

  onMatchClick(match, e) {
    //Changes the conversation that was clicked to the current conversation. This triggers the conversation that was clicked to render.
    this.socket.emit('updateUserLastClick', this.props.user._id)
    NavActions.clearNotifications()
  	let update = {}
  	update.lastConvo = match._id
  	update.convoStatuses = this.state.convoStatuses
  	update.convoStatuses[match._id] = false
  	this.setState(update)
  	this.socket.emit("setLastConvo", {userId: this.props.user._id, lastConvo: {_id: match._id, lastClicked: Date.now()}})
    ReactDOM.findDOMNode(this.refs.form).focus()
  }

	render(){
    /*Renders conversations and messages. Rendering depends on whether there are any conversations and whether a given conversation contains
    any messages */
		const currentUserId = this.props.user._id,
          convos = this.state.convos,
          convosList = convos.length > 0 ? convos.map((match, i) => {
          								let boundMatchClick = this.onMatchClick.bind(this, match);
          								let matchId = match._id
          								const divClass = this.state.lastConvo == matchId ? "matches active" : "matches regular"
                          return <div className={divClass} key={i} onClick={boundMatchClick} ref={match._id}>
                          					<div className={this.state.convoStatuses[matchId] ? "new-message" : "notification"}></div>
                          					<h2 key={i} ref={match._id}>{currentUserId == match.user1 ? match.maleFn : match.femaleFn}</h2>
                          				</div>;
                        }) : <div className="no-matches">
                                <p>No matches yet. Go to the video chat and start matching now!</p>
                             </div>;
    let messageList, messageClass;
    if (this.state.currentConvo && this.state.currentConvo.messages && this.state.currentConvo.messages.length > 0) {
      messageList = this.state.currentConvo.messages.map((message, i) =>{
        messageClass = "message-container"
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
			    }) 
    } else if (this.state.currentConvo && this.state.currentConvo.messages) {
        messageClass = "message-container prompt-background"
        messageList = <div className = "no-messages-yet">
                        <p>Don't be shy...say hello!</p>
                      </div>;
      } else {
          messageClass = "message-container awk-background"
          messageList = <div className="no-matches-messages">
                          <h1 className="awk-text">Well, this is awkward...</h1>
                        </div>;
  }
    const buttonColor = !this.state.input || !this.state.currentConvo ? {color : "grey"} : {color : "black"}
		return (
  		<div className="container">
  			<NavBar clear={true} />
  			<div id="chat-container">
  				<div id="matched-container">
  					{convosList}
  				</div>
  				<div className={messageClass}>
  					<form id="text-form" onSubmit={this.onSubmit}>
  						<input type="text" className="text-field" ref="form" value={this.state.input} onChange={this.handleChange}>
  						</input>
  						<input type="submit" value="Send" className="submit-button" disabled={!this.state.input || !this.state.currentConvo} style={buttonColor}>
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