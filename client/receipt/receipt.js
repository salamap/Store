/**
 * Created by peter.salama on 4/25/15.
 */
if (Meteor.isClient) {
  Template.purchaseReceipt.helpers({
    receiptCode: function () {
      return Session.get("receipt").BarCode;
    },

    barCode: function () {
      return '*'+Session.get("receipt").BarCode+'*';
    },

    receiptDate: function () {
      return Session.get("receipt").createdAt;
    },

    purchaseItems: function () {
      return Session.get("receipt").PurchaseItems;
    },

    receiptTotal: function () {
      return Session.get("receipt").Total;
    }
  });


  Template.exchangeReceipt.helpers({
    receiptCode: function () {
      return Session.get("receipt").BarCode;
    },

    barCode: function () {
        return '*'+Session.get("receipt").BarCode+'*';
    },

    receiptDate: function () {
      return Session.get("receipt").createdAt;
    },

    purchaseItems: function () {
      return Session.get("receipt").PurchaseItems;
    },

    returnItems: function () {
      return Session.get("receipt").ReturnedItems;
    },

    receiptTotal: function () {
      return Session.get("receipt").Total;
    }
  });


  Template.returnReceipt.helpers({
    receiptCode: function () {
      return Session.get("receipt").BarCode;
    },

    barCode: function () {
        return '*'+Session.get("receipt").BarCode+'*';
    },

    receiptDate: function () {
      return Session.get("receipt").createdAt;
    },

    returnItems: function () {
      return Session.get("receipt").ReturnItems;
    },

    receiptTotal: function () {
      return Session.get("receipt").Total;
    }
  });
}