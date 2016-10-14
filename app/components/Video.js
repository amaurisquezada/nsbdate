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
		this.womanAvailableToChat = this.womanAvailableToChat.bind(this)
		this.notAvailable = this.notAvailable.bind(this)
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
			peerName: '',
			peerAge: '',
			selecting: false,
			waiting: false
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
		this.socket.on('womanAvailableToChat', this.womanAvailableToChat)
		this.socket.on('notAvailable', this.notAvailable);
		this.socket.on('peerSocket', this.peerSocket);
		this.socket.on('closeEvent', this.closeEvent);
		this.socket.on('idRetrieval', this.idRetrieval)
		this.socket.on('noEligibleUsers', this.noEligibleUsers)
		this.socket.on('newMatch', this.newMatch)
    VideoStore.on('change', this.nextMatch)
	}

	componentWillUnmount() {
		this.peer.destroy()
		this.socket.close()
		VideoStore.removeListener('change', this.nextMatch)
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
		this.socket.emit('addToWsm', {
			peerId: this.peer.id, 
			peerCuid: this.peer.options.metadata.cuid, 
			peerName: this.peer.options.metadata.firstName,
			peerAge: this.peer.options.metadata.age
		})
	}

	idRetrieval(payload) {
		const cam = navigator.mediaDevices.getUserMedia({audio: false, video: true})
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
			window.existingCall.close()
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
	}

	womanAvailableToChat() {
		this.state.waiting ? this.nextMatch() : null
	}
	
	closeEvent() {
			console.log("received close event")
			window.existingCall.close()
	}

	connect() {
		this.props.user.gender === "Female" ? this.socket.emit('femaleRoom') : this.socket.emit('maleRoom')
	}

	peerSocket(payload) {
		this.setState({peerSocket: payload})
	}
	newMatch(){
		alert("Successful Match")
	}

	onCall(call) {
		const cam = navigator.mediaDevices.getUserMedia({audio: false, video: true})
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
        this.setState({otherSource: URL.createObjectURL(stream)})
        this.buttonHandler()
        //   chatLimit = setTimeout(() => {
        // 		window.existingCall.close();
        // 		alert("Conversation has ended")
        // }, 8000)
      });
      window.existingCall = call;
      call.on('close', () => {
      	// clearTimeout(chatLimit)
				VideoActions.addToPreviousChats(this.state.peerCuid, this.props.user.cuid)
      	console.log("call finished")
      	if (!this.state.selecting) {
      		this.setState({buttonStatus: true})
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
				<Display if={this.state.peerName && this.state.peerAge}>
					<div className="peer-name-wrapper">
						<p>{this.state.peerName + ", " + this.state.peerAge}</p>
					</div>
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