/**
 * Created by petersalama on 1/6/15.
 */
if (Meteor.isServer) {
  Meteor.publish('Product', (prodCursor) => {
    const viewLimit = 10;
    return ProductCollection.find({}, { limit: viewLimit, skip: prodCursor });
  });

  Meteor.publish('Sold', (soldCursor) => {
    const viewLimit = 10;
    return SoldCollection.find({}, { limit: viewLimit, skip: soldCursor });
  });

  Meteor.publish('User', () => Meteor.users.find());

  Meteor.methods({
    addToInventory(desc, category, price, barcode) {
      const user = Meteor.user();
      if (!user) {
        throw new Meteor.Error(401, 'You need to login!');
      } else {
        ProductCollection.insert({
          Description: desc,
          Category: category,
          Price: accounting.formatMoney(price),
          BarCode: barcode,
          createdAt: new Date(),
          SalePrice: '',
          SoldOn: '',
          ReceiptCode: '',
        });
      }
    },

    deleteFromInventory(prodId) {
      const user = Meteor.user();
      if (!user || user.role !== 'admin') {
        throw new Meteor.Error(401, 'You do not have the appropriate privileges!');
      } else {
        ProductCollection.remove(prodId);
      }
    },

    getFromInventory(query) {
      const user = Meteor.user();
      if (!user) {
        throw new Meteor.Error(401, 'You need to login!');
      } else {
        return ProductCollection.find({ BarCode: query }).fetch();
      }
    },

    inventoryHasMore(count) {
      return count < ProductCollection.find({}).count();
    },

    reportHasMore(count) {
      return count < SoldCollection.find({}).count();
    },

    updateSold(cart, originalPrices, purchaseTotal) {
      const user = Meteor.user();
      if (!user) {
        throw new Meteor.Error(401, 'You need to login!');
      } else {
        const transactionDate = new Date();
        const receiptCode = Date.now().toString().slice(-10);
        const itemsArray = [];
        for (let i = 0; i < cart.length; i++) {
          if (SoldCollection.findOne({ _id: cart[i]._id })) {
            throw new Meteor.Error('invalid-codes', 'ERROR: PRODUCT HAS BEEN PREVIOUSLY SOLD.');
          } else {
            cart[i].SoldOn = transactionDate;
            cart[i].SalePrice = cart[i].Price;
            cart[i].Price = originalPrices[cart[i]._id.toString()];
            cart[i].ReceiptCode = receiptCode;

            SoldCollection.insert(cart[i]);
            ProductCollection.remove(cart[i]._id);
            itemsArray.push(cart[i]);
          }
        }

        PurchaseReceiptCollection.insert({
          BarCode: receiptCode,
          PurchaseItems: itemsArray,
          Total: purchaseTotal,
          createdAt: transactionDate,
        });

        return PurchaseReceiptCollection.findOne({ BarCode: receiptCode });
      }
    },

    doExchange(arrayA, arrayB) {
      const user = Meteor.user();
      if (!user) {
        throw new Meteor.Error(401, 'You need to login!');
      }

      const length = arrayA.length;
      const returnArray = [];
      const purchaseArray = [];

      for (let i = 0; i < length; i++) {
        // find which product is to be returned and which one is to be purchased
        const purchaseA = ProductCollection.findOne({ BarCode: arrayA[i] });
        const returnB = SoldCollection.findOne({ BarCode: arrayB[i] });
        const purchaseB = ProductCollection.findOne({ BarCode: arrayB[i] });
        const returnA = SoldCollection.findOne({ BarCode: arrayA[i] });

        if (returnA && purchaseB) {
          purchaseArray.push(purchaseB);
          returnArray.push(returnA);
        } else if (returnB && purchaseA) {
          purchaseArray.push(purchaseA);
          returnArray.push(returnB);
        } else if (purchaseA && purchaseB) {
          throw new Meteor.Error('invalid-codes', 'ERROR: PLEASE PROVIDE A BAR CODE FOR A SOLD ITEM.');
        } else if (returnA && returnB) {
          throw new Meteor.Error('invalid-codes', 'ERROR: PLEASE PROVIDE A BAR CODE FOR A NON-PURCHASED ITEM.');
        } else {
          // if both fail then throw error
          throw new Meteor.Error('invalid-codes', 'THE PROVIDED BAR CODES DO NOT MATCH ANY PRODUCT IN THE SYSTEM.');
        }
      }

      return processExchange(returnArray, purchaseArray);
    },

    doReturn(itemsArray) {
      const user = Meteor.user();
      if (!user) {
        throw new Meteor.Error(401, 'You need to login!');
      }

      const length = itemsArray.length;
      const returnArray = [];
      const receiptCode = Date.now().toString().slice(-10);
      let returnTotal = 0.0;
      const transactionDate = new Date();

      for (let i = 0; i < length; i++) {
        const itemToReturn = SoldCollection.findOne({ BarCode: itemsArray[i] });
        if (itemToReturn) {
          itemToReturn.SoldOn = '';
          itemToReturn.ReceiptCode = '';

          if (ProductCollection.findOne({ _id: itemToReturn._id })) {
            throw new Meteor.Error('invalid-codes', 'ERROR: THE ITEM YOU WISH TO RETURN HAS ALREADY BEEN RETURNED.');
          } else {
            returnTotal += accounting.unformat(itemToReturn.SalePrice);
            ProductCollection.insert(itemToReturn);
            SoldCollection.remove(itemToReturn._id);
            returnArray.push(itemToReturn);
          }
        } else {
          throw new Meteor.Error('invalid-codes', 'THE PROVIDED BAR CODES DO NOT MATCH ANY PRODUCT IN THE SYSTEM.');
        }
      }

      ReturnReceiptCollection.insert({
        BarCode: receiptCode,
        ReturnItems: returnArray,
        Total: accounting.formatMoney(returnTotal),
        createdAt: transactionDate,
      });

      return ReturnReceiptCollection.findOne({ BarCode: receiptCode });
    },

    getReceiptByCode(code) {
      code = code || '';
      let r = ExchangeReceiptCollection.findOne({ BarCode: code.toString() });
      if (r) return { type: 'Exchange', receipt: r };
      r = PurchaseReceiptCollection.findOne({ BarCode: code.toString() });
      if (r) return { type: 'Purchase', receipt: r };
      r = ReturnReceiptCollection.findOne({ BarCode: code.toString() });
      if (r) return { type: 'Return', receipt: r };
      throw new Meteor.Error('invalid-codes', 'ERROR: INVALID BAR CODE');
    },
  });

  // The product the customer returns and the product the customer purchases
  function processExchange(returnArray, purchaseArray) {
    const receiptCode = Date.now().toString().slice(-10);
    const transactionDate = new Date();
    const length = returnArray.length;
    let purchaseTotal = 0.0;
    let returnTotal = 0.0;

    for (let i = 0; i < length; i++) {
      // remove purchased item from product collection and add to sold collection
      if (SoldCollection.findOne({ _id: purchaseArray[i]._id })) {
        throw new Meteor.Error('invalid-codes', 'ERROR: THE ITEM YOU WISH TO PURCHASE HAS ALREADY BEEN SOLD.');
      } else {
        // update the properties of the item the customer is purchasing
        purchaseArray[i].SoldOn = transactionDate;
        purchaseArray[i].SalePrice = purchaseArray[i].Price;
        purchaseTotal += accounting.unformat(purchaseArray[i].SalePrice);
        purchaseArray[i].ReceiptCode = receiptCode;
        ProductCollection.remove(purchaseArray[i]._id);
        SoldCollection.insert(purchaseArray[i]);
      }

      // remove returned item from sold collection and add to product collection
      if (ProductCollection.findOne({ _id: returnArray[i]._id })) {
        throw new Meteor.Error('invalid-codes', 'ERROR: THE ITEM YOU WISH TO RETURN HAS ALREADY BEEN RETURNED.');
      } else {
        // update the properties of the item the customer is returning.
        // do not overwrite sale price so we can show it on the receipt
        returnArray[i].SoldOn = '';
        returnArray[i].ReceiptCode = '';
        returnTotal += accounting.unformat(returnArray[i].SalePrice);
        ProductCollection.insert(returnArray[i]);
        SoldCollection.remove(returnArray[i]._id);
      }
    }

    // add purchased and returned to the receipt document
    ExchangeReceiptCollection.insert({
      BarCode: receiptCode,
      PurchaseItems: purchaseArray,
      ReturnedItems: returnArray,
      Total: accounting.formatMoney(purchaseTotal - returnTotal),
      createdAt: transactionDate,
    });

    return ExchangeReceiptCollection.findOne({ BarCode: receiptCode });
  }
}
