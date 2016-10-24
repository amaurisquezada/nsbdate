import { EventEmitter } from 'events'
import dispatcher from '../dispatcher'

class AppStore extends EventEmitter {
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

  signout() {
    this.user = []
  }

  handleActions(action) {
    switch(action.type) {
      case "CURRENT_USER": {
        this.currentUser(action.currentUser)
      }
      case "SIGN_OUT": {
        this.signout()
      }
    }
  }
}

const appStore = new AppStore
dispatcher.register(appStore.handleActions.bind(appStore))
export default appStore;