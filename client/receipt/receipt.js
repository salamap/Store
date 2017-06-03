/**
 * Created by peter.salama on 4/25/15.
 */
if (Meteor.isClient) {
  Template.purchaseReceipt.helpers({
    receiptCode() {
      return Session.get('receipt').BarCode;
    },

    barCode() {
      return `*${Session.get('receipt').BarCode}*`;
    },

    receiptDate() {
      return Session.get('receipt').createdAt;
    },

    purchaseItems() {
      return Session.get('receipt').PurchaseItems;
    },

    receiptTotal() {
      return Session.get('receipt').Total;
    },
  });

  Template.exchangeReceipt.helpers({
    receiptCode() {
      return Session.get('receipt').BarCode;
    },

    barCode() {
      return `*${Session.get('receipt').BarCode}*`;
    },

    receiptDate() {
      return Session.get('receipt').createdAt;
    },

    purchaseItems() {
      return Session.get('receipt').PurchaseItems;
    },

    returnItems() {
      return Session.get('receipt').ReturnedItems;
    },

    receiptTotal() {
      return Session.get('receipt').Total;
    },
  });

  Template.returnReceipt.helpers({
    receiptCode() {
      return Session.get('receipt').BarCode;
    },

    barCode() {
      return `*${Session.get('receipt').BarCode}*`;
    },

    receiptDate() {
      return Session.get('receipt').createdAt;
    },

    returnItems() {
      return Session.get('receipt').ReturnItems;
    },

    receiptTotal() {
      return Session.get('receipt').Total;
    },
  });
}
