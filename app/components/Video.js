import React from 'react'
import io from 'socket.io-client'
import { Glyphicon } from 'react-bootstrap'
import Display from './Display'
import _ from 'underscore'
import * as VideoActions from '../actions/VideoActions'
import VideoStore from '../stores/VideoStore'
var window = require("global/window")

export default class Video extends React.Component {

	constructor() {
		super()
		this.connect = this.connect.bind(this)
		this.idRetrieval =  this.idRetrieval.bind(this)
		this.onCall = this.onCall.bind(this)
		this.closeCall = this.closeCall.bind(this)
		this.error = this.error.bind(this)
		this.nextMatch = this.nextMatch.bind(this)
		this.femaleAction = this.femaleAction.bind(this)
		this.maleAction = this.maleAction.bind(this)
		this.buttonHandler = this.buttonHandler.bind(this)
		this.reject = this.reject.bind(this)
		this.noEligibleUsers = this.noEligibleUsers.bind(this)
		this.closeEvent = this.closeEvent.bind(this)
		this.peerSocket = this.peerSocket.bind(this)
		this.makeSelection = this.makeSelection.bind(this)
		this.likeHandler = this.likeHandler.bind(this)
		this.usersChange = this.usersChange.bind(this)
		this.notAvailable = this.notAvailable.bind(this)
		this.outOfTime = this.outOfTime.bind(this)
		this.doubleLike = this.doubleLike.bind(this)
		this.streamHandler = this.streamHandler.bind(this)
		this.state = {
			mySource: '',
			otherSource: '',
			buttonStatus: true, 
			mySocket: '',
			peerSocket: '',
			peerCuid: '',
			peerName: '',
			peerAge: '',
			selecting: false,
			waiting: true,
			streaming: false,
			previousChats: [],
			counter: 60
		}
	}

	componentWillMount() {
		const peerId = this.props.user.cuid,
		fn = this.props.user.firstName,
		age = this.props.user.age;
		this.peer = new Peer({ host: 'localhost', port: 3000, debug: 3, path: '/connect', metadata: {cuid:peerId, firstName: fn, age: age}})
		this.peer.on('open', this.nextMatch)
		this.peer.on('call', this.onCall)
		this.peer.on('error', this.error)
		this.socket = io()
		this.socket.on('connect', this.connect)
		this.socket.on('makeSelection', this.makeSelection)
		this.socket.on('usersChange', this.usersChange)
		this.socket.on('notAvailable', this.notAvailable)
		this.socket.on('peerSocket', this.peerSocket)
		this.socket.on('closeEvent', this.closeEvent)
		this.socket.on('idRetrieval', this.idRetrieval)
		this.socket.on('noEligibleUsers', this.noEligibleUsers)
		this.socket.on('startTimer', this.outOfTime)
  	VideoStore.on('change', this.nextMatch)
  	VideoStore.on('initial', () => {
  		this.setState({previousChats: VideoStore.getPreviousChats()})
  	})
	}

	componentDidMount(){
		VideoActions.retrievePreviousChats()
	}

	componentWillUnmount() {
		this.peer.destroy()
		this.socket.disconnect()
		VideoStore.removeAllListeners()
    this.socket.removeAllListeners()
   	clearInterval(this.countdown)
	}

  outOfTime() {
		this.countdown ? clearInterval(this.countdown) : null
		this.countdown = setInterval(() => {
  		if (this.state.counter > 0) {
  			this.setState({counter: this.state.counter - 1})
        } else {
        		this.doubleLike()
        		clearInterval(this.countdown)
        	}
		},1000)
  }

  doubleLike() {
  	clearInterval(this.countdown)
  	if (this.props.user.gender === "Male"){
  	  this.socket.emit('likeToo', {myId:this.props.user.cuid, peerId:this.state.peerCuid, myGender: this.props.user.gender, peerSocket: this.state.peerSocket})
  	}
  	setTimeout(() => {
  		this.setState({selecting: false, streaming: false, waiting: true, buttonStatus: true, counter: 60}, this.closeCall)
  		VideoActions.addToPreviousChats(this.state.peerCuid, this.props.user.cuid)
  	}, 200)
  }

