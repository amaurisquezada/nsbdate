import React, { PropTypes as T } from 'react'
import {Button, Glyphicon} from 'react-bootstrap'
import UserStore from '../stores/UserStore'
import AppStore from '../stores/AppStore'
import * as UserActions from '../actions/UserActions'
import * as AppActions from '../actions/AppActions'
import Nav1 from './Nav1'
import Display from './Display'
import Video from './Video'
import { browserHistory } from 'react-router';

export class User extends React.Component {

  constructor() {
    super()
    this.check = this.check.bind(this)
    this.seekToggle = this.seekToggle.bind(this)
    this.amauris = this.amauris.bind(this)
    this.austin = this.austin.bind(this)
    this.maia = this.maia.bind(this)
    this.diffchick = this.diffchick.bind(this)
    this.lastgirl = this.lastgirl.bind(this)
    this.reggie = this.reggie.bind(this)
    this.state = {
      user: UserStore.getUser()
    }
  }

  componentWillMount() {
    UserStore.on('change', () => {
      this.setState({
        user: UserStore.getUser()
      })
    })
  }

  seekToggle() {
    const user = this.state.user;
    user.available = !user.available;

    this.setState({user: user});
  }

  check() {
    console.log(this.state.user, "state.user")
    console.log(this.props, "props")
  }


  amauris() {
    AppActions.currentUser('Amauris')
  }

  austin() {
    AppActions.currentUser('Austin')
  }

  maia() {
    AppActions.currentUser('Maia')
  }

  diffchick() {
    AppActions.currentUser('Diff')
  }

  lastgirl() {
    AppActions.currentUser('Last')
  }

  reggie() {
    AppActions.currentUser('Reggie')
  }

  render() {
    const matching = this.state.user.available ? "Stop matching" : "Start matching!"
    const buttonClass = this.state.user.available ? "btn btn-danger video-control" : "btn btn-info video-control"
    return(
          <div className="container">
            <Nav1/>
            <Button onClick={this.check} className="temp-si">See State</Button>
            <Button onClick={this.amauris} className="temp-si">Sign in as Amauris</Button>
            <Button onClick={this.austin} className="temp-si">Sign in as Austin</Button>
            <Button onClick={this.maia} className="temp-si">Sign in as Maia</Button>
            <Button onClick={this.diffchick} className="temp-si">Sign in as Diff Chick</Button>
            <Button onClick={this.lastgirl} className="temp-si">Sign in as Last Girl</Button>
            <Button onClick={this.reggie} className="temp-si">Sign in as Reggie</Button>
            <Display if={this.state.user.available}>
              <Video user={this.state.user}/>
            </Display>
            <Button className={buttonClass} bsSize="lg" onClick={this.seekToggle}>{matching}</Button>
          </div>
          )
  }
}
export default User;