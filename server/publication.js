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
      // find which product is to be given back and which one is to be taken in return
      var takeWithA  = ProductCollection.findOne({BarCode: valA}),
        giveBackB  = SoldCollection.findOne({BarCode: valB}),
        takeWithB  = ProductCollection.findOne({BarCode: valB}),
        giveBackA  = SoldCollection.findOne({BarCode: valA}),
        response   = {};

      if (giveBackA && takeWithB) {
        response.receipt  = exchangeItems(giveBackA, takeWithB);
        response.giveBack = giveBackA;
        response.takeWith = takeWithB;
      }
      else if (giveBackB && takeWithA) {
        response.receipt  = exchangeItems(giveBackB, takeWithA);
        response.giveBack = giveBackB;
        response.takeWith = takeWithA;
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
        //ReceiptCollection.update(
        //  { BarCode: receiptCode },
        //  { $push: {
        //      ReturnItems: {
        //          $each: [itemToReturn]
        //      }
        //    }
        //  }
        //);
      }
      else {
        throw new Meteor.Error("invalid-codes", "THE PROVIDED BAR CODES DO NOT MATCH ANY PRODUCT IN THE SYSTEM.");
      }

      return ReturnReceiptCollection.findOne({BarCode: receiptCode});
    }

  });

  // The product the customer gives back and the product the customer takes in turn
  function exchangeItems (give, take) {
    var receiptCode     = Date.now().toString().slice(-10);
    var transactionDate = new Date();

    // update the properties of the item the customer is taking
    // for now assume exchanges will be one to one, no price difference
    take.SoldOn      = transactionDate;
    take.SalePrice   = take.Price;
    take.ReceiptCode = receiptCode;

    // remove taken product from product collection and add to sold collection
    ProductCollection.remove(take._id);
    SoldCollection.insert(take);

    // update the properties of the item the customer is giving back.
    // do not overwrite SalePrice because we want to know what it sold for
    give.SoldOn      = "";
    give.ReceiptCode = "";

    // remove product given back from sold collection and add to product collection
    ProductCollection.insert(give);
    SoldCollection.remove(give._id);

    // add the given item and the taken item to the exchange array in the receipt document
    ExchangeReceiptCollection.insert({
      BarCode:        receiptCode,
      PurchaseItems:  [take],
      ReturnedItems: [give],
      Total:          accounting.formatMoney(accounting.unformat(take.SalePrice) - accounting.unformat(give.SalePrice)),
      createdAt:      transactionDate
    });
    //ReceiptCollection.update(
    //  { BarCode: receiptCode },
    //  { $push: {
    //      ExchangeItems: {
    //          $each: [take, give]
    //      }
    //    }
    //  }
    //);

    // not necessary for now
    //ReceiptCollection.update(
    //  {
    //      BarCode: receiptCode,
    //      'PurchaseItems._id': give._id
    //  },
    //  { $set: { "PurchaseItems.$" : give } }
    //);

    return ExchangeReceiptCollection.findOne({BarCode: receiptCode});
  }
}