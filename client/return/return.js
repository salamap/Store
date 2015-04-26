/**
 * Created by peter.salama on 4/16/15.
 */
/**
 * Created by petersalama on 4/7/15.
 */
if (Meteor.isClient) {
  Template.return.rendered = function() {
    this.$("#search").focus();
  };

  Template.return.events({
    "click .return": function(event) {
      event.preventDefault();

      var $item = $("#search");

      if ($item.val().length === 0) {
        bootbox.alert("PLEASE ENTER BAR CODES");
      }
      else if (isNaN($item.val())) {
        bootbox.alert("PLEASE ENTER VALID BAR CODES");
      }
      else if ($item.val().length != 9) {
        bootbox.alert("PLEASE ENTER VALID BAR CODES");
      }
      else {
        bootbox.dialog({
          title: "RETURN",
          message: "CONFIRM TO CONTINUE WITH THIS RETURN.",
          buttons: {
            cancel: {
              label:"CANCEL",
              className: "btn-default"
            },
            confirm: {
              label: "CONFIRM",
              className: "btn-success",
              callback: function () {
                Meteor.call('doReturn', $item.val(), function (err, response) {
                  if (err && err.error === "invalid-codes") {
                    bootbox.alert(err.reason);
                  }
                  else if (err && err.error != "invalid-codes") {
                    bootbox.alert(err.error);
                  }
                  else if (!err && response) {
                    Session.set("receipt", response);
                    bootbox.dialog ({
                      title: "RECEIPT",
                      message: renderReceiptTemplate(Template.receipt),
                      buttons: {
                        confirm: {
                          label:"PRINT",
                          className: "btn-default"
                        }
                      }
                    });
                    $item.val("");
                  }
                });
              }
            }
          }
        });
      }
    }
  });
}