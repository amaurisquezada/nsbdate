import React from 'react'
import  { Nav } from 'react-bootstrap'
import { Link } from 'react-router';
import * as AppActions from '../actions/AppActions'

export default class Nav1 extends React.Component {
	constructor() {
    super()
    this.signout = this.signout.bind(this)
		super()
	}

  signout(){
    AppActions.signout()
  }

	render() {
		return (
            <Nav bsStyle="tabs" activeKey={1} >       
             <Link className="btn btn-default nav-buttons" eventKey={1} to='/'>Video Chat</Link>
             <Link className="btn btn-default nav-buttons" eventKey={2} to='/mychats'>My Chats</Link>
             <Link className="btn btn-default nav-buttons" eventKey={3} to='/newuser'>Account</Link>
             <Link className="btn btn-default nav-buttons" eventKey={4} to='/login' onClick={this.signout}>Sign Out</Link>
            </Nav>
          )
	}

}