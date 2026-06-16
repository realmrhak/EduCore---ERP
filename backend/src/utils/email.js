const sendEmail = async (options) => {
  console.log(`[EMAIL MOCK] Sending email to ${options.email} with subject: ${options.subject}`);
  return true;
};

module.exports = { sendEmail };
