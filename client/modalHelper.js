/**
 * Created by peter.salama on 4/25/15.
 */
if (Meteor.isClient) {
  renderTemplate = function (template, data) {
    const node = document.createElement('div');
    document.body.appendChild(node);
    Blaze.renderWithData(template, data, node);
    return node;
  };
}
