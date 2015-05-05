/**
 * Created by peter.salama on 4/16/15.
 */
if (Meteor.isClient) {
  Session.set("rowCount", 1);
  var returnArray = [];

  Template.return.rendered = function() {
    this.$("#search_"+Session.get("rowCount")).focus();
  };

  Template.return.events({
    "click #addToTransaction": function(event) {
      event.preventDefault();
      processReturnInput();
    },

    "click #deleteFromTransaction": function (event) {
      event.preventDefault();
      if (Session.get("rowCount") > 1) {
        if (Session.get("rowCount") > returnArray.length) {
          rewindReturnDOM();
        }
        else if (Session.get("rowCount") === returnArray.length) {
          if (returnArray.length > 0) {
            returnArray.pop();
          }
          rewindReturnDOM();
        }
      }
    },

    "click .return": function(event) {
      event.preventDefault();

      var $item = $("#search_"+Session.get("rowCount"));

      if (isValidReturn($item.val())) {
        returnArray.push($item.val());

        bootbox.dialog({
          title: "RETURN",
          message: "CONFIRM TO CONTINUE WITH THIS RETURN.",
          buttons: {
            cancel: {
              label:"CANCEL",
              className: "btn-default",
              callback: function () {
                Session.set("rowCount", 1);
                returnArray = [];
                resetReturnDOM();
              }
            },
            confirm: {
              label: "CONFIRM",
              className: "btn-success",
              callback: function () {
                Meteor.call('doReturn', returnArray, function (err, response) {
                  if (err && err.error === "invalid-codes") {
                    bootbox.alert(err.reason);
                  }
                  else if (err && err.error != "invalid-codes") {
                    bootbox.alert(err.error);
                  }
                  else if (!err && response) {
                    Session.set("receipt", response);
                    bootbox.dialog ({
                      title: "RETURN RECEIPT",
                      message: renderTemplate(Template.returnReceipt),
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
                returnArray = [];
                resetReturnDOM();
              }
            }
          }
        });
      }
    }
  });

  var processReturnInput = function() {
    var $item = $("#search_"+Session.get("rowCount"));

    if (isValidReturn($item.val())) {
      returnArray.push($item.val());
      updateReturnDOM();
    }
  };

  var isValidReturn = function(item) {
    if (item.length === 0) {
      bootbox.alert("ERROR: THERE ARE MISSING BAR CODES");
      return false;
    }
    else if (isNaN(item)) {
      bootbox.alert("ERROR: INVALID BAR CODES");
      return false;
    }
    else if (item.length != 9) {
      bootbox.alert("ERROR: INVALID BAR CODES");
      return false;
    }
    else if (Session.get("rowCount") > 1 && (_.contains(returnArray, item))) {
      bootbox.alert("ERROR: DUPLICATE BAR CODES ARE NOT ALLOWED");
      return false;
    }
    return true;
  };

  var updateReturnDOM = function() {
    Session.set("rowCount", Session.get("rowCount") + 1);

    var searchId   = "search_"+Session.get("rowCount"),
        newFormGrp = Session.get("rowCount")+"-return-form-group",
        $addBtn    = $("#addToTransaction"),
        $minusBtn  = $("#deleteFromTransaction"),
        $formGrp   = $(".return-form-group"),
        newElems   = '<div class="'+newFormGrp+'"><div class="form-group"><input type="text" class="form-control" id='+searchId + ' placeholder="Bar Code"></div> <button class="btn btn-default" id="addToTransaction"> <span class="glyphicon glyphicon-plus"></span></button> <button class="btn btn-default" id="deleteFromTransaction"> <span class="glyphicon glyphicon-minus"></span> </button>';

    $addBtn.remove();
    $minusBtn.remove();
    $formGrp.append(newElems);
  };

  var rewindReturnDOM = function() {
    var $addBtn     = $("#addToTransaction"),
        $minusBtn   = $("#deleteFromTransaction"),
        $formGrp    = $(".return-form-group"),
        deleteElem  = Session.get("rowCount")+"-return-form-group";

    Session.set("rowCount", Session.get("rowCount") - 1);
    $addBtn.remove();
    $minusBtn.remove();
    $('.'+deleteElem).remove();

    if (Session.get("rowCount") > 1) {
      $('.'+Session.get("rowCount")+"-return-form-group").append('<button class="btn btn-default" id="addToTransaction"> <span class="glyphicon glyphicon-plus"></span></button> <button class="btn btn-default" id="deleteFromTransaction"> <span class="glyphicon glyphicon-minus"></span> </button>');
    }
    else {
      $formGrp.append('<button class="btn btn-default" id="addToTransaction"> <span class="glyphicon glyphicon-plus"></span></button> <button class="btn btn-default" id="deleteFromTransaction"> <span class="glyphicon glyphicon-minus"></span> </button>');
    }
  };

  var resetReturnDOM = function() {
    var $inlineForm  = $(".form-inline"),
        origFormGrp = '<form class="form-inline"> <div class="return-form-group"> <div class="form-group"> <input type="text" class="form-control" id="search_1" placeholder="Bar Code"> </div> <button class="btn btn-default" id="addToTransaction"> <span class="glyphicon glyphicon-plus"></span> </button> <button class="btn btn-default" id="deleteFromTransaction"> <span class="glyphicon glyphicon-minus"></span> </button> </div> <div class="form-group"> <button type="submit" class="btn btn-primary exchange">Exchange</button> </div> </form>';
    $inlineForm.remove();
    $("#returnForm").append(origFormGrp);
  };
}