	nextMatch() {
		if (this.props.user.gender === "Female") {
			this.femaleAction()
		} else if (this.props.user.gender === "Male") {
			this.maleAction()
		}
	}

	maleAction() {
		const id = "/#" + this.socket.io.engine.id
		this.socket.emit('fetchFromWsm', {cuid: this.props.user.cuid, socket: id})
	}

	femaleAction() {
		const id = "/#" + this.socket.io.engine.id
		this.socket.emit('addToWsm', {
			peerId: this.peer.id,
			peerCuid: this.peer.options.metadata.cuid, 
			peerName: this.peer.options.metadata.firstName,
			peerAge: this.peer.options.metadata.age,
			socket: id
		})
	}

	idRetrieval(payload) {
		if (!this.state.streaming && this.state.waiting) {
			const cam = navigator.mediaDevices.getUserMedia({audio: false, video: { width: 1280, height: 720 }})
	     	cam.then( (mediaStream) => {
	      	this.setState({
		      	mySource: URL.createObjectURL(mediaStream), 
		      	peerCuid: payload.peerCuid,
		      	peerName: payload.peerName,
		      	peerAge: payload.peerAge,
		      	waiting: false
	      	})
	      	const call = this.peer.call(payload.peerId, mediaStream, {metadata: {
		      	peerSocket: this.socket.id, 
		      	peerCuid: this.props.user.cuid,
		      	peerName: this.props.user.firstName,
		      	peerAge: this.props.user.age
	      	}})
	      	this.streamHandler(call)
	     })
	     cam.catch((error) => { console.log("error getting camera") })
 		}
	}

	buttonHandler() {
		this.setState({buttonStatus: true})
		setTimeout(()=>{
			this.setState({buttonStatus: false})
		}, 2000)
	}

	closeCall() {
		window.existingCall.close()
	}

	reject() {
		clearInterval(this.countdown)
		this.socket.emit('rejected', this.state.peerSocket)
		VideoActions.addToPreviousChats(this.state.peerCuid, this.props.user.cuid)
		this.setState({selecting: false, streaming: false, waiting: true, buttonStatus: true}, this.closeCall)
	}

	likeHandler() {
		clearInterval(this.countdown)
		if(this.state.selecting){
			this.socket.emit('likeToo', {myId:this.props.user.cuid, peerId:this.state.peerCuid, myGender: this.props.user.gender, peerSocket: this.state.peerSocket})
		} else {
			this.socket.emit('liked', {myId:this.props.user.cuid, peerId:this.state.peerCuid, peerSocket: this.state.peerSocket})
		}
		VideoActions.addToPreviousChats(this.state.peerCuid, this.props.user.cuid)
		this.setState({selecting: false, streaming: false, waiting: true, buttonStatus: true}, this.closeCall)
	}

	makeSelection() {
		clearInterval(this.countdown)
		this.setState({selecting:true})
	}

	notAvailable() {
		this.setState({waiting: true})
	}

	noEligibleUsers() {
		this.setState({waiting: true})
	}

	usersChange(payload) {
		const check = _.contains(this.state.previousChats, payload)
		if (this.props.user.cuid != payload && !this.state.streaming && !check){
			this.state.waiting ? this.nextMatch() : null			
		}
	}
	
	closeEvent(payload) {
		clearInterval(this.countdown)
		if((!this.state.selecting && !this.state.streaming) || (this.state.peerSocket == payload && this.state.streaming)) {
			VideoActions.addToPreviousChats(this.state.peerCuid, this.props.user.cuid)
			this.setState({streaming: false, waiting: true, buttonStatus: true}, this.closeCall)
		}
	}

	connect() {
		this.socket.emit('joinRoom', this.props.user)
	}

