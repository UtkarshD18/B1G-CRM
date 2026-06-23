# Reference Page Audit — USER conversational-api

- **URL:** `https://crm.oneoftheprojects.com/user?page=conversational-api`
- **Page Title:** `whatsCRM`

## 1. Headings
- H5: Conversational API
- H6: Your API Key
- H6: How To
- H6: API Endpoint
- H6: Request Body
- H6: API RESPONSES
- H6: Success Response
- H6: Error Response

## 2. Buttons
- Button: **"English"**
- Button: **"Regenerate API Key"**
- Button: **"How To"**
- Button: **"Text"**
- Button: **"Image"**
- Button: **"Video"**
- Button: **"Audio"**
- Button: **"Document"**
- Button: **"Location"**
- Button: **"Contact"**
- Button: **"Reaction"**
- Button: **"List"**
- Button: **"Button"**

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

conversational-api

English
JD
Conversational API

Send conversational messages using Meta Rest API

Your API Key

YOUR_API_KEY_HERE

Regenerate API Key
How To
Text
Image
Video
Audio
Document
Location
Contact
Reaction
List
Button
How To
1
API Endpoint
POST
Send a POST request to the following URL
https://crm.oneoftheprojects.com/api/v1/send-message?token=API_KEY
3
Request Body

Send a JSON body with the messageObject key containing the WhatsApp message payload.

{
  "messageObject": { ...object }
}
API RESPONSES
Success Response
200 OK
{
  "success": true,
  "message": "Message sent successfully!"
}
Error Response
4xx / 5xx
{
  "success": false,
  "message": "<REASON>"
}
```
