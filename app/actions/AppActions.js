import dispatcher from '../dispatcher'

export function currentUser() {
  $.ajax({
    url: '/api/currentUser'
  })
    .done((data) => {
      dispatcher.dispatch({
        type: "CURRENT_USER",
        currentUser: data
      })
    })
}

export function signout() {
  $.ajax({ 
    url: '/api/signout',
    type: 'POST'
  })
    .done((data) => {
      dispatcher.dispatch({
        type: "SIGN_OUT"
       })
     })
}