	peerSocket(payload) {
		this.setState({peerSocket: payload})
	}

	onCall(call) {
		const cam = navigator.mediaDevices.getUserMedia({audio: false, video: { width: 1280, height: 720 }})
	  	cam.then( (mediaStream) => {
	    this.setState({
	    	peerSocket: call.metadata.peerSocket, 
	    	mySource: URL.createObjectURL(mediaStream), 
	    	peerCuid: call.metadata.peerCuid,
	    	peerName: call.metadata.peerName,
	    	peerAge: call.metadata.peerAge,
	    	waiting: false
	    })
      call.answer(mediaStream)
      this.streamHandler(call)
    	})
    	cam.catch((error) => { console.log("error getting camera") })
	}

	error(err) {
		console.log(err.message);
	}


	streamHandler (call) {
	  const user1 = this.props.user.gender ==="Female" ? this.props.user.cuid : this.state.peerCuid,
	  user2 = this.props.user.gender ==="Male" ? this.props.user.cuid : this.state.peerCuid;
    call.on('stream', stream => {
    	if (this.props.user.gender === "Female") {
    		this.socket.emit('sendSocket', {destination: this.state.peerSocket, socketId: this.socket.id})
    	}
    	let previousChats = this.state.previousChats.slice()
    	previousChats.push(this.state.peerCuid)
      this.setState({otherSource: URL.createObjectURL(stream), streaming: true, previousChats: previousChats, counter: 60})
      this.socket.emit("timerEvent", {user1: user1, user2: user2})
      this.buttonHandler()
    })
    window.existingCall = call
    call.on('close', () => {
    	clearInterval(this.countdown)
    	if (this.state.streaming){
    		this.socket.emit('rejected', this.state.peerSocket)
      	this.setState({streaming: false, waiting: true})
      	if (!this.state.selecting) {
      		this.setState({buttonStatus: true})
      		VideoActions.addToPreviousChats(this.state.peerCuid, this.props.user.cuid)
      	} else {
      			VideoActions.addToPreviousChats(this.state.peerCuid, this.props.user.cuid, "null")
      		}
    	}
    })
   }

	render() {
		const mySource = this.state.mySource,
		otherSource = this.state.otherSource,
		buttonStatus = this.state.buttonStatus,
		leftButtonClass = buttonStatus ? "disabled-button" : "text-danger g-arrows",
		rightButtonClass = buttonStatus ? "disabled-button" : "text-success g-arrows";
		return (
			<div>
				<div id="vid-container">
					<video id='my-video' src={this.state.waiting ? null : mySource} autoPlay >
					</video>
					<video id='other-video' src={this.state.waiting ? '/videos/static3.mp4' : otherSource} autoPlay muted={this.state.waiting} loop={this.state.waiting}>
					</video>
					<div id="left-button-container">
            <p className="arrow-labels">Not for me</p>
            <Glyphicon glyph="arrow-left" className={leftButtonClass} onClick={buttonStatus ? null : this.reject} ></Glyphicon>
          </div>
          <div id="right-button-container">
            <p className="arrow-labels">Like!</p>
            <Glyphicon glyph="arrow-right" className={rightButtonClass} onClick={buttonStatus ? null : this.likeHandler} ></Glyphicon>
          </div>
				</div>
				<Display if={this.state.peerName && this.state.peerAge && !this.state.waiting}>
					<div className="peer-name-wrapper">
						<p className="name-age">{this.state.peerName + ", " + this.state.peerAge}</p>
						<p className="city">New York, NY</p>
					</div>
				</Display>
				<Display if={this.state.streaming}>
					<h3 className="countdown">{this.state.counter}</h3>
				</Display>
				<Display if={this.state.waiting}>
					<h2 id="wait-message">Please wait to be matched</h2>
				</Display>
				<Display if={this.state.selecting}>
					<div id="selection-div">
						<h3>The video chat has ended. Please make a selection!</h3>
					</div>
				</Display>
			</div>
		)
	}
}