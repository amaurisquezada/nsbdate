import { EventEmitter } from 'events';
import dispatcher from '../dispatcher'

class NavStore extends EventEmitter {
  constructor() {
    super()
    this.notifications = 0
  }

  getNotifications() {
    return this.notifications
  }

  setNotifications(number) {
    this.notifications = number ? number.amount : 0
    this.emit("change")
  }
  
  handleActions(action) {
    switch(action.type) {
      case "CHAT_NOTIFICATIONS": {
        this.setNotifications(action.notifications)
      }
      case "CLEAR_NOTIFICATIONS": {
        this.setNotifications(action.notifications)
      }
    }
  }
}

const navStore = new NavStore
dispatcher.register(navStore.handleActions.bind(navStore))
export default navStore;
