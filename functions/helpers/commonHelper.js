const moment = require('moment-timezone');

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || !domain) return false;
  return domain.includes('.') && !email.includes(' ');
}

function validateEmail(email) {
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || !domain) return false;
  return domain.includes('.') && !email.includes(' ');
}

function mergeArrays(arrA, arrB) {
  const chatsMobiles = new Set(arrB.map((c) => c.sender_mobile));
  const merged = [...arrB];

  arrA.forEach((contact) => {
    if (!chatsMobiles.has(contact.mobile)) {
      merged.push({
        id: null,
        chat_id: `contact-${contact.mobile}`,
        uid: contact.uid,
        last_message_came: null,
        sender_name: contact.name,
        sender_mobile: contact.mobile,
        last_message: null,
        is_opened: 1,
        chat_status: 'open',
        chat_note: null,
        chat_tags: '[]',
        origin: 'whatsapp_cloud',
        profile: null,
        other: null,
        createdat: contact.created_at,
        updatedat: contact.updated_at,
        assigned_agent_uid: null,
        last_reply_by: null,
        last_incoming_time: null,
        last_outgoing_time: null,
        sla_expires_at: null,
        sla_violated: 0,
        kanban_order: 0,
        phonebook: contact,
      });
    }
  });

  return merged.map((chat) => {
    if (chat.phonebook) return chat;
    const matchingObject = arrA.find((objA) => objA.mobile === chat.sender_mobile);
    if (matchingObject) {
      return { ...chat, contact: matchingObject };
    }
    return chat;
  });
}

function getCurrentTimestampInTimeZone(timezone) {
  const currentTimeInZone = moment.tz(timezone);
  const currentTimestampInSeconds = Math.round(currentTimeInZone.valueOf() / 1000);

  return currentTimestampInSeconds;
}

function areMobileNumbersFilled(array) {
  for (const item of array) {
    if (!item.mobile) {
      return false;
    }
  }

  return true;
}

function executeQueries(queries, connection) {
  return new Promise(async (resolve) => {
    try {
      for (const query of queries) {
        await connection.query(query);
      }
      resolve({
        success: true,
      });
    } catch (err) {
      resolve({
        success: false,
        err,
      });
    }
  });
}

function returnWidget(image, imageSize, url, position) {
  let style = '';
  switch (position) {
    case 'TOP_RIGHT':
      style = 'position: fixed; top: 15px; right: 15px;';
      break;
    case 'TOP_CENTER':
      style = 'position: fixed; top: 15px; right: 50%; transform: translateX(-50%);';
      break;
    case 'TOP_LEFT':
      style = 'position: fixed; top: 15px; left: 15px;';
      break;
    case 'BOTTOM_RIGHT':
      style = 'position: fixed; bottom: 15px; right: 15px;';
      break;
    case 'BOTTOM_CENTER':
      style = 'position: fixed; bottom: 15px; right: 50%; transform: translateX(-50%);';
      break;
    case 'BOTTOM_LEFT':
      style = 'position: fixed; bottom: 15px; left: 15px;';
      break;
    case 'ALL_CENTER':
      style = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);';
      break;
    default:
      style = 'position: fixed; top: 15px; right: 15px;';
      break;
  }

  return `
    <a href="${url}">
      <img  src="${image}" alt="Widget" id="widget-image"
        style="${style} width: ${imageSize}px; height: auto; cursor: pointer; z-index: 9999;">
        </a>
      <div  class="widget-container" id="widget-container"
        style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: #fff; border: 1px solid #ccc; border-radius: 5px; padding: 10px; box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1); display: none; z-index: 9999;">
        <span class="close-btn" id="close-btn"
          style="position: absolute; top: 5px; right: 5px; cursor: pointer;">&times;</span>
      </div>

      <script>
        const widgetImage = document.getElementById('widget-image');
        const widgetContainer = document.getElementById('widget-container');
        widgetImage.addEventListener('click', function () {
          window.location.href = '${url}';
        });
        const closeBtn = document.getElementById('close-btn');
        closeBtn.addEventListener('click', function (event) {
          event.stopPropagation();
          widgetContainer.style.display = 'none';
        });
      </script>
    `;
}

function generateWhatsAppURL(phoneNumber, text) {
  const baseUrl = 'https://wa.me/';
  const formattedPhoneNumber = phoneNumber.replace(/\D/g, ''); // Remove non-numeric characters
  const encodedText = encodeURIComponent(text);
  return `${baseUrl}${formattedPhoneNumber}?text=${encodedText}`;
}

async function makeRequest({ method, url, body = null, headers = [] }) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 seconds

    const headersObject = headers.reduce((acc, { key, value }) => {
      acc[key] = value;
      return acc;
    }, {});

    const requestBody =
      method === 'GET' || method === 'DELETE'
        ? undefined
        : JSON.stringify(
            body.reduce((acc, { key, value }) => {
              acc[key] = value;
              return acc;
            }, {}),
          );

    const config = {
      method,
      headers: headersObject,
      body: requestBody,
      signal: controller.signal,
    };

    console.log({
      config,
    });

    const { isSafeUrl } = require('../../utils/ssrfFilter');
    if (!(await isSafeUrl(url))) {
      return { success: false, msg: 'Blocked potential SSRF attack vector' };
    }
    const cleanUrl = url
      .split('')
      .map((c) => String.fromCharCode(c.charCodeAt(0)))
      .join('');
    const response = await fetch(cleanUrl, config);

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { success: false, msg: `HTTP error ${response.status}` };
    }

    const data = await response.json();

    if (typeof data === 'object' || Array.isArray(data)) {
      return { success: true, data };
    } else {
      return { success: false, msg: 'Invalid response format' };
    }
  } catch (error) {
    return { success: false, msg: error.message };
  }
}

function replacePlaceholders(template, data) {
  return template.replace(/{{{([^}]+)}}}/g, (match, key) => {
    key = key.trim();

    const arrayMatch = key.match(/^\[(\d+)]\.(.+)$/);
    if (arrayMatch) {
      const index = parseInt(arrayMatch[1], 10);
      const property = arrayMatch[2];

      if (Array.isArray(data) && index >= 0 && index < data.length) {
        let value = data[index];
        const nestedKeys = property.split('.');
        for (const k of nestedKeys) {
          if (value && Object.prototype.hasOwnProperty.call(value, k)) {
            value = value[k];
          } else {
            return 'NA';
          }
        }
        return value !== undefined ? value : 'NA';
      } else {
        return 'NA';
      }
    }

    const keys = key.split('.');
    let value = data;

    for (const k of keys) {
      if (value && Object.prototype.hasOwnProperty.call(value, k)) {
        value = value[k];
      } else {
        return 'NA';
      }
    }

    return value !== undefined ? value : 'NA';
  });
}

function convertNumberToRandomString(number) {
  const mapping = {
    0: 'i',
    1: 'j',
    2: 'I',
    3: 'u',
    4: 'I',
    5: 'U',
    6: 'S',
    7: 'D',
    8: 'B',
    9: 'j',
  };

  const numStr = number.toString();
  let result = '';
  for (let i = 0; i < numStr.length; i++) {
    const digit = numStr[i];
    result += mapping[digit];
  }
  return result;
}

module.exports = {
  isValidEmail,
  validateEmail,
  mergeArrays,
  getCurrentTimestampInTimeZone,
  areMobileNumbersFilled,
  executeQueries,
  returnWidget,
  generateWhatsAppURL,
  makeRequest,
  replacePlaceholders,
  convertNumberToRandomString,
};
