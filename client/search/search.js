/**
 * Created by peter.salama on 5/1/15.
 */
if (Meteor.isClient) {
  Template.search.helpers({
    indexes() {
      return ['Product', 'Sold', 'PurchaseReceipts', 'ExchangeReceipts', 'ReturnReceipts'];
    },
  });

  Template.search.events({
    'click #code': function (event) {
      event.preventDefault();
      const code = $(event.currentTarget).text() || '';
      Meteor.call('getReceiptByCode', code, (err, response) => {
        if (err) {
          bootbox.alert(err.error);
        } else if (response) {
          let receiptTemplate = {};
          let title = '';
          if (response.type === 'Exchange') {
            title = 'EXCHANGE RECEIPT';
            receiptTemplate = Template.exchangeReceipt;
          } else if (response.type === 'Purchase') {
            title = 'PURCHASE RECEIPT';
            receiptTemplate = Template.purchaseReceipt;
          } else if (response.type === 'Return') {
            title = 'RETURN RECEIPT';
            receiptTemplate = Template.returnReceipt;
          }
          Session.set('receipt', response.receipt);
          bootbox.dialog({
            title,
            message: renderTemplate(receiptTemplate),
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
    },
  });
}
