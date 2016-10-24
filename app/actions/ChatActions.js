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

export function getLastConvo() {
    $.ajax({ url: '/api/get-last-convo'})
      .done((data) => {
        dispatcher.dispatch({
          type: "LAST_CONVO",
          convo: data
        })
      })
}
