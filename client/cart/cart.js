/**
 * Created by petersalama on 12/31/14.
 */
if (Meteor.isClient) {
    var cart = new Mongo.Collection(null);
    var originalPrices = {};
    var total = 0.00;
    Session.set("cartTotal", total);

    Template.cart.rendered = function() {
        this.$("#search").focus();
    };

    Template.cart.events({
        "submit form": function(event) {
            event.preventDefault();
            Meteor.call('getFromInventory', $("#search").val(), function(err, response) {
                if (response) {
                    var product = response;
                    if (product.length === 1) {
                        var isDuplicate = (cart.find({_id: product[0]._id}).fetch()).length >= 1;

                        if (!isDuplicate) {
                            cart.insert(product[0]);
                            originalPrices[(product[0]._id).toString()] = product[0].Price;
                            total += (accounting.unformat(product[0].Price));
                            Session.set("cartTotal",total)
                        }
                        else {
                            bootbox.alert("ITEM ALREADY IN THE CART.");
                        }
                    }
                    else if (product.length > 1) {
                        bootbox.alert("THAT IS AN INVALID BARCODE, MORE THAN ONE ITEM HAS THAT BARCODE.");
                    }
                    else {
                        bootbox.alert("THAT IS AN INVALID BARCODE, NO ITEM HAS THAT BARCODE.");
                    }
                }
                else if (err) {
                    bootbox.alert("THERE WAS AN INTERNAL SERVER ERROR.");
                }
                $("#search").val("");
            });
        },

        "click .delete": function() {
            cart.remove(this._id);
            if (total > 0.00) {
                total -= (accounting.unformat(this.Price));
                Session.set("cartTotal", total);
            }
        },

        "keyup #discount": function(event) {
            event.preventDefault();
            var target = $(event.currentTarget);
            var discount = target.val();
            if (!isNaN(discount) && discount >= 0 && discount <= 100) {
                var newPrice = ((100 - discount) / 100) * accounting.unformat(originalPrices[this._id.toString()]);
                cart.update({_id: this._id},{$set:{Price: accounting.formatMoney(newPrice), Description: this.Description}});
                total = 0.00;
                cart.find({}).forEach(function(item) {
                    total += accounting.unformat(item.Price);
                });
                Session.set("cartTotal",total)
            }
        },

        "click .checkout": function() {
            if (cart.find({}).count() > 0 && total > 0.00) {
                bootbox.dialog({
                    title: "CHECKOUT",
                    message: "CONFIRM PURCHASE TOTAL: " + accounting.formatMoney(Session.get("cartTotal")),
                    buttons: {
                        cancel: {
                            label:"CANCEL",
                            className: "btn-default"
                        },
                        confirm: {
                            label: "CONFIRM",
                            className: "btn-success",
                            callback: function () {
                                Meteor.call('updateSold', cart.find({}).fetch(), originalPrices, accounting.formatMoney(Session.get("cartTotal")), function(err, response) {
                                    if (response) {
                                        bootbox.dialog ({
                                            title: "RECEIPT",
                                            message: JSON.stringify(response),
                                            buttons: {
                                                cancel: {
                                                    label:"CANCEL",
                                                    className: "btn-default"
                                                }
                                            }
                                        });
                                    }
                                    else {
                                        bootbox.alert("AN ERROR OCCURRED WHILE PROCESSING THE PURCHASE.");
                                    }
                                    cart.remove({});
                                    total = 0.00;
                                    Session.set("cartTotal",total);
                                    originalPrices = {};
                                });
                            }
                        }
                    }
                });
            }
            else {
                bootbox.alert("CART IS EMPTY.");
            }
        }
    });

    Template.cart.helpers({
        cartItem: function() {
            return cart.find({}, {sort: {createdAt: 1}});
        },

        Total: function() {
            return accounting.formatMoney(Session.get("cartTotal"));
        }
    });
}