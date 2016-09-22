import { EventEmitter } from 'events';
import dispatcher from '../dispatcher'

class ChatStore extends EventEmitter {
  constructor() {
    super()
    this.convos = []
}

  allConvos(convos) {
   this.convos = convos
   this.emit('change')
  }

  getConvos() {
    return this.convos
  }

  
  handleActions(action) {
    switch(action.type) {
      case "USER_CONVOS": {
        this.allConvos(action.convos)
      }
    }
  }

}

const chatStore = new ChatStore;
dispatcher.register(chatStore.handleActions.bind(chatStore))
export default chatStore;
