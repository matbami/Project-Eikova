const jwt = require('jsonwebtoken');
const moment = require('moment');
const httpStatus = require('http-status');
const config = require('../config/config');
const userService = require('./user.service');
const { Token } = require('../models');
const ApiError = require('../utils/ApiError');
const { tokenTypes } = require('../config/tokens');
const { ROLE } = require('../config/roles');

/**
 * Generate token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {string} [secret]
 * @returns {string}
 */
const generateToken = (userId, username, email, role,expires, type, secret = config.jwt.secret) => {

  const payload = {
    name: username,
     email,
    role,
     sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, secret);
};


/**
 * Save a token
 * @param {string} token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<Token>}
 */
const saveToken = async (token, userId, expires, type, blacklisted = false) => {
  const tokenDoc = await Token.create({
    token,
    user: userId,
    expires: expires.toDate(),
    type,
    blacklisted,
  });
  return tokenDoc;
};



/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<Token>}
 */
const verifyToken = async (token, type) => {
  const payload = jwt.verify(token, config.jwt.secret);
  const tokenDoc = await Token.findOne({ token, type, user: payload.sub, blacklisted: false });
  if (!tokenDoc) {
    throw new Error('Token not found');
  }
  return tokenDoc;
};

// const verifyUserToken = async (token, type) => {
//   const payload = jwt.verify(token, config.jwt.secret);
//   const tokenDoc = await Token.findOne({ token, type, user: payload.sub, blacklisted: false });
//   if (!tokenDoc) {
//     throw new Error('Token not found');
//   }
//   return tokenDoc;
// };


// const revokeUserInvitationTokens = async (user) => {
//   await Token.deleteMany({ user: user.id, type: tokenTypes.USER_INVITATION });
//   return true;
// };
const updateTokenById = async (tokenId, updateBody) => {
  const token = await Token.findById(tokenId);
  if (!token) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Token not found');
  }
  // if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
  //   throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  // }
  Object.assign(token, updateBody);
  await token.save();
  return token;
};

const generateUserInvitationToken = async (user) => {
    const expires = moment().add(config.jwt.userInvitationExpirationMinutes, 'minutes');
    const userInvitationToken = generateToken(user.id,user.username, user.email, user.role, expires, tokenTypes.USER_INVITATION);
    await saveToken(userInvitationToken, user.id, expires, tokenTypes.USER_INVITATION);
    console.log(userInvitationToken,"UserIvitaionToken")
    return {userInvitationToken};


};


/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Promise<Object>}
 */
const generateAuthTokens = async (user) => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(user.id,user.username, user.email, user.role, accessTokenExpires, tokenTypes.ACCESS);

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  const refreshToken = generateToken(user.id, user.username, user.email, user.role,refreshTokenExpires, tokenTypes.REFRESH);
  await saveToken(refreshToken, user.id, refreshTokenExpires, tokenTypes.REFRESH);

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
const generateResetPasswordToken = async (email) => {
  const user = await userService.getUserByEmail(email);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No users found with this email');
  }
  const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
  const resetPasswordToken = generateToken(user.id,user.username, user.email, user.role, expires, tokenTypes.RESET_PASSWORD);
  await saveToken(resetPasswordToken, user.id, expires, tokenTypes.RESET_PASSWORD);
  return resetPasswordToken;
};

/**
 * Generate verify email token
 * @param {User} user
 * @returns {Promise<string>}
 */
const generateVerifyEmailToken = async (user) => {
  const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
  const verifyEmailToken = generateToken(user.id,user.username, user.email, user.role, expires, tokenTypes.VERIFY_EMAIL);
  await saveToken(verifyEmailToken, user.id, expires, tokenTypes.VERIFY_EMAIL);
  return verifyEmailToken;
};

const generateSignUpToken = async (user) => {
  const expires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const signUpToken = generateToken(user.id, user.username, user.email, user.role, expires, tokenTypes.ACCESS);
  await saveToken(signUpToken, user.id, expires, tokenTypes.ACCESS);
  return signUpToken;
};

const generateOneTimeToken = async (user) => {
  const expires = moment().add(config.jwt.oneTimeTokenExpirationMinutes, 'minutes');
  const oneTimeToken = generateToken(user.id, user.username, user.email, user.role, expires, tokenTypes.ACCESS);
  await saveToken(oneTimeToken, user.id, expires, tokenTypes.ACCESS);
  return oneTimeToken;
};

module.exports = {
  generateToken,
  saveToken,
  verifyToken,
  generateAuthTokens,
  generateResetPasswordToken,
  generateVerifyEmailToken,
  generateUserInvitationToken,
  generateSignUpToken,
  generateOneTimeToken,
  updateTokenById
};
