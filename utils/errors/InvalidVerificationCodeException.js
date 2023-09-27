module.exports = class InvalidVerificationCodeException extends Error {
  constructor(msg, code) {
    super(msg);
    this.code = code;
  }
};
