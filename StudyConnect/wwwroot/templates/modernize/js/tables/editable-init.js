$("#mainTable")
    .editableTableWidget()
    .numericInputExample()
    .find("td:first")
    .focus();
$("#editable-datatable")
    .editableTableWidget()
    .numericInputExample()
    .find("td:first")
    .focus();
$(function () {
    $("#editable-datatable").DataTable();
});