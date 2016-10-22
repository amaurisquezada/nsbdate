import React from 'react'
import  { Nav } from 'react-bootstrap'
import { Link } from 'react-router';
import * as AppActions from '../actions/AppActions'
import * as ChatActions from '../actions/ChatActions'

export default class Nav1 extends React.Component {
	constructor() {
    super()
    this.signout = this.signout.bind(this)
    this.chatData = this.chatData.bind(this)
		super()
	}

  chatData() {
    ChatActions.getConvos()
    ChatActions.getLastConvo()
  }

  signout(){
    AppActions.signout()
  }

	render() {
		return (
      <Nav bsStyle="tabs" activeKey={1} >       
       <Link className="btn btn-default nav-buttons" eventKey={1} to='/'>Video Chat</Link>
       <Link className="btn btn-default nav-buttons" onClick={this.chatData} eventKey={2} to='/mychats'>My Chats<span className="badge">10</span></Link>
       <Link className="btn btn-default nav-buttons" eventKey={3} to='/newuser'>Account</Link>
       <Link className="btn btn-default nav-buttons" eventKey={4} to='/login' onClick={this.signout}>Sign Out</Link>
      </Nav>
    )
	}

}