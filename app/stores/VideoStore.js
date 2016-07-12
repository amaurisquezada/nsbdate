import { EventEmitter } from 'events';
import dispatcher from '../dispatcher'

class VideoStore extends EventEmitter {
  constructor() {
    super()
}

  cuidAddedToPc() {
   this.emit('change')
  }

  getWomanId() {
    return this.womanId
  }

  handleActions(action) {
    switch(action.type) {
      case "ADD_TO_PREVIOUS_CHATS": {
        this.cuidAddedToPc()
      }
    }
  }

}

const videoStore = new VideoStore;
dispatcher.register(videoStore.handleActions.bind(videoStore))
export default videoStore;
