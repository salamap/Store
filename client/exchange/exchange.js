/**
 * Created by petersalama on 4/7/15.
 */
if (Meteor.isClient) {
    Template.exchange.events({
        "click .exchange": function(event) {
            event.preventDefault();

            var $itemA = $("#searchOne");
            var $itemB = $("#searchTwo");

            if ($itemA.val().length === 0 || $itemB.val().length === 0) {
                bootbox.alert("PLEASE ENTER BAR CODES");
            }
            else if (isNaN($itemA.val()) || isNaN($itemB.val())) {
                bootbox.alert("PLEASE ENTER VALID BAR CODES");
            }
            else if ($itemA.val().length != 9 || $itemB.val().length != 9) {
                bootbox.alert("PLEASE ENTER VALID BAR CODES");
            }
            else if ($itemA.val() === $itemB.val()) {
                bootbox.alert("BAR CODES CANNOT BE THE SAME");
            }
            else {
                bootbox.dialog({
                    title: "EXCHANGE",
                    message: "CONFIRM TO CONTINUE WITH THIS EXCHANGE.",
                    buttons: {
                        cancel: {
                            label:"CANCEL",
                            className: "btn-default"
                        },
                        confirm: {
                            label: "CONFIRM",
                            className: "btn-success",
                            callback: function () {
                                Meteor.call('doExchange', $itemA.val(), $itemB.val(), function (err, response) {
                                    if (err && err.error === "invalid-codes") {
                                        bootbox.alert(err.reason);
                                    }
                                    else if (err && err.error != "invalid-codes") {
                                        bootbox.alert(err.error);
                                    }
                                    else if (!err && response) {
                                        bootbox.dialog ({
                                            title: "RECEIPT",
                                            message: "Exchanged " + response.giveBack + " with " + response.takeWith,
                                            buttons: {
                                                confirm: {
                                                    label:"DONE",
                                                    className: "btn-success"
                                                }
                                            }
                                        });
                                        $itemA.val("");
                                        $itemB.val("");
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