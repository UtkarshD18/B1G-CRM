const { query } = require('../../database/dbpromise');

function addDaysToCurrentTimestamp(days) {
  let currentTimestamp = Date.now();
  let millisecondsToAdd = days * 24 * 60 * 60 * 1000;
  let newTimestamp = currentTimestamp + millisecondsToAdd;
  return newTimestamp;
}

async function updateUserPlan(plan, uid) {
  console.log({ plan });
  const planDays = parseInt(plan?.plan_duration_in_days || 0);
  const timeStamp = addDaysToCurrentTimestamp(planDays);
  await query(`UPDATE user SET plan = ?, plan_expire = ? WHERE uid = ?`, [
    JSON.stringify(plan),
    timeStamp,
    uid,
  ]);
}

function getNumberOfDaysFromTimestamp(timestamp) {
  if (!timestamp || isNaN(timestamp)) {
    return 0;
  }

  const currentTimestamp = Date.now();
  if (timestamp <= currentTimestamp) {
    return 0;
  }

  const millisecondsInADay = 1000 * 60 * 60 * 24;
  const differenceInDays = Math.ceil((timestamp - currentTimestamp) / millisecondsInADay);
  return differenceInDays;
}

async function getUserPlayDays(uid) {
  const getUser = await query(`SELECT * FROM user WHERE uid = ?`, [uid]);
  if (getUser.length < 1) {
    return 0;
  }
  if (!getUser[0].plan_expire) {
    return 0;
  } else {
    const days = getNumberOfDaysFromTimestamp(getUser[0]?.plan_expire);
    return days;
  }
}

function getUserSignupsByMonth(users) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  const { paidUsers, unpaidUsers } = users.reduce(
    (acc, user) => {
      const planExpire = user.plan_expire ? new Date(parseInt(user.plan_expire)) : null;
      const isPaid = planExpire ? planExpire > currentDate : false;
      if (isPaid) {
        acc.paidUsers.push(user);
      } else {
        acc.unpaidUsers.push(user);
      }
      return acc;
    },
    { paidUsers: [], unpaidUsers: [] },
  );

  const paidSignupsByMonth = months.map((month, monthIndex) => {
    const usersInMonth = paidUsers.filter((user) => {
      const userDate = new Date(user.createdat || user.created_at);
      return userDate.getMonth() === monthIndex && userDate.getFullYear() === currentYear;
    });
    const count = usersInMonth.length;
    const userEmails = usersInMonth.map((user) => user.email);
    return { month, count, userEmails, paid: true };
  });

  const unpaidSignupsByMonth = months.map((month, monthIndex) => {
    const usersInMonth = unpaidUsers.filter((user) => {
      const userDate = new Date(user.createdat || user.created_at);
      return userDate.getMonth() === monthIndex && userDate.getFullYear() === currentYear;
    });
    const count = usersInMonth.length;
    const userEmails = usersInMonth.map((user) => user.email);
    return { month, count, userEmails, paid: false };
  });

  return { paidSignupsByMonth, unpaidSignupsByMonth };
}

function getUserOrderssByMonth(orders) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const signupsByMonth = Array.from({ length: 12 }, (_, monthIndex) => {
    const month = months[monthIndex];
    const ordersInMonth = orders.filter((user) => {
      const userDate = new Date(user.createdat || user.created_at);
      return userDate.getMonth() === monthIndex && userDate.getFullYear() === currentYear;
    });
    const count = ordersInMonth.length;
    return { month, count };
  });
  return signupsByMonth;
}

const rzCapturePayment = (paymentId, amount, razorpayKey, razorpaySecret) => {
  const auth = 'Basic ' + Buffer.from(razorpayKey + ':' + razorpaySecret).toString('base64');
  const cleanPaymentId = String(paymentId || '')
    .split('')
    .map((c) => String.fromCharCode(c.charCodeAt(0)))
    .join('');
  if (!cleanPaymentId || !/^[a-zA-Z0-9\-\_]+$/.test(cleanPaymentId)) {
    return Promise.reject(new Error('Invalid payment ID format'));
  }

  return new Promise((resolve, reject) => {
    fetch(`https://api.razorpay.com/v1/payments/${cleanPaymentId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: auth,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: amount }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          console.error('Error capturing payment:', data.error);
          reject(data.error);
        } else {
          console.log('Payment captured successfully:', data);
          resolve(data);
        }
      })
      .catch((error) => {
        console.error('Error capturing payment:', error);
        reject(error);
      });
  });
};

module.exports = {
  updateUserPlan,
  getNumberOfDaysFromTimestamp,
  getUserPlayDays,
  getUserSignupsByMonth,
  getUserOrderssByMonth,
  rzCapturePayment,
};
