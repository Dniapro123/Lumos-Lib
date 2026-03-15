function serializeUser(user) {

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
    isAdmin: user.isAdmin,
    preferences: user.preferences,
    // No passwordHash included!
  };
}

module.exports = {
  serializeUser,
};
