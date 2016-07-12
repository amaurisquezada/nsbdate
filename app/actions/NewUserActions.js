import dispatcher from '../dispatcher'

  export function updateNewUser(data) {
    $.ajax({
      type: 'PUT',
      url: '/api/user/:id' ,
      data: data
    })
      .done(() => {
        console.log(data)
      })
      .fail((err) => {
        console.log(err);
      });
  }