import { EventEmitter } from 'events';
import dispatcher from '../dispatcher'

class VideoStore extends EventEmitter {
  constructor() {
    super()
    this.previousChats = []
  }

  cuidAddedToPc(pc, event) {
    this.previousChats = pc
    this.emit(event)
  }

  getPreviousChats() {
    return this.previousChats
  }

  setPreviousChats(pc) {
    this.previousChats = pc
    this.emit('initial')
  }

  handleActions(action) {
    switch(action.type) {
      case "ADD_TO_PREVIOUS_CHATS": {
        this.cuidAddedToPc(action.previousChats, action.event)
      }
      case "SET_PREVIOUS_CHATS": {
        this.setPreviousChats(action.previousChats)
      }
    }
  }
}

const videoStore = new VideoStore
dispatcher.register(videoStore.handleActions.bind(videoStore))
export default videoStore;
