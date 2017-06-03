/**
 * Created by petersalama on 1/4/15.
 */
Router.configure({
  layoutTemplate: 'layout',
  loadingTemplate: 'loading',
});

Router.map(function () {
  this.route('settings', {
    path: '/settings',
    waitOn() {
      return Meteor.subscribe('User');
    },
  });

  this.route('inventory', {
    path: '/inventory',
    waitOn() {
      return [Meteor.subscribe('Product', Session.get('prodCursor')), Meteor.subscribe('User')];
    },
  });

  this.route('cart', {
    path: '/cart',
    waitOn() {
      return Meteor.subscribe('User');
    },
  });

  this.route('exchange', {
    path: '/exchange',
    waitOn() {
      return Meteor.subscribe('User');
    },
  });

  this.route('return', {
    path: '/return',
    waitOn() {
      return Meteor.subscribe('User');
    },
  });

  this.route('search', {
    path: '/search',
    waitOn() {
      return Meteor.subscribe('User');
    },
  });

  this.route('reports', {
    path: '/reports',
    waitOn() {
      return [Meteor.subscribe('Sold', Session.get('soldCursor')), Meteor.subscribe('User')];
    },
  });

  this.route('/', function () {
    this.redirect('/cart');
  });
});

const requireLogin = function () {
  if (!Meteor.userId()) {
    if (Meteor.loggingIn()) {
      this.render(this.loadingTemplate);
    } else {
      this.render('accessDenied');
    }
  } else {
    this.next();
  }
};

const requireAdmin = function () {
  const userID = Meteor.userId();
  const user = Meteor.users.findOne({ _id: userID });
  if (!Meteor.userId()) {
    if (Meteor.loggingIn()) {
      this.render(this.loadingTemplate);
    } else {
      this.render('accessDenied');
    }
  } else if (user.role !== 'admin') {
    this.render('adminOnly');
  } else {
    this.next();
  }
};

Router.onBeforeAction(requireLogin, { only: ['cart', 'inventory', 'reports', 'settings', 'return', 'exchange', 'search'] });
Router.onBeforeAction(requireAdmin, { only: ['inventory', 'reports', 'settings'] });
