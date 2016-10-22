import React from 'react'
import io from 'socket.io-client'
import root from 'window-or-global'
import { Glyphicon } from 'react-bootstrap'
import Display from './Display'
import _ from 'underscore'
import * as VideoActions from '../actions/VideoActions'
import VideoStore from '../stores/VideoStore'
import ReactCountdownClock from 'react-countdown-clock-fork'
import Delay from 'react-delay'

var global = require("global")
var document = require("global/document")
var window = require("global/window")


export default class Video extends React.Component {
	constructor() {
		super()
		this.open = this.open.bind(this)
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
		this.userReady = this.userReady.bind(this)
		this.noEligibleUsers = this.noEligibleUsers.bind(this)
		this.closeEvent = this.closeEvent.bind(this)
		this.peerSocket = this.peerSocket.bind(this)
		this.makeSelection = this.makeSelection.bind(this)
		this.likeHandler = this.likeHandler.bind(this)
		this.usersChange = this.usersChange.bind(this)
		this.notAvailable = this.notAvailable.bind(this)
		this.newMatch = this.newMatch.bind(this)
		this.outOfTime = this.outOfTime.bind(this)
		this.doubleLike = this.doubleLike.bind(this)
		this.step1 = this.step1.bind(this)
		this.step2 = this.step2.bind(this)
		this.step3 = this.step3.bind(this)
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
			previousChats: []
		}
	}

	componentWillMount() {
		const peerId = this.props.user.cuid
		const fn = this.props.user.firstName
		const age = this.props.user.age
		this.peer = new Peer({ host: 'localhost', port: 3000, debug: 3, path: '/connect', metadata: {cuid:peerId, firstName: fn, age: age}});
		this.peer.on('open', this.open);
		this.peer.on('call', this.onCall);
		this.peer.on('error', this.error);
		this.socket = io()
		this.socket.on('connect', this.connect);
		this.socket.on('makeSelection', this.makeSelection);
		this.socket.on('usersChange', this.usersChange)
		this.socket.on('userReady', this.userReady);
		this.socket.on('notAvailable', this.notAvailable);
		this.socket.on('peerSocket', this.peerSocket);
		this.socket.on('closeEvent', this.closeEvent);
		this.socket.on('idRetrieval', this.idRetrieval)
		this.socket.on('noEligibleUsers', this.noEligibleUsers)
		this.socket.on('newMatch', this.newMatch)
    	VideoStore.on('change', () => {
    		this.nextMatch()
    		console.log("coming from video store change")
    	})
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
		let id = setTimeout(function() {}, 0);
		while (id--) {
		    window.clearTimeout(id); // will do nothing if no timeout with id is present
		}
      	clearTimeout(this.timeout)
	}

	step1 () {
		console.log("timer done")
      // const cam = navigator.mediaDevices.getUserMedia({audio: false, video: true})
      // 	cam.then( (mediaStream) => {
      //   this.setState({mySource: URL.createObjectURL(mediaStream)})
      //   window.localStream = mediaStream
      // 	})
      // 	cam.catch((error) => { console.log("error getting camera") });
  }

  outOfTime() {
  	const _this = this
  	this.timeout = setTimeout(()=>{
  		this.doubleLike()
  		clearTo()
  	},63000)

  	function clearTo() {
    		clearTimeout(_this.timeout)
    		console.log("from the time run out")
  	}
  }

  doubleLike() {
  	let id = setTimeout(function() {}, 0),
  	_this = this
	while (id--) {
	    window.clearTimeout(id); // will do nothing if no timeout with id is present
	}

  	console.log('onComplete')
  	if (this.props.user.gender === "Male"){
  	  	this.socket.emit('likeToo', {myId:this.props.user.cuid, peerId:this.state.peerCuid, myGender: this.props.user.gender, peerSocket: this.state.peerSocket})
  	}
  	setTimeout(function() {
  		_this.setState({selecting: false, streaming: false, waiting: true, buttonStatus: true}, _this.closeCall)
  		VideoActions.addToPreviousChats(_this.state.peerCuid, _this.props.user.cuid)
  	}, 200)
	
  }


	open() {
		// new Promise((fulfill, reject) => {
		// 	fulfill(this.step1())
		// }).then(() => {
			this.nextMatch()
			console.log(this.state.previousChats, "from open")
		// })	
	}

	nextMatch() {
		if (this.props.user.gender === "Female") {
			this.femaleAction()
		}
		if (this.props.user.gender === "Male") {
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
	      this.step3(call)
	     })
	     cam.catch((error) => { console.log("error getting camera") });
 	}


		// new Promise((fulfill, reject) => {
		// 	const call = this.peer.call(payload, mediaStream, {metadata: {peerSocket: this.socket.id}})
		// 	fulfill(call)
		// }).then((call) => {
		// 	this.step3(call)
		// 	}) 
	}

	buttonHandler() {
		this.setState({buttonStatus: true})
		let timeout = setTimeout(()=>{
			this.setState({buttonStatus: false})
			clearTo()
		}, 2000)

		function clearTo(){
			console.log(timeout, "from button clear")
			clearTimeout(timeout)
		}
	}

	closeCall() {
		window.existingCall.close()
	}

	reject() {
		console.log(toastr.options, "from reject")
		toastr.error("no title")
		let id = setTimeout(function() {}, 0);
		while (id--) {
		    window.clearTimeout(id); // will do nothing if no timeout with id is present
		}
		clearTimeout(this.timeout)
		this.socket.emit('rejected', this.state.peerSocket)
		VideoActions.addToPreviousChats(this.state.peerCuid, this.props.user.cuid)
		this.setState({selecting: false, streaming: false, waiting: true, buttonStatus: true}, this.closeCall)
	}

	likeHandler() {
		let id = setTimeout(function() {}, 0);
		while (id--) {
		    window.clearTimeout(id); // will do nothing if no timeout with id is present
		}
		clearTimeout(this.timeout)
		if(this.state.selecting){
			this.socket.emit('likeToo', {myId:this.props.user.cuid, peerId:this.state.peerCuid, myGender: this.props.user.gender, peerSocket: this.state.peerSocket})
		} else {
			this.socket.emit('liked', {myId:this.props.user.cuid, peerId:this.state.peerCuid, peerSocket: this.state.peerSocket})
		}
		VideoActions.addToPreviousChats(this.state.peerCuid, this.props.user.cuid)
		this.setState({selecting: false, streaming: false, waiting: true, buttonStatus: true}, this.closeCall)
	}

	makeSelection() {
		this.setState({selecting:true})
	}

	notAvailable() {
		this.setState({waiting: true})
		console.log('all potential matches are busy at the moment')
	}

	noEligibleUsers() {
		this.setState({waiting: true})
		console.log("No available users at the moment")
	}

	usersChange(payload) {
		const check = _.contains(this.state.previousChats, payload)
		if (this.props.user.cuid != payload && !this.state.streaming && !check){
		console.log("received user change " + payload + " " + Date.now())
		this.state.waiting ? this.nextMatch() : null			
		}
	}

	userReady(payload) {
		if (!this.state.streaming && !this.state.waiting) {
			this.socket.emit("pullFromWaiting")
		}
	}
	
	closeEvent(payload) {
		clearTimeout(this.timeout)
		console.log(payload, "payload from closeEvent")
		console.log(this.state.peerSocket, "peerSocket from closeEvent")
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
	newMatch(){
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
        call.answer(mediaStream);
        this.step3(call);
      	})
      	cam.catch((error) => { console.log("error getting camera") });





		// this.setState({peerSocket: call.metadata.peerSocket})
		// call.answer(mediaStream);
  //   this.step3(call);
	}

	error(err) {
		alert(err.message);
    // Return to step 2 if error occurs
   	this.step2();
	}

	step2() {

	}

	step3 (call) {
			// var chatLimit;
      call.on('stream', stream => {
      	if (this.props.user.gender === "Female") {
      		this.socket.emit('sendSocket', {destination: this.state.peerSocket, socketId: this.socket.id})
      	}
      	const previousChats = this.state.previousChats.slice()
      	previousChats.push(this.state.peerCuid)
        this.setState({otherSource: URL.createObjectURL(stream), streaming: true, previousChats: previousChats}, this.outOfTime)
        console.log("repetition check from stream")
        this.buttonHandler()
        //   chatLimit = setTimeout(() => {
        // 		window.existingCall.close();
        // 		alert("Conversation has ended")
        // }, 8000)
      });
      window.existingCall = call;
      call.on('close', () => {
      	// clearTimeout(chatLimit)
      	let id = setTimeout(function() {}, 0);
		while (id--) {
		    window.clearTimeout(id); // will do nothing if no timeout with id is present
		}
      	clearTimeout(this.timeout)
      	console.log(this.props.user.firstName + " " + this.props.user.gender + " " + this.state.streaming)
      	if (this.state.streaming){
      		this.socket.emit('rejected', this.state.peerSocket)
	      	this.setState({streaming: false, waiting: true})
			// this.state.selecting ? null : VideoActions.addToPreviousChats(this.state.peerCuid, this.props.user.cuid)
	      	console.log("shouldn't get here from like or reject button")
	      	if (!this.state.selecting) {
	      		this.setState({buttonStatus: true})
	      		VideoActions.addToPreviousChats(this.state.peerCuid, this.props.user.cuid)
	      	} else {
	      		VideoActions.addToPreviousChats(this.state.peerCuid, this.props.user.cuid, "null")
	      	}
      	}
      });
    }

	render() {
		const mySource = this.state.mySource
		const otherSource = this.state.otherSource
		const buttonStatus = this.state.buttonStatus

		const leftButtonClass = buttonStatus ? "disabled-button" : "text-danger g-arrows"

		const rightButtonClass = buttonStatus ? "disabled-button" : "text-success g-arrows"
		return (
			<div>

				<div id="vid-container">
					<video id='my-video' src={this.state.waiting ? null : mySource} autoPlay >
					</video>
					<video id='other-video' src={this.state.waiting ? '/img/static3.mp4' : otherSource} autoPlay muted={this.state.waiting} loop={this.state.waiting}>
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
					<Delay wait={1000}>
						<ReactCountdownClock seconds={60} color="black" alpha={0.9} onComplete={null} showMilliseconds={false} />
					</Delay>
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