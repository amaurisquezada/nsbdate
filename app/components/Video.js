import React from 'react'
import io from 'socket.io-client'
import root from 'window-or-global'
import { Glyphicon } from 'react-bootstrap'
import * as VideoActions from '../actions/VideoActions'
import VideoStore from '../stores/VideoStore'

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
		this.error = this.error.bind(this)
		this.nextMatch = this.nextMatch.bind(this)
		this.femaleAction = this.femaleAction.bind(this)
		this.maleAction = this.maleAction.bind(this)
		this.buttonHandler = this.buttonHandler.bind(this)
		this.reject = this.reject.bind(this)
		this.noEligibleUsers = this.noEligibleUsers.bind(this)
		this.closeEvent = this.closeEvent.bind(this)
		this.peerSocket = this.peerSocket.bind(this)
		this.like = this.like.bind(this)
		this.step1 = this.step1.bind(this)
		this.step2 = this.step2.bind(this)
		this.step3 = this.step3.bind(this)
		this.state = {
			mySource: '',
			otherSource: '',
			buttonStatus: true, 
			mySocket: '',
			peerSocket: '',
			peerCuid: ''
		}
	}

	componentWillMount() {
		const peerId = this.props.user.cuid
		this.peer = new Peer({ host: 'localhost', port: 3000, debug: 3, path: '/connect', metadata: {cuid:peerId}});
		this.peer.on('open', this.open);
		this.peer.on('call', this.onCall);
		this.peer.on('error', this.error);
		this.socket = io()
		this.socket.on('connect', this.connect);
		this.socket.on('peerSocket', this.peerSocket);
		this.socket.on('closeEvent', this.closeEvent);
		this.socket.on('idRetrieval', this.idRetrieval)
		this.socket.on('noEligibleUsers', this.noEligibleUsers)
    VideoStore.on('change', this.nextMatch)
	}

	componentWillUnmount() {
		this.peer.destroy()
	}

	step1 () {
      // const cam = navigator.mediaDevices.getUserMedia({audio: false, video: true})
      // 	cam.then( (mediaStream) => {
      //   this.setState({mySource: URL.createObjectURL(mediaStream)})
      //   window.localStream = mediaStream
      // 	})
      // 	cam.catch((error) => { console.log("error getting camera") });
  }


	open() {
		// new Promise((fulfill, reject) => {
		// 	fulfill(this.step1())
		// }).then(() => {
			this.nextMatch()
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
		this.socket.emit('fetchFromWsm', this.props.user.cuid)
	}

	femaleAction() {
		this.socket.emit('addToWsm', {peerId: this.peer.id, peerCuid: this.peer.options.metadata.cuid})
	}

	idRetrieval(payload) {
		const cam = navigator.mediaDevices.getUserMedia({audio: false, video: true})
     cam.then( (mediaStream) => {
      this.setState({mySource: URL.createObjectURL(mediaStream), peerCuid: payload.peerCuid})
      const call = this.peer.call(payload.peerId, mediaStream, {metadata: {peerSocket: this.socket.id, peerCuid: this.props.user.cuid}})
      this.step3(call)
     })
     cam.catch((error) => { console.log("error getting camera") });


		// new Promise((fulfill, reject) => {
		// 	const call = this.peer.call(payload, mediaStream, {metadata: {peerSocket: this.socket.id}})
		// 	fulfill(call)
		// }).then((call) => {
		// 	this.step3(call)
		// 	}) 
	}

	buttonHandler() {
		this.setState({buttonStatus: true})
		setTimeout(()=>{
			this.setState({buttonStatus: false})
		}, 2000)
	}

	reject() {
		window.existingCall.close()
		this.socket.emit('rejected', this.state.peerSocket)
	}

	like() {
		console.log(this.peer.id, "my id")
		console.log(window.existingCall.peer, "other id")		
	}

	noEligibleUsers() {
		console.log("no more users bro!")
	}

	closeEvent() {
		console.log("received close event")
		window.existingCall.close()
	}

	connect() {
		console.log(this.socket.id, "from socket connect")
	}

	peerSocket(payload) {
		this.setState({peerSocket: payload})
	}

	onCall(call) {

		console.log(call.metadata.peerSocket, 'from call listener')
		const cam = navigator.mediaDevices.getUserMedia({audio: false, video: true})
      	cam.then( (mediaStream) => {
        this.setState({peerSocket: call.metadata.peerSocket, mySource: URL.createObjectURL(mediaStream), peerCuid: call.metadata.peerCuid})
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
			var chatLimit;
			// this.socket.emit('dust')
      call.on('stream', stream => {
      	if (this.props.user.gender === "Female") {
      		this.socket.emit('sendSocket', {destination: this.state.peerSocket, socketId: this.socket.id})
      	}
      	console.log("in the stream")
        this.setState({otherSource: URL.createObjectURL(stream)})
        this.buttonHandler()
          chatLimit = setTimeout(() => {
        		window.existingCall.close();
        		alert("hey man!")
        }, 15000)
      });
      window.existingCall = call;
      call.on('close', () => {
      	clearTimeout(chatLimit)
				VideoActions.addToPreviousChats(this.state.peerCuid, this.props.user.cuid)
      	console.log("call finished")
      	this.setState({buttonStatus: true})
      });
    }

	render() {
		const mySource = this.state.mySource
		const otherSource = this.state.otherSource

		const vidContainerStyle = {
			position: 'fixed',
			width: '85%',
			height: '100%'
		}

		const myVideoStyle = {
			height: '20vh',
			width: '30%',
			position: 'relative',
			zIndex: 4,
			left: '70%',
			top: '1%'
		}

		const peerVideoStyle = {
			height: '76vh',
			width: '100%',
			position: 'relative',
			bottom: '20vh',
			right: '5%'
		}

		const leftButtonStyle = {
			fontSize: '100px',
			zIndex: 6,
			position: 'absolute',
			bottom: '18vh',
		}

		const rightButtonStyle = {
			fontSize: '100px',
			zIndex: 6,
			position: 'absolute',
			bottom: '18vh',
			right: '3%'
		}

		const buttonStatus = this.state.buttonStatus

		const leftButtonClass = buttonStatus ? "disabled-button" : "text-danger g-arrows"

		const rightButtonClass = buttonStatus ? "disabled-button" : "text-success g-arrows"

		return (
				<div id="vid-container" style={vidContainerStyle}>
					<video id='#my-video' style={myVideoStyle} src={mySource} autoPlay >
					</video>
					<video id='#other-video' style={peerVideoStyle} src={otherSource} autoPlay >
					</video>
					<div id="left-button-container" style={leftButtonStyle}>
            <p className="arrow-labels">Not for me</p>
            <Glyphicon glyph="arrow-left" className={leftButtonClass} onClick={buttonStatus ? null : this.reject} ></Glyphicon>
          </div>
          <div id="right-button-container" style={rightButtonStyle}>
            <p className="arrow-labels">Like!</p>
            <Glyphicon glyph="arrow-right" className={rightButtonClass} onClick={buttonStatus ? null : this.like} ></Glyphicon>
          </div>
				</div>
			)
	}
}