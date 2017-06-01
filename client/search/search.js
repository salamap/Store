/**
 * Created by peter.salama on 5/1/15.
 */
if (Meteor.isClient) {
  Template.search.helpers({
    indexes() {
      return ['Product', 'Sold'];
    },
  });
}
