/**
 * Created by peter.salama on 4/25/15.
 */
if (Meteor.isClient) {
  Template.receipt.helpers({
    receiptCode: function () {
      return Session.get("receipt").BarCode;
    },

    receiptDate: function () {
      return Session.get("receipt").createdAt;
    },

    purchaseItems: function () {
      return Session.get("receipt").PurchaseItems;
    },

    exchangeItems: function () {
      return Session.get("receipt").ExchangeItems;
    },

    returnItems: function () {
      return Session.get("receipt").ReturnItems;
    },

    receiptTotal: function () {
      return Session.get("receipt").Total;
    },

    hasExchanges: function () {
      return Session.get("receipt").ExchangeItems.length > 0;
    },

    hasReturns: function () {
      return Session.get("receipt").ReturnItems.length > 0;
    }
  });
}