/**
 * Created by petersalama on 12/31/14.
 */
if (Meteor.isClient) {
  const cart = new Mongo.Collection(null);
  let originalPrices = {};
  let total = 0.00;
  Session.set('cartTotal', total);

  Template.cart.rendered = function () {
    this.$('#search').focus();
  };

  Template.cart.events({
    'submit form': function (event) {
      event.preventDefault();
      Meteor.call('getFromInventory', $('#search').val(), (err, response) => {
        if (response) {
          const product = response;
          if (product.length === 1) {
            const isDuplicate = (cart.find({ _id: product[0]._id }).fetch()).length >= 1;
            if (!isDuplicate) {
              cart.insert(product[0]);
              originalPrices[(product[0]._id).toString()] = product[0].Price;
              total += (accounting.unformat(product[0].Price));
              Session.set('cartTotal', total);
            } else {
              bootbox.alert('ITEM IS ALREADY IN THE CART.');
            }
          } else if (product.length > 1) {
            bootbox.alert('THAT IS AN INVALID BARCODE, MORE THAN ONE ITEM HAS THAT BARCODE.');
          } else {
            bootbox.alert('THAT IS AN INVALID BARCODE, NO ITEM HAS THAT BARCODE.');
          }
        } else if (err) {
          bootbox.alert('THERE WAS AN INTERNAL SERVER ERROR.');
        }

        $('#search').val('');
      });
    },

    'click .delete': function () {
      cart.remove(this._id);
      if (total > 0.00) {
        total -= (accounting.unformat(this.Price));
        Session.set('cartTotal', total);
      }
    },

    'keyup #discount': function (event) {
      event.preventDefault();
      const target = $(event.currentTarget);
      const discount = target.val();
      if (!isNaN(discount) && discount >= 0 && discount <= 100) {
        const newPrice = ((100 - discount) / 100) * accounting.unformat(originalPrices[this._id.toString()]);
        cart.update({ _id: this._id }, { $set: { Price: accounting.formatMoney(newPrice), Description: this.Description } });
        total = 0.00;
        cart.find({}).forEach((item) => {
          total += accounting.unformat(item.Price);
        });

        Session.set('cartTotal', total);
      }
    },

    'click .checkout': function () {
      if (cart.find({}).count() > 0 && total > 0.00) {
        bootbox.dialog({
          title: 'CHECKOUT',
          message: `CONFIRM PURCHASE TOTAL: ${accounting.formatMoney(Session.get('cartTotal'))}`,
          buttons: {
            cancel: {
              label: 'CANCEL',
              className: 'btn-default',
            },
            confirm: {
              label: 'CONFIRM',
              className: 'btn-success',
              callback() {
                Meteor.call('updateSold', cart.find({}).fetch(), originalPrices, accounting.formatMoney(Session.get('cartTotal')), (err, response) => {
                  if (!err && response) {
                    Session.set('receipt', response);
                    bootbox.dialog({
                      title: 'PURCHASE RECEIPT',
                      message: renderTemplate(Template.purchaseReceipt),
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
                  } else if (err && err.error != 'invalid-codes') {
                    bootbox.alert(err.error);
                  } else if (err && err.error === 'invalid-codes') {
                    bootbox.alert(err.reason);
                  }

                  cart.remove({});
                  total = 0.00;
                  Session.set('cartTotal', total);
                  originalPrices = {};
                });
              },
            },
          },
        });
      } else {
        bootbox.alert('CART IS EMPTY.');
      }
    },
  });

  Template.cart.helpers({
    cartItem() {
      return cart.find({}, { sort: { createdAt: 1 } });
    },

    Total() {
      return accounting.formatMoney(Session.get('cartTotal'));
    },
  });
}
