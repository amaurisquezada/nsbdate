import dispatcher from '../dispatcher'

export function updateNewUser(data) {
  $.ajax({
    type: 'PUT',
    url: '/api/user/:id' ,
    data: data
  })
    .done(() => {
    })
    .fail((err) => {
      console.log(err);
    })
}