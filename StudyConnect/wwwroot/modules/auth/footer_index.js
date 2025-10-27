$(function () {
    const formEl = $('#form');
    // Initialize DevExtreme TextBox for Email Address
    $("#username").dxTextBox({
        placeholder: "Email Address",
        mode: "email",
        value: "administrator@studyconnect.ph",
        stylingMode: "outlined",
        inputAttr: {
            'aria-label': 'Email Address',
            'aria-describedby': 'emailHelp'
        },
        validationMessageMode: "always",
        onValueChanged: function(e) {
            // Update the hidden input or handle the value
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
        value: "Qwerty123!",
        stylingMode: "outlined",
        inputAttr: {
            'aria-label': 'Password'
        },
        validationMessageMode: "always",
        onValueChanged: function(e) {
            // Update the hidden input or handle the value
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

    // Initialize DevExtreme CheckBox for Remember Device
    $("#flexCheckChecked").dxCheckBox({
        text: "Remember this Device",
        value: true,
        elementAttr: {
            class: "remember-device-checkbox"
        }
    });

    // Initialize DevExtreme Button for Sign In
    $("#btn-signin").dxButton({
        text: "Sign In",
        type: "default",
        stylingMode: "contained",
        width: "100%",
        height: 45,
        useSubmitBehavior: false,
        elementAttr: {
            class: "dx-button-primary"
        },
        onClick: function(e) {
            // Validate the form
            var emailValidation = $("#username").dxTextBox("instance").option("isValid");
            var passwordValidation = $("#password").dxTextBox("instance").option("isValid");

            if (emailValidation && passwordValidation) {
                // Get values from DevExtreme controls
                var email = $("#username").dxTextBox("instance").option("value");
                var password = $("#password").dxTextBox("instance").option("value");
                var rememberMe = $("#flexCheckChecked").dxCheckBox("instance").option("value");

                // Update hidden fields
                $("#email-hidden").val(email);
                $("#password-hidden").val(password);
                $("#remember-hidden").val(rememberMe);

                // Trigger form validation and submit
                var result = validationGroup.validate();
                if (result.isValid) {
                    // Submit via AJAX
                    formEl.trigger('submit');
                }
            } else {
                e.event.preventDefault();
            }
        }
    });

    // Initialize DevExtreme ValidationGroup
    var validationGroup = $("#form").dxValidationGroup({

    }).dxValidationGroup("instance");

    formEl.on('submit', function (e) {
        e.preventDefault();
        
        var result = validationGroup.validate();
        if (!result.isValid) {
            e.preventDefault();
            return false;
        }
        $.ajax({
            url: `Auth/Index`,
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
                                title: 'Login Successful!',
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

