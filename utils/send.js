const Sib = require("sib-api-v3-sdk");

const client = Sib.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.MAIL_API_KEY;

const tranEmailApi = new Sib.TransactionalEmailsApi();

const sender = {
  email: "manager@inventory-manage.com",
  name: "Manager",
};

exports.varificationMail = async (email, url = "", varifyToken) => {
  const receivers = [
    {
      email,
    },
  ];
  await tranEmailApi.sendTransacEmail({
    sender,
    to: receivers,
    subject: "Confirm Your Email",
    htmlContent: `
            <h2>Thanks for Signing Up to our service</h2>
            <h2>Please varify Your Email</h2>
            <h3>Click this <a href="${url}${
      url.endsWith("/") ? "" : "/"
    }${varifyToken}">link</a> to set a new password.</h3>
          `,
  });
};

exports.confirmationMail = async (email) => {
  const receivers = [
    {
      email,
    },
  ];
  await tranEmailApi.sendTransacEmail({
    sender,
    to: receivers,
    subject: "Email Confirmed",
    htmlContent: `
            <h2>Thanks for Confirming Your Email</h2>
          `,
  });
};

exports.productCreatedConfirmationMail = async (email, prodId) => {
  const receivers = [
    {
      email,
    },
  ];
  await tranEmailApi.sendTransacEmail({
    sender,
    to: receivers,
    subject: "Product Successfully Created",
    htmlContent: `
            <h2>Your Product with ID ${prodId} has successfully created</h2>
          `,
  });
};

exports.orderPlacedConfirmationMail = async (email, orderId) => {
  const receivers = [
    {
      email,
    },
  ];
  await tranEmailApi.sendTransacEmail({
    sender,
    to: receivers,
    subject: "Order Successfully Palced",
    htmlContent: `
            <h2>Your Order with ID ${orderId} has successfully placed</h2>
          `,
  });
};
