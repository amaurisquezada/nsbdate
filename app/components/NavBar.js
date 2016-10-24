import React from 'react'
import { Nav } from 'react-bootstrap'
import { Link } from 'react-router'
import * as AppActions from '../actions/AppActions'
import * as ChatActions from '../actions/ChatActions'
import NavStore from '../stores/NavStore'

export default class NavBar extends React.Component {
	constructor() {
    super()
    this.signout = this.signout.bind(this)
    this.chatData = this.chatData.bind(this)
    this.state = {
      notifications: NavStore.getNotifications()
    }
	}

  componentWillMount() {
    NavStore.on('change', () => {
      this.setState({
        notifications: NavStore.getNotifications()
      })
    })
  }

  componentWillUnmount() {
    NavStore.removeAllListeners()
  }

  chatData() {
    ChatActions.getConvos()
    ChatActions.getLastConvo()
  }

  signout(){
    AppActions.signout()
  }

	render() {
    const badgeClass = this.state.notifications > 0 && !this.props.clear ? "label label-default label-as-badge" : "hidden",
          accountClass = this.state.notifications > 0 && !this.props.clear ? "btn btn-default nav-buttons adjustment" : "btn btn-default nav-buttons";
		return (
      <Nav bsStyle="tabs" activeKey={1} >       
        <Link className="btn btn-default nav-buttons" eventKey={1} to='/'>Video Chat</Link>
        <Link className={accountClass} onClick={this.chatData} eventKey={2} to='/mychats'>My Chats<span className={badgeClass}>{this.props.clear ? 0 : this.state.notifications}</span></Link>
        <Link className="btn btn-default nav-buttons" eventKey={3} to='/newuser'>Account</Link>
        <Link className="btn btn-default nav-buttons" eventKey={4} to='/login' onClick={this.signout}>Sign Out</Link>
      </Nav>
    )
	}
}