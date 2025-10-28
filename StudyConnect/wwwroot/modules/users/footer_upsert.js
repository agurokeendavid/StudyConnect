$(function () {
    const formEl = $('#form');
    
    // Initialize DevExtreme TextBox for Last Name
    $("#last_name").dxTextBox({
        placeholder: "Last Name",
        value: $("#lastname-hidden").val(),
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
        value: $("#firstname-hidden").val(),
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
      value: $("#middlename-hidden").val(),
        inputAttr: {
    'aria-label': 'Middle Name'
        },
        onValueChanged: function(e) {
     $("#middlename-hidden").val(e.value);
        }
    });

    // Initialize DevExtreme SelectBox for Gender
    $("#gender").dxSelectBox({
        dataSource: [
       { id: "Male", name: "Male" },
    { id: "Female", name: "Female" },
          { id: "Other", name: "Other" }
      ],
        displayExpr: "name",
  valueExpr: "id",
        value: $("#sex-hidden").val(),
    placeholder: "Select Gender",
        searchEnabled: true,
        validationMessageMode: "always",
        onValueChanged: function(e) {
     $("#sex-hidden").val(e.value);
        }
    }).dxValidator({
        validationRules: [{
   type: "required",
   message: "Gender is required"
      }]
    });

    // Initialize DevExtreme DateBox for Date of Birth
    $("#dob").dxDateBox({
        placeholder: "Date of Birth",
        value: $("#dob-hidden").val() ? new Date($("#dob-hidden").val()) : null,
   type: "date",
     displayFormat: "dd/MM/yyyy",
        max: new Date(),
        validationMessageMode: "always",
onValueChanged: function(e) {
        if (e.value) {
          var date = new Date(e.value);
       var formattedDate = date.getFullYear() + '-' + 
       String(date.getMonth() + 1).padStart(2, '0') + '-' + 
      String(date.getDate()).padStart(2, '0');
       $("#dob-hidden").val(formattedDate);
    } else {
      $("#dob-hidden").val("");
            }
  }
 }).dxValidator({
  validationRules: [{
    type: "required",
    message: "Date of Birth is required"
        }]
    });

    // Initialize DevExtreme TextBox for Contact No
    $("#contact_no").dxTextBox({
     placeholder: "Contact No.",
 value: $("#contactno-hidden").val(),
        mask: "+63 (000) 000-0000",
 maskRules: { "0": /[0-9]/ },
        inputAttr: {
     'aria-label': 'Contact No.'
        },
        validationMessageMode: "always",
  onValueChanged: function(e) {
     $("#contactno-hidden").val(e.value);
        }
    }).dxValidator({
    validationRules: [{
    type: "required",
            message: "Contact No. is required"
    }]
    });

    // Initialize DevExtreme TextBox for Address
    $("#address").dxTextBox({
        placeholder: "Address",
        value: $("#address-hidden").val(),
        inputAttr: {
        'aria-label': 'Address'
        },
        validationMessageMode: "always",
        onValueChanged: function(e) {
      $("#address-hidden").val(e.value);
        }
    }).dxValidator({
        validationRules: [{
         type: "required",
            message: "Address is required"
        }]
    });

    // Initialize DevExtreme SelectBox for Role
    $("#role_id").dxSelectBox({
        dataSource: [
  { id: "Admin", name: "Admin" },
            { id: "Student", name: "Student" }
        ],
        displayExpr: "name",
        valueExpr: "id",
  value: $("#roleid-hidden").val(),
        placeholder: "Select Role",
        searchEnabled: true,
validationMessageMode: "always",
        onValueChanged: function(e) {
    $("#roleid-hidden").val(e.value);
    }
    }).dxValidator({
        validationRules: [{
type: "required",
      message: "Role is required"
   }]
    });

    // Initialize Email and Password fields only if not in edit mode
    if (!isEditMode) {
     // Initialize DevExtreme TextBox for Email Address
      $("#username").dxTextBox({
     placeholder: "Email Address",
            mode: "email",
            value: $("#email-hidden").val(),
     inputAttr: {
      'aria-label': 'Email Address'
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
            }, {
 type: "stringLength",
           min: 6,
        message: "Password must be at least 6 characters"
            }]
     });
    }

  // Initialize DevExtreme Button for Save
    $("#btn-save").dxButton({
        text: "Save",
   icon: "ti ti-device-floppy",
        type: "success",
        stylingMode: "contained",
        useSubmitBehavior: false,
        elementAttr: {
            class: "btn-success rounded-pill px-4"
 },
   onClick: function(e) {
  // Get values from DevExtreme controls
            var lastName = $("#last_name").dxTextBox("instance").option("value");
            var firstName = $("#first_name").dxTextBox("instance").option("value");
    var middleName = $("#middle_name").dxTextBox("instance").option("value");
  var gender = $("#gender").dxSelectBox("instance").option("value");
        var dob = $("#dob").dxDateBox("instance").option("value");
    var contactNo = $("#contact_no").dxTextBox("instance").option("value");
    var address = $("#address").dxTextBox("instance").option("value");
     var roleId = $("#role_id").dxSelectBox("instance").option("value");

            // Update hidden fields
            $("#lastname-hidden").val(lastName);
            $("#firstname-hidden").val(firstName);
    $("#middlename-hidden").val(middleName);
       $("#sex-hidden").val(gender);
            $("#contactno-hidden").val(contactNo);
     $("#address-hidden").val(address);
         $("#roleid-hidden").val(roleId);

    if (dob) {
 var date = new Date(dob);
         var formattedDate = date.getFullYear() + '-' + 
   String(date.getMonth() + 1).padStart(2, '0') + '-' + 
            String(date.getDate()).padStart(2, '0');
                $("#dob-hidden").val(formattedDate);
       }

    if (!isEditMode) {
         var email = $("#username").dxTextBox("instance").option("value");
             var password = $("#password").dxTextBox("instance").option("value");
             $("#email-hidden").val(email);
    $("#password-hidden").val(password);
            }

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
            return false;
        }
        
        $.ajax({
url: '/Users/Upsert',
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
  title: isEditMode ? 'Update Successful!' : 'User Created!',
       text: response.Message,
      icon: 'success',
        confirmButtonColor: '#28a745',
   timer: 2000,
               timerProgressBar: true
         }).then(() => {
   location.replace(response.RedirectUrl || '/Users/Index');
            });
             }
         }
    });
},
         error: function (result) {
         console.error(result);
 Swal.fire({
  title: 'Failed!',
         text: 'Error has occurred. Please try again later.',
    icon: 'error'
 });
 },
    complete: function () {
       AmagiLoader.hide();
            }
        });
    });
});
