/**
 * Created by petersalama on 4/7/15.
 */
if (Meteor.isClient) {
  Session.set("rowCount", 1);
  var arrayA   = [],
      arrayB   = [];

      Template.exchange.events({
        "click #addToTransaction": function(event) {
            event.preventDefault();
            processInput();
        },

        "click #deleteFromTransaction": function (event) {
            event.preventDefault();
            if (Session.get("rowCount") > 1) {
              if (Session.get("rowCount") > arrayA.length) {
                rewindDOM();
              }
              else if (Session.get("rowCount") === arrayA.length) {
                if (arrayA.length > 0 && arrayB.length > 0) {
                  arrayA.pop();
                  arrayB.pop();
                }
                rewindDOM();
              }
            }
        },

        "click .exchange": function(event) {
            event.preventDefault();

            var $itemA = $("#"+Session.get("rowCount")+"_1"),
                $itemB = $("#"+Session.get("rowCount")+"_2");

            if (isValid($itemA.val(), $itemB.val())) {
                arrayA.push($itemA.val());
                arrayB.push($itemB.val());
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
                                Meteor.call('doExchange', arrayA, arrayB, function (err, response) {
                                    if (err && err.error === "invalid-codes") {
                                        bootbox.alert(err.reason);
                                    }
                                    else if (err && err.error != "invalid-codes") {
                                        bootbox.alert(err.error);
                                    }
                                    else if (!err && response) {
                                        Session.set("receipt", response);
                                        bootbox.dialog ({
                                            title: "EXCHANGE RECEIPT",
                                            message: renderTemplate(Template.exchangeReceipt),
                                            buttons: {
                                                confirm: {
                                                    label:"PRINT",
                                                    className: "btn-default",
                                                    callback: function () {
                                                        window.print();
                                                    }
                                                }
                                            }
                                        });
                                    }
                                });
                                Session.set("rowCount", 1);
                                arrayA = [];
                                arrayB = [];
                                resetDOM();
                            }
                        }
                    }
                });
            }
        }
    });

  function processInput() {
    var $itemA = $("#"+Session.get("rowCount")+"_1"),
        $itemB = $("#"+Session.get("rowCount")+"_2");

    if (isValid($itemA.val(), $itemB.val())) {
      arrayA.push($itemA.val());
      arrayB.push($itemB.val());
      updateDOM();
    }
  }

  function isValid(itemA, itemB) {
    if (itemA.length === 0 || itemB.length === 0) {
      bootbox.alert("ERROR: THERE ARE MISSING BAR CODES");
      return false;
    }
    else if (isNaN(itemA) || isNaN(itemB)) {
      bootbox.alert("ERROR: INVALID BAR CODES");
      return false;
    }
    else if (itemA.length != 9 || itemB.length != 9) {
      bootbox.alert("ERROR: INVALID BAR CODES");
      return false;
    }
    else if (itemA.toLowerCase() === itemB.toLowerCase()) {
      bootbox.alert("ERROR: DUPLICATE BAR CODES ARE NOT ALLOWED");
      return false;
    }
    else if (Session.get("rowCount") > 1 && (_.contains(arrayA, itemA) || _.contains(arrayA, itemB))) {
      bootbox.alert("ERROR: DUPLICATE BAR CODES ARE NOT ALLOWED");
      return false;
    }
    else if (Session.get("rowCount") > 1 && (_.contains(arrayB, itemA) || _.contains(arrayB, itemB))) {
      bootbox.alert("ERROR: DUPLICATE BAR CODES ARE NOT ALLOWED");
      return false;
    }
    return true;
  }

  function updateDOM() {
    Session.set("rowCount", Session.get("rowCount") + 1);

    var firstId    = Session.get("rowCount")+"_1",
        secondId   = Session.get("rowCount")+"_2",
        newFormGrp = Session.get("rowCount")+"-exchange-form-group",
        $addBtn    = $("#addToTransaction"),
        $minusBtn  = $("#deleteFromTransaction"),
        $formGrp   = $(".exchange-form-group"),
        newElems   = '<div class="'+newFormGrp+'"><div class="form-group"><input type="text" class="form-control" id='+firstId + ' placeholder="Bar Code"></div> <div class="form-group"><input type="text" class="form-control" id='+secondId + ' placeholder="Bar Code"></div> <button class="btn btn-default" id="addToTransaction"> <span class="glyphicon glyphicon-plus"></span></button> <button class="btn btn-default" id="deleteFromTransaction"> <span class="glyphicon glyphicon-minus"></span> </button>';

    $addBtn.remove();
    $minusBtn.remove();
    $formGrp.append(newElems);
  }

  function rewindDOM() {
    var $addBtn     = $("#addToTransaction"),
        $minusBtn   = $("#deleteFromTransaction"),
        $formGrp    = $(".exchange-form-group"),
        deleteElem  = Session.get("rowCount")+"-exchange-form-group";

    Session.set("rowCount", Session.get("rowCount") - 1);
    $addBtn.remove();
    $minusBtn.remove();
    $('.'+deleteElem).remove();

    if (Session.get("rowCount") > 1) {
      $('.'+Session.get("rowCount")+"-exchange-form-group").append('<button class="btn btn-default" id="addToTransaction"> <span class="glyphicon glyphicon-plus"></span></button> <button class="btn btn-default" id="deleteFromTransaction"> <span class="glyphicon glyphicon-minus"></span> </button>');
    }
    else {
      $formGrp.append('<button class="btn btn-default" id="addToTransaction"> <span class="glyphicon glyphicon-plus"></span></button> <button class="btn btn-default" id="deleteFromTransaction"> <span class="glyphicon glyphicon-minus"></span> </button>');
    }
  }

  function resetDOM() {
    var $inlineForm  = $(".form-inline"),
        origFormGrp = '<form class="form-inline"> <div class="exchange-form-group"> <div class="form-group"> <input type="text" class="form-control" id="1_1" placeholder="Bar Code"> </div> <div class="form-group"> <input type="text" class="form-control" id="1_2" placeholder="Bar Code"> </div> <button class="btn btn-default" id="addToTransaction"> <span class="glyphicon glyphicon-plus"></span> </button> <button class="btn btn-default" id="deleteFromTransaction"> <span class="glyphicon glyphicon-minus"></span> </button> </div> <div class="form-group"> <button type="submit" class="btn btn-primary exchange">Exchange</button> </div> </form>';
    $inlineForm.remove();
    $("#exchangeForm").append(origFormGrp);
  }
}
