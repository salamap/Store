/**
 * Created by petersalama on 12/30/14.
 */
if (Meteor.isClient) {
  Session.setDefault('prodCursor', 0); // The group of inventory items currently in view

  Template.addInventory.events({
    'submit form': function (event) {
      event.preventDefault();
      const category = Session.get('prodCategory');
      const $desc = $('#prodDesc');
      const $price = $('#prodPrice');

      if ((typeof category === 'undefined' || category === 'Category') && isEmpty($desc) && (isEmpty($price) || !isValidPrice($price))) {
        animateThis($('#prodCat'));
        animateThis($desc);
        animateThis($price);
      } else if (typeof category === 'undefined' || category === 'Category') {
        animateThis($('#prodCat'));
      } else if (isEmpty($desc)) {
        animateThis($desc);
      } else if (isEmpty($price) || !isValidPrice($price)) {
        animateThis($price);
      } else {
        const code = Date.now().toString().slice(-9);
        Meteor.call('addToInventory', $desc.val().trim(), category, $price.val().trim(), code, (err, response) => {
          if (err) {
            bootbox.alert(err.reason);
          }

          $desc.val('');
          $price.val('');
          $('#prodCat').html('Category <span class="caret"></span>');
        });

        // $("#barCodeImage").barcode({code: code, crc: false},
        // "std25", {barWidth: 1, barHeight: 80, output: "svg"});
      }
    },

    'click .dropdown-menu li a': function (event) {
      event.preventDefault();
      const target = $(event.currentTarget);
      const selText = target.text();
      Session.set('prodCategory', selText);
      $('#prodCat').html(`${selText} <span class="caret"></span>`);
    },
  });

  Template.viewInventory.events({
    'click .delete': function () {
      const _this = this;
      bootbox.dialog({
        message: 'YOU ARE ABOUT TO DELETE PRODUCT FROM THE DATABASE',
        title: 'CAUTION!',
        buttons: {
          button1: {
            label: 'CANCEL',
            className: 'btn-default',
          },
          button2: {
            label: 'CONFIRM',
            className: 'btn-primary',
            callback() {
              Meteor.call('deleteFromInventory', _this._id, (err, response) => {
                if (err) {
                  bootbox.alert(err.reason);
                }
              });

              // if the barcode is still up clear it out when removing an item from the inventory
              // $('#barCodeImage').empty();
            },
          },
        },
      });
    },

    'click .previous': function (event, template) {
      if (Number(Session.get('prodCursor')) > 9) {
        Session.set('prodCursor', Number(Session.get('prodCursor')) - 10);
      }
    },

    'click .next': function (event, template) {
      const count = Session.get('prodCursor') + ProductCollection.find({}).count();

      // This is costly because we are making a call to the server
      Meteor.call('inventoryHasMore', count, (err, response) => {
        const currProdCursor = Session.get('prodCursor');
        if (response) {
          Session.set('prodCursor', currProdCursor + 10);
        } else if (!response && !err) {
          Session.set('prodCursor', currProdCursor);
        } else {
          bootbox.alert('THERE WAS AN INTERNAL SERVER ERROR.');
        }
      });
    },

    'click #showLabels': function () {
      bootbox.dialog({
        title: 'BarCodes',
        message: renderTemplate(Template.showLabelModal),
        buttons: {
          success: {
            label: 'Print',
            className: 'btn-default',
            callback() {
              window.print();
            },
          },
        },
      },
      );
    },
  });

  Template.viewInventory.helpers({
    products() {
      if (ProductCollection.find().count() === 0) return ProductCollection.find({});
      return ProductCollection.find({}, { sort: { createdAt: -1 } });
    },
  });

  Template.showLabelModal.helpers({
    labels() {
      const codes = [];
      ProductCollection.find({}, { sort: { createdAt: -1 } }).fetch().forEach((prod) => {
        codes.push({
          Code: `*${prod.BarCode}*`,
          Raw: prod.BarCode,
        });
      });

      return codes;
    },
  });

  function animateThis($field) {
    $field.effect('highlight', { color: 'red' }, 800);
  }

  function isEmpty($field) {
    return $field.val().length === 0;
  }

  function isValidPrice($price) {
    return $price.val().match(/^\$?([1-9]{1}[0-9]{0,2}(\,[0-9]{3})*(\.[0-9]{0,2})?|[1-9]{1}[0-9]{0,}(\.[0-9]{0,2})?|0(\.[0-9]{0,2})?|(\.[0-9]{1,2})?)$/);
  }
}
