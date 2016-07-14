import dispatcher from '../dispatcher'

// export function getWomanId() {
//     $.ajax({ url: '/api/get-woman-id'})
//       .done((data) => {
//         dispatcher.dispatch({
//          type: "GET_WOMAN_ID",
//          womanId: data
//          })
//       })
// }

// export function addPeerIdToWsm(cuid) {
//     $.ajax({ 
//             url: '/api/wsm',
//             type: 'POST',
//             data: { cuid }
//          })
//       .done((data) => {
//         dispatcher.dispatch({
//          type: "ADD_PEER_TO_WSM"
//          })
//       })
// }


export function addToPreviousChats(id, myId) {
  $.ajax({
    type: 'PUT',
    url: '/api/atpc' ,
    data: {peerId: id, myId}
  })
    .done((data) => {
      dispatcher.dispatch({type: "ADD_TO_PREVIOUS_CHATS"})
    })
    .fail((err) => {
      console.log(err);
    })
}