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
      user: UserStore.getUser(),
      tempSi: true
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
    this.setState({tempSi:false})
  }

  austin() {
    AppActions.currentUser('Austin')
    this.setState({tempSi:false})
  }

  maia() {
    AppActions.currentUser('Maia')
    this.setState({tempSi:false})
  }

  diffchick() {
    AppActions.currentUser('Diff')
    this.setState({tempSi:false})
  }

  lastgirl() {
    AppActions.currentUser('Last')
    this.setState({tempSi:false})
  }

  reggie() {
    AppActions.currentUser('Reggie')
    this.setState({tempSi:false})
  }

  render() {
    const matching = this.state.user.available ? "Stop matching" : "Start matching!"
    const buttonClass = this.state.user.available ? "btn btn-danger video-control" : "btn btn-info video-control"
    const tempSi = this.state.tempSi ? "temp-si" : "hidden"
    return(
          <div className="container">
            <Nav1/>
            <Button onClick={this.check} className={tempSi}>See State</Button>
            <Button onClick={this.amauris} className={tempSi}>Sign in as Amauris</Button>
            <Button onClick={this.austin} className={tempSi}>Sign in as Austin</Button>
            <Button onClick={this.maia} className={tempSi}>Sign in as Maia</Button>
            <Button onClick={this.diffchick} className={tempSi}>Sign in as Diff Chick</Button>
            <Button onClick={this.lastgirl} className={tempSi}>Sign in as Last Girl</Button>
            <Button onClick={this.reggie} className={tempSi}>Sign in as Reggie</Button>
            <Display if={this.state.user.available}>
              <Video user={this.state.user}/>
            </Display>
            <Button className={buttonClass} bsSize="lg" onClick={this.seekToggle}>{matching}</Button>
          </div>
          )
  }
}
export default User;