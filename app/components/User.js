import React from 'react'
import { Button } from 'react-bootstrap'
import io from 'socket.io-client'
import UserStore from '../stores/UserStore'
import * as AppActions from '../actions/AppActions'
import * as NavActions from '../actions/NavActions'
import NavBar from './NavBar'
import Display from './Display'
import Video from './Video'

export class User extends React.Component {

  constructor() {
    super()
    //For development purposes.
    // this.check = this.check.bind(this)
    // this.amauris = this.amauris.bind(this)
    // this.austin = this.austin.bind(this)
    // this.maia = this.maia.bind(this)
    // this.diffchick = this.diffchick.bind(this)
    // this.lastgirl = this.lastgirl.bind(this)
    // this.reggie = this.reggie.bind(this)
    this.seekToggle = this.seekToggle.bind(this)
    this.updateNotifications = this.updateNotifications.bind(this)
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

  componentDidMount() {
    this.socket = io()
    this.socket.on("updateNotifications", this.updateNotifications)
    AppActions.currentUser()
    setTimeout(() => {
      if (this.props.user._id){
        this.socket.emit('subscribe', this.props.user._id)
      }
    }, 200)
  }

  componentWillUnmount() {
    UserStore.removeAllListeners()
    this.socket.removeAllListeners()
    this.socket.disconnect()
  }

  seekToggle() {
    let user = this.state.user
    user.available = !user.available
    this.setState({user: user})
  }

  updateNotifications(userId) {
    NavActions.getNotifications(userId)
  }

//Temporary Sign in functions for development

  // check() {
  //   console.log(this.state.user, "state.user")
  //   console.log(this.props, "props")
  // }

  // amauris() {
  //   AppActions.currentUser('Amauris')
  //   this.setState({tempSi:false})
  //   setTimeout(() => {
  //     NavActions.getNotifications(this.props.user._id)
  //     this.socket.emit('subscribe', this.props.user._id)
  //   }, 200)
  // }

  // austin() {
  //   AppActions.currentUser('Austin')
  //   this.setState({tempSi:false})
  //   setTimeout(() => {
  //     NavActions.getNotifications(this.props.user._id)
  //     this.socket.emit('subscribe', this.props.user._id)
  //   }, 200)
  // }

  // maia() {
  //   AppActions.currentUser('Maia')
  //   this.setState({tempSi:false})
  //   setTimeout(() => {
  //     NavActions.getNotifications(this.props.user._id)
  //     this.socket.emit('subscribe', this.props.user._id)
  //   }, 200)
  // }

  // diffchick() {
  //   AppActions.currentUser('Diff')
  //   this.setState({tempSi:false})
  //   setTimeout(() => {
  //     NavActions.getNotifications(this.props.user._id)
  //     this.socket.emit('subscribe', this.props.user._id)
  //   }, 200)
  // }

  // lastgirl() {
  //   AppActions.currentUser('Last')
  //   this.setState({tempSi:false})
  //   setTimeout(() => {
  //     NavActions.getNotifications(this.props.user._id)
  //     this.socket.emit('subscribe', this.props.user._id)
  //   }, 200)
  // }

  // reggie() {
  //   AppActions.currentUser('Reggie')
  //   this.setState({tempSi:false})
  //   setTimeout(() => {
  //     NavActions.getNotifications(this.props.user._id)
  //     this.socket.emit('subscribe', this.props.user._id)
  //   }, 200)
  // }

  render() {
    const matching = this.state.user.available ? "Stop matching" : "Start matching!",
          buttonClass = this.state.user.available ? "btn btn-danger video-control" : "btn btn-info video-control",
          tempSi = this.state.tempSi ? "temp-si" : "hidden";
    return(
      <div className="container">
        <NavBar user={this.state.user} />

{/* Temporary buttons for development

        <Button onClick={this.check} className={tempSi}>See State</Button>
        <Button onClick={this.amauris} className={tempSi}>Sign in as Amauris</Button>
        <Button onClick={this.austin} className={tempSi}>Sign in as Austin</Button>
        <Button onClick={this.maia} className={tempSi}>Sign in as Maia</Button>
        <Button onClick={this.diffchick} className={tempSi}>Sign in as Diff Chick</Button>
        <Button onClick={this.lastgirl} className={tempSi}>Sign in as Last Girl</Button>
        <Button onClick={this.reggie} className={tempSi}>Sign in as Reggie</Button> */}
        
        <Display if={this.state.user.available}>
          <Video user={this.state.user}/>
        </Display>
        <Button className={buttonClass} bsSize="lg" onClick={this.seekToggle}>{matching}</Button>
      </div>
    )
  }
}
export default User;