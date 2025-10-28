$(function () {
    const formEl = $('#form');
 var categoriesData = [];

    // Load categories from server
    $.ajax({
  url: '/StudyGroups/GetCategories',
type: 'GET',
    async: false,
        dataType: 'json',
   success: function (response) {
   categoriesData = response;
        },
 error: function () {
            console.error('Failed to load categories');
     categoriesData = [];
 }
    });

  // Initialize DevExtreme TextBox for Group Name
    $("#group_name").dxTextBox({
        placeholder: "Group Name",
  value: $("#name-hidden").val(),
        inputAttr: {
  'aria-label': 'Group Name'
 },
  validationMessageMode: "always",
   onValueChanged: function(e) {
   $("#name-hidden").val(e.value);
 }
    }).dxValidator({
 validationRules: [{
   type: "required",
            message: "Group Name is required"
 }]
    });

    // Initialize DevExtreme SelectBox for Category
    $("#category").dxSelectBox({
        dataSource: categoriesData,
  displayExpr: "name",
   valueExpr: "id",
  value: $("#categoryid-hidden").val() ? parseInt($("#categoryid-hidden").val()) : null,
        placeholder: "Select Category",
   searchEnabled: true,
 validationMessageMode: "always",
  onValueChanged: function(e) {
    $("#categoryid-hidden").val(e.value);
 }
    }).dxValidator({
        validationRules: [{
     type: "required",
    message: "Category is required"
 }]
    });

// Initialize DevExtreme SelectBox for Privacy
    $("#privacy").dxSelectBox({
        dataSource: [
  { id: "Public", name: "Public" },
   { id: "Private", name: "Private" }
 ],
        displayExpr: "name",
  valueExpr: "id",
        value: $("#privacy-hidden").val(),
 placeholder: "Select Privacy",
        searchEnabled: false,
        validationMessageMode: "always",
        onValueChanged: function(e) {
   $("#privacy-hidden").val(e.value);
        }
    }).dxValidator({
        validationRules: [{
   type: "required",
         message: "Privacy is required"
 }]
    });

    // Initialize DevExtreme NumberBox for Maximum Members
    $("#maximum_members").dxNumberBox({
  placeholder: "Maximum Members (optional)",
     value: $("#maximumnumbers-hidden").val() ? parseInt($("#maximumnumbers-hidden").val()) : null,
        min: 1,
        max: 50,
        showSpinButtons: true,
        inputAttr: {
   'aria-label': 'Maximum Members'
    },
        onValueChanged: function(e) {
   $("#maximumnumbers-hidden").val(e.value || "");
        }
    });

    // Initialize DevExtreme TextArea for Description
    $("#description").dxTextArea({
  placeholder: "Enter group description (optional)",
        value: $("#description-hidden").val(),
height: 120,
        inputAttr: {
            'aria-label': 'Description'
 },
        onValueChanged: function(e) {
   $("#description-hidden").val(e.value);
     }
    });

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
      var groupName = $("#group_name").dxTextBox("instance").option("value");
   var categoryId = $("#category").dxSelectBox("instance").option("value");
       var privacy = $("#privacy").dxSelectBox("instance").option("value");
   var maxMembers = $("#maximum_members").dxNumberBox("instance").option("value");
   var description = $("#description").dxTextArea("instance").option("value");

            // Update hidden fields
            $("#name-hidden").val(groupName);
   $("#categoryid-hidden").val(categoryId);
         $("#privacy-hidden").val(privacy);
            $("#maximumnumbers-hidden").val(maxMembers || "");
            $("#description-hidden").val(description);

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
            url: '/StudyGroups/Upsert',
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
     title: isEditMode ? 'Update Successful!' : 'Study Group Created!',
      text: response.Message,
        icon: 'success',
   confirmButtonColor: '#28a745',
           timer: 2000,
 timerProgressBar: true
           }).then(() => {
    location.replace(response.RedirectUrl || '/StudyGroups/Index');
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
