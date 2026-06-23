# Reference Page Audit — USER template-api

- **URL:** `https://crm.oneoftheprojects.com/user?page=template-api`
- **Page Title:** `whatsCRM`

## 1. Headings
- H5: Template API
- H6: Your API Key
- H6: Send Message
- H6: API Endpoint
- H6: Request Parameters
- H6: Example Response

## 2. Buttons
- Button: **"English"**
- Button: **"Regenerate API Key"**

## 3. Inputs
- Element: `input` | Type: `text` | Placeholder: `Search menu…`
- Element: `input` | Type: `text` | Placeholder: `Search menu…`

## 4. Tables

## 5. Body text
```text
whatsCRM

Dashboard
Inbox
Kabnan
WhatsApp Forms

INSTAGRAM

Link Instagram
NEW
Insta DM Bot
NEW
Insta Comment DM
NEW

WHATSAPP QR PLUGIN

Add WhatsApp by QR
WhatsApp Warmer
Rest API

WA META CONNECT

Link Meta WhatsApp

AUTOMATION & BOTS

Automation Flows
WA Chatbot

BROADCASTING

Create Meta Template
Send Campaign
Campaign Dashboard
Phonebook

AI WHATSAPP CALLING

Create Call Flow
WA Call Logs
Setup WA Calls

META REST API

Conversational API
Template API
API Dashboard

WEBHOOK AUTOMATION

Manage Webhooks
Webhook Automation
Webhook Logs

TELEGRAM PLUGIN

Telegram Sessions

MORE OPTIONS

Web Notificaion
Agent Login
Agent Task
Chat Widget

whatsCRM

5.9.5

template-api

English
JD
Template API

Send pre approved templates by Meta

Your API Key

YOUR_API_KEY_HERE

Regenerate API Key
Send Message
— Send a pre-approved Meta template to any WhatsApp number

Use this endpoint to send a pre-approved Meta template message. Templates must be approved by Meta before use.

1
API Endpoint
POST
https://crm.oneoftheprojects.com/api/v1/send_templet
HTTP
1POST https://crm.oneoftheprojects.com/api/v1/send_templet
2Content-Type: application/json
3Authorization: Bearer API_KEY
4
5{
6  "sendTo": "+1234567890",
7  "templetName": "YourTemplateName",
8  "exampleArr": ["example_key_1", "example_key_2"],
9  "token": "YourAPIToken",
10  "mediaUri": "OptionalMediaUri"
11}
2
Request Parameters
PARAMETER
DESCRIPTION

sendTo

required
string

The recipient's WhatsApp phone number in E.164 format (e.g. +1234567890)

templetName

required
string

The exact name of your approved Meta template

exampleArr

array

Array of variable values to fill template placeholders in order

token

required
string

Your API token for authentication

mediaUri

string

Optional public URL of a media file (image, video, document) for media templates

Example Response
200 OK
JSON
1{
2  "success": true,
3  "metaResponse": {
4    "message_id": "message_id_here",
5    "status": "sent"
6  }
7}
```
