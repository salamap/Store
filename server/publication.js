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
        updateSold: function (prod) {
            var user = Meteor.user();
            if (!user) {
                throw new Meteor.Error(401, "You need to login!");
            }
            else {
                SoldCollection.insert(prod);
                ProductCollection.remove(prod._id);
            }
        }
    });
}