import dispatcher from '../dispatcher'

export function addToPreviousChats(id, myId, event="change") {
  $.ajax({
    type: 'PUT',
    url: '/api/atpc' ,
    data: {peerId: id, myId}
  })
    .done((data) => {
      dispatcher.dispatch({type: "ADD_TO_PREVIOUS_CHATS", previousChats: data, event: event})
    })
    .fail((err) => {
      console.log(err);
    })
}

export function retrievePreviousChats() {
  $.ajax({url: '/api/rpc'})
    .done((data) => {
      dispatcher.dispatch({type: "SET_PREVIOUS_CHATS", previousChats: data})
    })
    .fail((err) => {
      console.log(err);
    })
}