/**
 * Created by petersalama on 1/6/15.
 */
if (Meteor.isServer) {
  Meteor.publish('Product', function(prodCursor) {
    var viewLimit = 10;
    return ProductCollection.find({},{limit: viewLimit, skip: prodCursor});
  });
  Meteor.publish('Sold', function(soldCursor) {
    var viewLimit = 10;
    return SoldCollection.find({},{limit: viewLimit, skip: soldCursor});
  });
  Meteor.publish("User", function () {
    return Meteor.users.find();
  });

  Meteor.methods({
    addToInventory: function(desc, category, price, barcode){
      var user = Meteor.user();
      if (!user) {
        throw new Meteor.Error(401, "You need to login!");
      }
      else {
        ProductCollection.insert({
          Description:    desc,
          Category:       category,
          Price:          accounting.formatMoney(price),
          BarCode:        barcode,
          createdAt:      new Date(),
          SalePrice:      "",
          SoldOn:         "",
          ReceiptCode:    ""
        });
      }
    },
    deleteFromInventory: function(prodId) {
      var user = Meteor.user();
      if (!user || user.role !== 'admin') {
        throw new Meteor.Error(401, "You do not have the appropriate privileges!");
      }
      else {
        ProductCollection.remove(prodId);
      }
    },
    getFromInventory: function(query) {
      var user = Meteor.user();
      if (!user) {
        throw new Meteor.Error(401, "You need to login!");
      }
      else {
        return ProductCollection.find({BarCode: query}).fetch();
      }
    },
    inventoryHasMore: function(count) {
      return count < ProductCollection.find({}).count();
    },
    reportHasMore: function(count) {
      return count < SoldCollection.find({}).count();
    },
    updateSold: function (cart, originalPrices, purchaseTotal) {
      var user = Meteor.user();
      if (!user) {
        throw new Meteor.Error(401, "You need to login!");
      }
      else {
        var transactionDate = new Date();
        var receiptCode = Date.now().toString().slice(-10);
        var itemsArray =  [];
        for (var i = 0; i < cart.length; i++) {
          cart[i].SoldOn =        transactionDate;
          cart[i].SalePrice =     cart[i].Price;
          cart[i].Price =         originalPrices[cart[i]._id.toString()];
          cart[i].ReceiptCode =   receiptCode;

          SoldCollection.insert(cart[i]);
          ProductCollection.remove(cart[i]._id);
          itemsArray.push(cart[i]);
        }

        PurchaseReceiptCollection.insert({
          BarCode:        receiptCode,
          PurchaseItems:  itemsArray,
          Total:          purchaseTotal,
          createdAt:      transactionDate
        });

        return PurchaseReceiptCollection.findOne({BarCode: receiptCode});
      }
    },
    doExchange: function (valA, valB) {
      var user = Meteor.user();
      if (!user) {
        throw new Meteor.Error(401, "You need to login!");
      }
      // find which product is to be returned and which one is to be purchased
      var purchaseA  = ProductCollection.findOne({BarCode: valA}),
          returnB  = SoldCollection.findOne({BarCode: valB}),
          purchaseB  = ProductCollection.findOne({BarCode: valB}),
          returnA  = SoldCollection.findOne({BarCode: valA}),
          response   = {};

      if (returnA && purchaseB) {
        response.receipt  = exchangeItems(returnA, purchaseB);
        response.return = returnA;
        response.purchase = purchaseB;
      }
      else if (returnB && purchaseA) {
        response.receipt  = exchangeItems(returnB, purchaseA);
        response.return = returnB;
        response.purchase = purchaseA;
      }
      else {
        // if both fail then throw error
        throw new Meteor.Error("invalid-codes", "THE PROVIDED BAR CODES DO NOT MATCH ANY PRODUCT IN THE SYSTEM.");
      }

      return response;
    },
    doReturn: function (itemCode) {
      var user = Meteor.user();
      if (!user) {
        throw new Meteor.Error(401, "You need to login!");
      }
      var itemToReturn = SoldCollection.findOne({BarCode: itemCode});
      var receiptCode  = Date.now().toString().slice(-10);
      var transactionDate = new Date();

      if (itemToReturn) {
        itemToReturn.SoldOn      = "";
        itemToReturn.ReceiptCode = "";

        ProductCollection.insert(itemToReturn);
        SoldCollection.remove(itemToReturn._id);

        ReturnReceiptCollection.insert({
          BarCode:        receiptCode,
          ReturnItems:    [itemToReturn],
          Total:          itemToReturn.SalePrice,
          createdAt:      transactionDate
        });

        itemToReturn.SalePrice  = "";
      }
      else {
        throw new Meteor.Error("invalid-codes", "THE PROVIDED BAR CODES DO NOT MATCH ANY PRODUCT IN THE SYSTEM.");
      }

      return ReturnReceiptCollection.findOne({BarCode: receiptCode});
    }
  });

  // The product the customer returns and the product the customer purchases
  function exchangeItems (returnItem, purchaseItem) {
    var receiptCode     = Date.now().toString().slice(-10);
    var transactionDate = new Date();

    // update the properties of the item the customer is purchasing
    purchaseItem.SoldOn      = transactionDate;
    purchaseItem.SalePrice   = purchaseItem.Price;
    purchaseItem.ReceiptCode = receiptCode;

    // remove purchased item from product collection and add to sold collection
    ProductCollection.remove(purchaseItem._id);
    SoldCollection.insert(purchaseItem);

    // update the properties of the item the customer is returning.
    // do not overwrite SalePrice because we want to know what it sold for
    returnItem.SoldOn      = "";
    returnItem.ReceiptCode = "";

    // remove returned item from sold collection and add to product collection
    ProductCollection.insert(returnItem);
    SoldCollection.remove(returnItem._id);

    // add purchased item and returned item to the receipt document
    ExchangeReceiptCollection.insert({
      BarCode:        receiptCode,
      PurchaseItems:  [purchaseItem],
      ReturnedItems:  [returnItem],
      Total:          accounting.formatMoney(accounting.unformat(purchaseItem.SalePrice) - accounting.unformat(returnItem.SalePrice)),
      createdAt:      transactionDate
    });

    return ExchangeReceiptCollection.findOne({BarCode: receiptCode});
  }
}