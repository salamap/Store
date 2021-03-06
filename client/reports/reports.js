/**
 * Created by petersalama on 1/10/15.
 */
if (Meteor.isClient) {
  Session.setDefault('soldCursor', 0); // The group of inventory items currently in view

  Template.reports.events({
    'click .previous': function () {
      if (Number(Session.get('soldCursor')) > 9) {
        Session.set('soldCursor', Number(Session.get('soldCursor')) - 10);
      }
    },

    'click .next': function () {
      const count = Session.get('soldCursor') + SoldCollection.find({}).count();

      Meteor.call('reportHasMore', count, (err, response) => {
        const currProdCursor = Session.get('soldCursor');
        if (response) {
          Session.set('soldCursor', currProdCursor + 10);
        } else if (!response && !err) {
          Session.set('soldCursor', currProdCursor);
        } else {
          bootbox.alert('THERE WAS AN INTERNAL SERVER ERROR.');
        }
      });
    },
  });

  Template.reports.helpers({
    soldProduct() {
      if (SoldCollection.find().count() === 0) return SoldCollection.find({});
      return SoldCollection.find({}, { sort: { SoldOn: -1 } });
    },
  });
}
