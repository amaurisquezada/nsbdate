import React from 'react'
import io from 'socket.io-client'
import root from 'window-or-global'
import { Glyphicon } from 'react-bootstrap'
import Display from './Display'
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
		this.makeSelection = this.makeSelection.bind(this)
		this.likeHandler = this.likeHandler.bind(this)
		this.newMatch = this.newMatch.bind(this)
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
			selecting: false
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
		this.socket.on('makeSelection', this.makeSelection);
		this.socket.on('peerSocket', this.peerSocket);
		this.socket.on('closeEvent', this.closeEvent);
		this.socket.on('idRetrieval', this.idRetrieval)
		this.socket.on('noEligibleUsers', this.noEligibleUsers)
		this.socket.on('newMatch', this.newMatch)
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
		this.setState({selecting: false})
		this.socket.emit('rejected', this.state.peerSocket)
	}

	likeHandler() {
		if(this.state.selecting){
			this.socket.emit('likeToo', {myId:this.props.user.cuid, peerId:this.state.peerCuid, myGender: this.props.user.gender, peerSocket: this.state.peerSocket})
		} else {
			this.socket.emit('liked', {myId:this.props.user.cuid, peerId:this.state.peerCuid, peerSocket: this.state.peerSocket})
		}		
			this.setState({selecting: false})		
	}

	makeSelection() {
		this.setState({selecting:true})
	}

	noEligibleUsers() {
		console.log("no more eligible users")
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
	newMatch(){
		alert("Successful Match")
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
        }, 25000)
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
		const buttonStatus = this.state.buttonStatus

		const leftButtonClass = buttonStatus ? "disabled-button" : "text-danger g-arrows"

		const rightButtonClass = buttonStatus ? "disabled-button" : "text-success g-arrows"

		return (
			<div>

				<div id="vid-container">
					<video id='my-video' src={mySource} autoPlay >
					</video>
					<video id='other-video' src={otherSource} autoPlay >
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
				<Display if={this.state.selecting}>
					<div id="test-div-1">
						<h3>The video chat has ended. Please make a selection!</h3>
					</div>
				</Display>
			</div>
			)
	}
}