const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  }

  const { name, email, subject, message } = JSON.parse(event.body);

  const response = await fetch('https://api.mailersend.com/v1/email', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.MAILERSEND_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: {
        email: 'no-reply@berriesandmango.com',
        name: 'Rodney Parker Portfolio'
      },
      to: [
        {
          email: 'rodney@berriesandmango.com',
          name: 'Rodney Parker'
        }
      ],
      subject,
      text: `New message from your portfolio:\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`
    })
  });

  if (!response.ok) {
    const error = await response.text();
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'MailerSend error', error }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Email sent successfully' }),
  };
};
