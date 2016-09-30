import dispatcher from '../dispatcher'

export function getConvos() {
    $.ajax({ url: '/api/get-convos'})
      .done((data) => {
        dispatcher.dispatch({
         type: "USER_CONVOS",
         convos: data
         })
      })
}

// export function addMessageToConversation(convoId, authorId, text) {
//   $.ajax({
//     type: 'PUT',
//     url: '/api/amtc' ,
//     data: {convoId, authorId, text}
//   })
//     .done((data) => {
//       dispatcher.dispatch({
//         type: "ADD_TO_CURRENT_CONVO",
//         currentConvo: data
//       })
//     })
//     .fail((err) => {
//       console.log(err);
//     })
// }