/**
 * Created by petersalama on 4/7/15.
 */
if (Meteor.isClient) {
  Session.set('rowCount', 1);
  let arrayA = [];
  let arrayB = [];

  Template.exchange.events({
    'click #addToTransaction': function (event) {
      event.preventDefault();
      processInput();
    },

    'click #deleteFromTransaction': function (event) {
      event.preventDefault();
      if (Session.get('rowCount') > 1) {
        if (Session.get('rowCount') > arrayA.length) {
          rewindDOM();
        } else if (Session.get('rowCount') === arrayA.length) {
          if (arrayA.length > 0 && arrayB.length > 0) {
            arrayA.pop();
            arrayB.pop();
          }

          rewindDOM();
        }
      } else if (Session.get('rowCount') === 1 && arrayA.length > 0 && arrayB.length > 0) {
        arrayA.pop();
        arrayB.pop();

        const $itemA = $(`#${Session.get('rowCount')}_1`);
        const $itemB = $(`#${Session.get('rowCount')}_2`);

        $itemA.val('');
        $itemB.val('');
      }
    },

    'click .exchange': function (event) {
      event.preventDefault();

      let exchangeIsReady = false;

      if (Session.get('rowCount') > arrayA.length) {
        const $itemA = $(`#${Session.get('rowCount')}_1`);
        const $itemB = $(`#${Session.get('rowCount')}_2`);

        if (isValid($itemA.val(), $itemB.val())) {
          arrayA.push($itemA.val());
          arrayB.push($itemB.val());

          exchangeIsReady = isValidUpdate();
        }
      } else if (Session.get('rowCount') === arrayA.length) {
        exchangeIsReady = isValidUpdate();
      }

      if (exchangeIsReady) {
        bootbox.dialog({
          title: 'EXCHANGE',
          message: 'CONFIRM TO CONTINUE WITH THIS EXCHANGE.',
          buttons: {
            cancel: {
              label: 'CANCEL',
              className: 'btn-default',
              callback() {
                Session.set('rowCount', 1);
                arrayA = [];
                arrayB = [];
                resetDOM();
              },
            },
            confirm: {
              label: 'CONFIRM',
              className: 'btn-success',
              callback() {
                Meteor.call('doExchange', arrayA, arrayB, (err, response) => {
                  if (err && err.error === 'invalid-codes') {
                    bootbox.alert(err.reason);
                  } else if (err && err.error !== 'invalid-codes') {
                    bootbox.alert(err.error);
                  } else if (!err && response) {
                    Session.set('receipt', response);
                    bootbox.dialog({
                      title: 'EXCHANGE RECEIPT',
                      message: renderTemplate(Template.exchangeReceipt),
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
                arrayA = [];
                arrayB = [];
                resetDOM();
              },
            },
          },
        });
      }
    },
  });

  var processInput = function () {
    if (arrayA.length !== 0 && arrayA.length === Session.get('rowCount')) {
      updateDOM();
    } else {
      const $itemA = $(`#${Session.get('rowCount')}_1`);
      const $itemB = $(`#${Session.get('rowCount')}_2`);

      if (isValid($itemA.val(), $itemB.val())) {
        arrayA.push($itemA.val());
        arrayB.push($itemB.val());
        updateDOM();
      }
    }
  };

  var isValidUpdate = function () {
    for (let i = 0; i < arrayA.length; i++) {
      const $checkItemA = $(`#${1 + i}_1`);
      const $checkItemB = $(`#${1 + i}_2`);

      if ($checkItemA.val() !== arrayA[i]) {
        if (isValidEdit($checkItemA.val(), $checkItemB.val())) {
          arrayA[i] = $checkItemA.val();
          arrayB[i] = $checkItemB.val();
        } else {
          return false;
        }
      } else if ($checkItemB.val() !== arrayB[i]) {
        if (isValidEdit($checkItemB.val(), $checkItemA.val())) {
          arrayA[i] = $checkItemA.val();
          arrayB[i] = $checkItemB.val();
        } else {
          return false;
        }
      }
    }

    return true;
  };

  var isValidEdit = function (editedItem, siblingItem) {
    if (editedItem.length === 0) {
      bootbox.alert('ERROR: THERE ARE MISSING BAR CODES');
      return false;
    } else if (isNaN(editedItem)) {
      bootbox.alert('ERROR: BAR CODE FORMAT IS INVALID');
      return false;
    } else if (editedItem.length !== 9) {
      bootbox.alert('ERROR: BAR CODE FORMAT IS INVALID');
      return false;
    } else if (editedItem.toLowerCase() === siblingItem.toLowerCase()) {
      bootbox.alert('ERROR: DUPLICATE BAR CODES ARE NOT ALLOWED');
      return false;
    } else if (Session.get('rowCount') > 1 && (_.contains(arrayA, editedItem) || _.contains(arrayB, editedItem))) {
      bootbox.alert('ERROR: DUPLICATE BAR CODES ARE NOT ALLOWED');
      return false;
    }

    return true;
  };

  var isValid = function (itemA, itemB) {
    if (itemA.length === 0 || itemB.length === 0) {
      bootbox.alert('ERROR: THERE ARE MISSING BAR CODES');
      return false;
    } else if (isNaN(itemA) || isNaN(itemB)) {
      bootbox.alert('ERROR: BAR CODE FORMAT IS INVALID');
      return false;
    } else if (itemA.length !== 9 || itemB.length !== 9) {
      bootbox.alert('ERROR: BAR CODE FORMAT IS INVALID');
      return false;
    } else if (itemA.toLowerCase() === itemB.toLowerCase()) {
      bootbox.alert('ERROR: DUPLICATE BAR CODES ARE NOT ALLOWED');
      return false;
    } else if (Session.get('rowCount') > 1 && (_.contains(arrayA, itemA) || _.contains(arrayA, itemB))) {
      bootbox.alert('ERROR: DUPLICATE BAR CODES ARE NOT ALLOWED');
      return false;
    } else if (Session.get('rowCount') > 1 && (_.contains(arrayB, itemA) || _.contains(arrayB, itemB))) {
      bootbox.alert('ERROR: DUPLICATE BAR CODES ARE NOT ALLOWED');
      return false;
    }

    return true;
  };

  var updateDOM = function () {
    Session.set('rowCount', Session.get('rowCount') + 1);

    const firstId = `${Session.get('rowCount')}_1`;
    const secondId = `${Session.get('rowCount')}_2`;
    const newFormGrp = `${Session.get('rowCount')}-exchange-form-group`;
    const $addBtn = $('#addToTransaction');
    const $minusBtn = $('#deleteFromTransaction');
    const $formGrp = $('.exchange-form-group');
    const newElems = `<div class="${newFormGrp}"><div class="form-group"><input type="text" class="form-control" id=${firstId} placeholder="Bar Code"></div> <div class="form-group"><input type="text" class="form-control" id=${secondId} placeholder="Bar Code"></div> <button class="btn btn-default" id="addToTransaction"> <span class="glyphicon glyphicon-plus"></span></button> <button class="btn btn-default" id="deleteFromTransaction"> <span class="glyphicon glyphicon-minus"></span> </button>`;

    $addBtn.remove();
    $minusBtn.remove();
    $formGrp.append(newElems);
  };

  var rewindDOM = function () {
    const $addBtn = $('#addToTransaction');
    const $minusBtn = $('#deleteFromTransaction');
    const $formGrp = $('.exchange-form-group');
    const deleteElem = `${Session.get('rowCount')}-exchange-form-group`;

    Session.set('rowCount', Session.get('rowCount') - 1);
    $addBtn.remove();
    $minusBtn.remove();
    $(`.${deleteElem}`).remove();

    if (Session.get('rowCount') > 1) {
      $(`.${Session.get('rowCount')}-exchange-form-group`).append('<button class="btn btn-default" id="addToTransaction"> <span class="glyphicon glyphicon-plus"></span></button> <button class="btn btn-default" id="deleteFromTransaction"> <span class="glyphicon glyphicon-minus"></span> </button>');
    } else {
      $formGrp.append('<button class="btn btn-default" id="addToTransaction"> <span class="glyphicon glyphicon-plus"></span></button> <button class="btn btn-default" id="deleteFromTransaction"> <span class="glyphicon glyphicon-minus"></span> </button>');
    }
  };

  var resetDOM = function () {
    const $inlineForm = $('.form-inline');
    const origFormGrp = '<form class="form-inline"> <div class="exchange-form-group"> <div class="form-group"> <input type="text" class="form-control" id="1_1" placeholder="Bar Code"> </div> <div class="form-group"> <input type="text" class="form-control" id="1_2" placeholder="Bar Code"> </div> <button class="btn btn-default" id="addToTransaction"> <span class="glyphicon glyphicon-plus"></span> </button> <button class="btn btn-default" id="deleteFromTransaction"> <span class="glyphicon glyphicon-minus"></span> </button> </div> <div class="form-group"> <button type="submit" class="btn btn-primary exchange">Exchange</button> </div> </form>';
    $inlineForm.remove();
    $('#exchangeForm').append(origFormGrp);
  };
}
