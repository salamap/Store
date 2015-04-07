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
                    Description: desc,
                    Category: category,
                    Price: accounting.formatMoney(price),
                    BarCode: barcode,
                    createdAt: new Date(),
                    SalePrice: "",
                    SoldOn: ""
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
        updateSold: function (cart, originalPrices) {
            var user = Meteor.user();
            if (!user) {
                throw new Meteor.Error(401, "You need to login!");
            }
            else {
                var itemsArray = [];
                for (var i = 0; i < cart.length; i++) {
                    cart[i].SoldOn = new Date();
                    cart[i].SalePrice = cart[i].Price;
                    cart[i].Price = originalPrices[cart[i]._id.toString()];
                    SoldCollection.insert(cart[i]);
                    ProductCollection.remove(cart[i]._id);
                    itemsArray.push(cart[i]);
                }

                ReceiptCollection.insert({
                    BarCode: Date.now().toString().slice(-10),
                    Items: itemsArray,
                    createdAt: new Date()
                });

                return ReceiptCollection.findOne({}, {sort: {$natural: -1}});
            }
        }
    });
}