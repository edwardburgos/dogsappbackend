const crypto = require('crypto');
const jsonwebtoken = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const moment = require('moment');


const pathToKey = path.join(__dirname, '.', 'id_rsa_priv.pem');
const PRIV_KEY = fs.readFileSync(pathToKey, 'utf8');

/**
 * -------------- HELPER FUNCTIONS ----------------
 */

/**
 * 
 * @param {*} password - The plain text password
 * @param {*} hash - The hash stored in the database
 * @param {*} salt - The salt stored in the database
 * 
 * This function uses the crypto library to decrypt the hash using the salt and then compares
 * the decrypted hash/salt with the password that the user provided at login
 */
function validPassword(password, hash, salt) {
    var hashVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === hashVerify;
}

// This function returns true if the user password is google
function noDefinedPassword(hash, salt) {
  return hash === crypto.pbkdf2Sync('google', salt, 10000, 64, 'sha512').toString('hex') ? true : false;
}

/**
 * 
 * @param {*} password - The password string that the user inputs to the password field in the register form
 * 
 * This function takes a plain text password and creates a salt and hash out of it.  Instead of storing the plaintext
 * password in the database, the salt and hash are stored for security
 * 
 * ALTERNATIVE: It would also be acceptable to just use a hashing algorithm to make a hash of the plain text password.
 * You would then store the hashed password in the database and then re-hash it to verify later (similar to what we do here)
 */
function genPassword(password) {
    var salt = crypto.randomBytes(32).toString('hex');
    var genHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    
    return {
      salt: salt,
      hash: genHash
    };
}


/**
 * @param {*} user - The user object.  We need this to set the JWT `sub` payload property to the MongoDB user ID
 */
function issueJWT(user, useCase) {
  const id = user.id;

  let expiresIn = 30;
  if (['loginWithoutPassword', 'verifyEmail', 'resetPassword', 'deleteAccountEmail', 'definePassword'].includes(useCase)) expiresIn = 4;
  expiresIn = moment().milliseconds(0).add(expiresIn, expiresIn === 30 ? 'days' : 'hours').valueOf()/1000
  
  const payload = {
    sub: id,
    iat: Date.now(),
    exp: expiresIn
  };

  const signedToken = jsonwebtoken.sign(payload, PRIV_KEY, { algorithm: 'RS256' });

  return {
    token: "Bearer " + signedToken,
    expires: expiresIn
  }
}

module.exports.validPassword = validPassword;
module.exports.noDefinedPassword = noDefinedPassword;
module.exports.genPassword = genPassword;
module.exports.issueJWT = issueJWT;