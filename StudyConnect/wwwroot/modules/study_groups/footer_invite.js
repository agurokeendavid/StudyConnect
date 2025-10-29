$(function () {
    if (!isAuthenticated) {
        return; // User not authenticated, nothing to do
    }

    // Handle join group button
    $('#btnJoinGroup').on('click', joinGroup);
});

function joinGroup() {
    Swal.fire({
        title: 'Join Study Group?',
        text: 'Are you sure you want to join this study group?',
    icon: 'question',
        showCancelButton: true,
   confirmButtonColor: '#5D87FF',
        cancelButtonColor: '#6c757d',
     confirmButtonText: 'Yes, join!'
    }).then((result) => {
        if (result.isConfirmed) {
 AmagiLoader.show();

            $.ajax({
              url: '/StudyGroups/RequestAccessViaInvite',
   type: 'POST',
      contentType: 'application/json',
            data: JSON.stringify({
        inviteToken: inviteToken
          }),
   success: function (response) {
          AmagiLoader.hide();
           if (response.MessageType === 'Success') {
        Swal.fire({
   title: 'Success!',
      text: response.Message,
               icon: 'success',
   confirmButtonColor: '#5D87FF'
    }).then(() => {
          if (response.RedirectUrl) {
        window.location.href = response.RedirectUrl;
      }
           });
          } else {
             Swal.fire('Error', response.Message || 'Failed to join group', 'error');
    }
      },
            error: function () {
           AmagiLoader.hide();
         Swal.fire('Error', 'An error occurred while joining the group', 'error');
     }
            });
        }
    });
}
