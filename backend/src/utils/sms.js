const sendSMS = async (to, message) => {
  console.log(`[SMS MOCK] Sending SMS to ${to}: ${message}`);
  return true;
};

module.exports = { sendSMS };
