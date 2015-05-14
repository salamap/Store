/**
 * Created by petersalama on 1/4/15.
 */
Router.configure({
  layoutTemplate: 'layout',
  loadingTemplate: 'loading'
});

Router.map(function() {
  this.route('settings', {
    path: '/settings',
    waitOn: function() {
      return Meteor.subscribe('User');
    }
  });

  this.route('inventory', {
    path: '/inventory',
    waitOn: function() {
      return [Meteor.subscribe('Product', Session.get('prodCursor')), Meteor.subscribe('User')];
    }
  });

  this.route('cart', {
    path: '/cart',
    waitOn: function() {
      return Meteor.subscribe('User');
    }
  });

  this.route('exchange', {
    path: '/exchange',
    waitOn: function() {
      return Meteor.subscribe('User');
    }
  });

  this.route('return', {
    path: '/return',
    waitOn: function() {
      return Meteor.subscribe('User');
    }
  });

  this.route('search', {
    path: '/search',
    waitOn: function() {
      return Meteor.subscribe('User');
    }
  });

  this.route('reports', {
    path:'/reports',
    waitOn: function() {
      return [Meteor.subscribe('Sold', Session.get('soldCursor')), Meteor.subscribe('User')];
    }
  });

  this.route('/', function() {
    this.redirect('/cart');
  });
});

var requireLogin = function() {
  if (!Meteor.userId()) {
    if (Meteor.loggingIn()) {
      this.render(this.loadingTemplate);
    }
    else {
      this.render('accessDenied');
    }
  }
  else {
    this.next();
  }
};

var requireAdmin = function() {
  var userID = Meteor.userId();
  var user = Meteor.users.findOne({_id:userID});
  if (!Meteor.userId()) {
    if (Meteor.loggingIn()) {
      this.render(this.loadingTemplate);
    }
    else {
      this.render('accessDenied');
    }
  }
  else {
    if (user.role !== 'admin') {
      this.render('adminOnly');
    }
    else {
      this.next();
    }
  }
};

Router.onBeforeAction(requireLogin, {only: ['cart', 'inventory', 'reports', 'settings', 'return', 'exchange', 'search']});
Router.onBeforeAction(requireAdmin, {only: ['inventory', 'reports', 'settings']});