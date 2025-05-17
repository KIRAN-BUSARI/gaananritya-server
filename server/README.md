# Gaana Nritya Server

Backend server for the Gaana Nritya Academy website.

## Contact Form API

The contact form API allows users to send messages through the website contact form. The API handles form validation and sends emails to both the admin and an acknowledgment to the user.

### API Endpoint

```
POST /api/v1/contact
```

### Request Body

| Field   | Type   | Description                     |
| ------- | ------ | ------------------------------- |
| name    | String | The name of the contact person  |
| email   | String | The email of the contact person |
| subject | String | The subject of the message      |
| message | String | The content of the message      |

### Response

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Your message has been sent successfully!"
}
```

#### Error Response (400 Bad Request)

```json
{
  "success": false,
  "message": "All fields are required"
}
```

Or

```json
{
  "success": false,
  "message": "Invalid email format"
}
```

#### Error Response (500 Internal Server Error)

```json
{
  "success": false,
  "message": "Failed to send message. Please try again later.",
  "error": "Error message details"
}
```

## Email Configuration

The contact form uses Nodemailer to send emails. Configure the following environment variables in your `.env` file:

```
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-email-password
CONTACT_EMAIL_RECIPIENT=admin@gaananritya.com
```

### Alternative: Azure Communication Services

The code also includes commented sections for using Azure Communication Services instead of Nodemailer. To use Azure, uncomment the relevant sections in the controller and set these environment variables:

```
AZURE_COMMUNICATION_SERVICE_CONNECTION_STRING=your-connection-string
AZURE_SENDER_EMAIL=donotreply@your-domain.com
```
