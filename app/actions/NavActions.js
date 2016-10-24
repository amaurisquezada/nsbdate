import dispatcher from '../dispatcher'

export function getNotifications(user) {
    $.ajax({ url: '/api/get-notifications', data: user})
      .done((data) => {
        dispatcher.dispatch({
          type: "CHAT_NOTIFICATIONS",
          notifications: data
        })
      })
}

export function clearNotifications() {
    dispatcher.dispatch({
      type: "CLEAR_NOTIFICATIONS",
      notifitcations: {amount: 0}
    })
}