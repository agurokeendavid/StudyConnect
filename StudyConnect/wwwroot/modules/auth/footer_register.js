$(function () {
  const formEl = $('#form');
    
    // Initialize DevExtreme TextBox for Last Name
    $("#last_name").dxTextBox({
        placeholder: "Last Name",
        //stylingMode: "outlined",
inputAttr: {
            'aria-label': 'Last Name'
        },
        validationMessageMode: "always",
    onValueChanged: function(e) {
   $("#lastname-hidden").val(e.value);
        }
    }).dxValidator({
        validationRules: [{
     type: "required",
     message: "Last Name is required"
        }]
    });

    // Initialize DevExtreme TextBox for First Name
    $("#first_name").dxTextBox({
        placeholder: "First Name",
        //stylingMode: "outlined",
        inputAttr: {
       'aria-label': 'First Name'
        },
      validationMessageMode: "always",
        onValueChanged: function(e) {
   $("#firstname-hidden").val(e.value);
        }
    }).dxValidator({
        validationRules: [{
            type: "required",
message: "First Name is required"
        }]
    });

    // Initialize DevExtreme TextBox for Middle Name (optional)
    $("#middle_name").dxTextBox({
        placeholder: "Middle Name",
        //stylingMode: "outlined",
        inputAttr: {
    'aria-label': 'Middle Name'
        },
      onValueChanged: function(e) {
        $("#middlename-hidden").val(e.value);
        }
    });

    // Initialize DevExtreme TextBox for Email Address
    $("#username").dxTextBox({
placeholder: "Email Address",
        mode: "email",
        //stylingMode: "outlined",
        inputAttr: {
   'aria-label': 'Email Address',
            'aria-describedby': 'emailHelp'
   },
        validationMessageMode: "always",
        onValueChanged: function(e) {
            $("#email-hidden").val(e.value);
 }
    }).dxValidator({
validationRules: [{
      type: "required",
     message: "Email is required"
   }, {
            type: "email",
        message: "Email is invalid"
     }]
    });

    // Initialize DevExtreme TextBox for Password with toggle visibility
    $("#password").dxTextBox({
        placeholder: "Password",
        mode: "password",
        //stylingMode: "outlined",
        inputAttr: {
            'aria-label': 'Password'
        },
        validationMessageMode: "always",
        onValueChanged: function(e) {
            $("#password-hidden").val(e.value);
        },
  buttons: [{
          name: "password-toggle",
            location: "after",
            options: {
                icon: "fa fa-eye",
      type: "default",
    stylingMode: "text",
              elementAttr: {
      class: "password-toggle-btn"
      },
          onClick: function() {
  var textBox = $("#password").dxTextBox("instance");
 var currentMode = textBox.option("mode");
            var button = textBox.getButton("password-toggle");
  
        if (currentMode === "password") {
       textBox.option("mode", "text");
           button.option("icon", "fa fa-eye-slash");
       } else {
              textBox.option("mode", "password");
           button.option("icon", "fa fa-eye");
     }
     }
            }
        }]
    }).dxValidator({
        validationRules: [{
     type: "required",
            message: "Password is required"
        }]
    });

    // Initialize DevExtreme Button for Register
    $("#btn-register").dxButton({
     text: "Register Now",
        type: "default",
        stylingMode: "contained",
      width: "100%",
        height: 45,
        useSubmitBehavior: false,
        elementAttr: {
            class: "dx-button-primary"
        },
        onClick: function(e) {
   // Get values from DevExtreme controls
var lastName = $("#last_name").dxTextBox("instance").option("value");
     var firstName = $("#first_name").dxTextBox("instance").option("value");
            var middleName = $("#middle_name").dxTextBox("instance").option("value");
            var email = $("#username").dxTextBox("instance").option("value");
       var password = $("#password").dxTextBox("instance").option("value");

         // Update hidden fields
            $("#lastname-hidden").val(lastName);
   $("#firstname-hidden").val(firstName);
            $("#middlename-hidden").val(middleName);
            $("#email-hidden").val(email);
        $("#password-hidden").val(password);

            // Trigger form validation and submit
            var result = validationGroup.validate();
            if (result.isValid) {
        formEl.trigger('submit');
            } else {
                e.event.preventDefault();
            }
        }
    });

  // Initialize DevExtreme ValidationGroup
    var validationGroup = $("#form").dxValidationGroup({}).dxValidationGroup("instance");

  formEl.on('submit', function (e) {
        e.preventDefault();
        
        var result = validationGroup.validate();
        if (!result.isValid) {
 e.preventDefault();
  return false;
   }
        
        $.ajax({
            url: `/Auth/Register`,
      type: 'POST',
      async: true,
   data: $(this).serialize(),
            dataType: 'json',
        beforeSend: function () {
        AmagiLoader.show();
            },
      success: function (response) {
  ResponseHandler.handle(response, {
                  showRedirect: true,
         customHandlers: {
           [MessageTypes.SuccessString]: function(response) {
            return Swal.fire({
 title: 'Registration Successful!',
     text: response.Message,
        icon: 'success',
           confirmButtonColor: '#28a745',
 timer: 2000,
        timerProgressBar: true
              }).then(() => {
            location.replace(response.RedirectUrl);
     });
  }
        }
        });
            },
        error: function (result) {
  console.error(result);
   Swal.fire({
      title: 'Failed!',
        text: 'Error has been occurred, Please try again later.',
            icon: 'error'
     });
            },
            complete: function () {
      AmagiLoader.hide();
            }
        });
    });
});
