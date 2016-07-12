import { EventEmitter } from 'events';
import dispatcher from '../dispatcher'

class UserStore extends EventEmitter {
  constructor() {
    super()
    this.user = []
}

  currentUser(user) {
   this.user = user
   this.emit('change')
  }

  getUser() {
    return this.user
  }

  createUser(firstName) {
    this.users.push({
      firstName: firstName
    })
    this.emit('change')
  }

  receiveUsers(users) {
    this.users = users
    this.emit('change')
  }

  signout() {
    this.user = []
  }

  handleActions(action) {
    switch(action.type) {
      case "CREATE_USER": {
        this.createUser(action.firstName)
      }
      case "RECEIVE_USERS": {
        this.receiveUsers(action.users)
      }
      case "CURRENT_USER": {
        this.currentUser(action.currentUser)
      }
      case "SIGN_OUT": {
        this.signout()
      }
    }
  }

}

const userStore = new UserStore;
dispatcher.register(userStore.handleActions.bind(userStore))
export default userStore;
