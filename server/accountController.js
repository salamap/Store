/**
 * Created by petersalama on 1/19/15.
 */
Accounts.onCreateUser(function(options, user) {
  user.role = '';

  // We still want the default hook's 'profile' behavior.
  if (options.profile)
    user.profile = options.profile;
  return user;
});