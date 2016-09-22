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