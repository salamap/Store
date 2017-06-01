/**
 * Created by peter.salama on 4/16/15.
 */
if (Meteor.isClient) {
  Session.set('rowCount', 1);
  let returnArray = [];

  Template.return.rendered = function () {
    this.$(`#search_${Session.get('rowCount')}`).focus();
  };

  Template.return.events({
    'click #addToTransaction': function (event) {
      event.preventDefault();
      processReturnInput();
    },

    'click #deleteFromTransaction': function (event) {
      event.preventDefault();
      if (Session.get('rowCount') > 1) {
        if (Session.get('rowCount') > returnArray.length) {
          rewindReturnDOM();
        } else if (Session.get('rowCount') === returnArray.length) {
          if (returnArray.length > 0) {
            returnArray.pop();
          }

          rewindReturnDOM();
        }
      } else if (Session.get('rowCount') === 1 && returnArray.length > 0) {
        returnArray.pop();

        const $item = $(`#search_${Session.get('rowCount')}`);
        $item.val('');
      }
    },

    'click .return': function (event) {
      event.preventDefault();

      let returnIsReady = false;

      if (Session.get('rowCount') > returnArray.length) {
        const $item = $(`#search_${Session.get('rowCount')}`);

        if (isValidReturn($item.val())) {
          returnArray.push($item.val());

          returnIsReady = isValidReturnUpdate();
        }
      } else if (Session.get('rowCount') === returnArray.length) {
        returnIsReady = isValidReturnUpdate();
      }

      if (returnIsReady) {
        bootbox.dialog({
          title: 'RETURN',
          message: 'CONFIRM TO CONTINUE WITH THIS RETURN.',
          buttons: {
            cancel: {
              label: 'CANCEL',
              className: 'btn-default',
              callback() {
                Session.set('rowCount', 1);
                returnArray = [];
                resetReturnDOM();
              },
            },
            confirm: {
              label: 'CONFIRM',
              className: 'btn-success',
              callback() {
                Meteor.call('doReturn', returnArray, (err, response) => {
                  if (err && err.error === 'invalid-codes') {
                    bootbox.alert(err.reason);
                  } else if (err && err.error != 'invalid-codes') {
                    bootbox.alert(err.error);
                  } else if (!err && response) {
                    Session.set('receipt', response);
                    bootbox.dialog({
                      title: 'RETURN RECEIPT',
                      message: renderTemplate(Template.returnReceipt),
                      buttons: {
                        confirm: {
                          label: 'PRINT',
                          className: 'btn-default',
                          callback() {
                            window.print();
                          },
                        },
                      },
                    });
                  }
                });

                Session.set('rowCount', 1);
                returnArray = [];
                resetReturnDOM();
              },
            },
          },
        });
      }
    },
  });

  var processReturnInput = function () {
    if (returnArray.length != 0 && returnArray.length === Session.get('rowCount')) {
      updateReturnDOM();
    } else {
      const $item = $(`#search_${Session.get('rowCount')}`);

      if (isValidReturn($item.val())) {
        returnArray.push($item.val());
        updateReturnDOM();
      }
    }
  };

  var isValidReturnUpdate = function () {
    for (let i = 0; i < returnArray.length; i++) {
      const $checkItem = $(`#search_${1 + i}`);

      if ($checkItem.val() !== returnArray[i]) {
        if (isValidReturn($checkItem.val())) {
          returnArray[i] = $checkItem.val();
        } else {
          return false;
        }
      }
    }

    return true;
  };

  var isValidReturn = function (item) {
    if (item.length === 0) {
      bootbox.alert('ERROR: THERE ARE MISSING BAR CODES');
      return false;
    } else if (isNaN(item)) {
      bootbox.alert('ERROR: BAR CODE FORMAT IS INVALID');
      return false;
    } else if (item.length != 9) {
      bootbox.alert('ERROR: BAR CODE FORMAT IS INVALID');
      return false;
    } else if (Session.get('rowCount') > 1 && (_.contains(returnArray, item))) {
      bootbox.alert('ERROR: DUPLICATE BAR CODES ARE NOT ALLOWED');
      return false;
    }

    return true;
  };

  var updateReturnDOM = function () {
    Session.set('rowCount', Session.get('rowCount') + 1);

    const searchId = `search_${Session.get('rowCount')}`;
    const newFormGrp = `${Session.get('rowCount')}-return-form-group`;
    const $addBtn = $('#addToTransaction');
    const $minusBtn = $('#deleteFromTransaction');
    const $formGrp = $('.return-form-group');
    const newElems = `<div class="${newFormGrp}"><div class="form-group"><input type="text" class="form-control" id=${searchId} placeholder="Bar Code"></div> <button class="btn btn-default" id="addToTransaction"> <span class="glyphicon glyphicon-plus"></span></button> <button class="btn btn-default" id="deleteFromTransaction"> <span class="glyphicon glyphicon-minus"></span> </button>`;

    $addBtn.remove();
    $minusBtn.remove();
    $formGrp.append(newElems);
  };

  var rewindReturnDOM = function () {
    const $addBtn = $('#addToTransaction');
    const $minusBtn = $('#deleteFromTransaction');
    const $formGrp = $('.return-form-group');
    const deleteElem = `${Session.get('rowCount')}-return-form-group`;

    Session.set('rowCount', Session.get('rowCount') - 1);
    $addBtn.remove();
    $minusBtn.remove();
    $(`.${deleteElem}`).remove();

    if (Session.get('rowCount') > 1) {
      $(`.${Session.get('rowCount')}return-form-group`).append('<button class="btn btn-default" id="addToTransaction"> <span class="glyphicon glyphicon-plus"></span></button> <button class="btn btn-default" id="deleteFromTransaction"> <span class="glyphicon glyphicon-minus"></span> </button>');
    } else {
      $formGrp.append('<button class="btn btn-default" id="addToTransaction"> <span class="glyphicon glyphicon-plus"></span></button> <button class="btn btn-default" id="deleteFromTransaction"> <span class="glyphicon glyphicon-minus"></span> </button>');
    }
  };

  var resetReturnDOM = function () {
    const $inlineForm = $('.form-inline');
    const origFormGrp = '<form class="form-inline"> <div class="return-form-group"> <div class="form-group"> <input type="text" class="form-control" id="search_1" placeholder="Bar Code"> </div> <button class="btn btn-default" id="addToTransaction"> <span class="glyphicon glyphicon-plus"></span> </button> <button class="btn btn-default" id="deleteFromTransaction"> <span class="glyphicon glyphicon-minus"></span> </button> </div> <div class="form-group"> <button type="submit" class="btn btn-primary exchange">Exchange</button> </div> </form>';
    $inlineForm.remove();
    $('#returnForm').append(origFormGrp);
  };
}
