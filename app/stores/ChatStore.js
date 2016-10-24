import { EventEmitter } from 'events';
import dispatcher from '../dispatcher'

class ChatStore extends EventEmitter {
  constructor() {
    super()
    this.convos = [],
    this.lastConvo = '',
    this.lastClicked = '',
    this.currentConvo = {}
  }

  allConvos(convos) {
   this.convos = convos
   this.emit("change")
  }

  getConvos() {
    return this.convos
  }

  updateLastConvo(convo) {
    if (convo){
      this.lastConvo = convo.lastConvo
      this.lastClicked = convo.lastClicked
      this.currentConvo = convo.currentConvo
      this.emit("lastConvoChange")
    }
  }

  getLastConvo() {
    return this.lastConvo
  }

  getCurrentConvo() {
    return this.currentConvo
  }

  getLastClicked() {
    return this.lastClicked
  }
  
  handleActions(action) {
    switch(action.type) {
      case "USER_CONVOS": {
        this.allConvos(action.convos)
      }
      case "LAST_CONVO": {
        this.updateLastConvo(action.convo)
      }
    }
  }
}

const chatStore = new ChatStore
dispatcher.register(chatStore.handleActions.bind(chatStore))
export default chatStore;
