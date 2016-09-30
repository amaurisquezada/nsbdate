import { EventEmitter } from 'events';
import dispatcher from '../dispatcher'

class ChatStore extends EventEmitter {
  constructor() {
    super()
    this.convos = [],
    this.currentConvo = {}
}

  allConvos(convos) {
   this.convos = convos
   this.emit("change")
  }

  getConvos() {
    return this.convos
  }

  // addToConvo(currentConvo) {
  //   this.curentConvo = currentConvo
  //   this.emit("newMessage")
  // }

  // getMessages() {
  //   return this.currentConvo
  // }

  
  handleActions(action) {
    switch(action.type) {
      case "USER_CONVOS": {
        this.allConvos(action.convos)
      }
      // case "ADD_TO_CURRENT_CONVO": {
      //   this.addToConvo(action.currentConvo)
      // }
    }
  }

}

const chatStore = new ChatStore;
dispatcher.register(chatStore.handleActions.bind(chatStore))
export default chatStore;
