import dispatcher from '../dispatcher'

export function createUser(firstName) {
  dispatcher.dispatch({
    type: "CREATE_USER",
    firstName,
  });
}

export function deleteUser(id) {
  dispatcher.dispatch({
    type: "DELETE_USER",
    id,
  });
}

export function receiveUsers() {
    $.ajax({ url: '/api/users'})
      .done((data) => {
        console.log(data)
        dispatcher.dispatch({
         type: "RECEIVE_USERS",
         users: data
         })
      })
}

export function currentUser() {
    $.ajax({ url: '/api/currentUser'})
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