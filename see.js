const process = require('process');
const readline = require('readline');
const mongoose = require('mongoose');
const puppeteerWrapper = require('./modules/PuppeteerWrapper');
const fdHelper = require('./modules/FdHelper');
const Account = require('./schema/account');

const config = require('./config.json');

require('dotenv').config();

function random() {
  return Math.floor(Math.random() * 30) + 5;
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      let totalHeight = 0;
      const distance = 100;
      let count = Math.floor(Math.random() * 30) + 5;
      const timer = setInterval(() => {
        const { scrollHeight } = document.body;
        window.scrollBy(0, distance);
        totalHeight += distance;
        // eslint-disable-next-line no-plusplus
        count--;
        if (totalHeight >= scrollHeight || count <= 0) {
          clearInterval(timer);
          resolve();
        }
      }, 250);
    });
  });
}

async function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question(question, (answer) => {
      rl.close();
      if (answer === null || answer === undefined || !/\S/.test(answer)) {
        return reject();
      }
      resolve(answer);
    });
  });
}

let email = process.env.EMAIL;
let password = process.env.PASSWORD;

// eslint-disable-next-line no-shadow
async function see(email, proxyServer) {
  fdHelper.dir(`./accounts/${email}`);
  // eslint-disable-next-line new-cap
  const pw = new puppeteerWrapper({ account: email, proxyServer });
  console.log(`See ${email}`);
  try {
    pw.browserConf.headless = true;
    await pw.init();
    await pw.page.goto('https://bot.sannysoft.com/');
    await pw.page.waitForTimeout(2000);
    await pw.page.goto('https://2ip.ru/');
    await pw.page.waitForTimeout(2000);
    await pw.page.goto('https://www.tiktok.com/');
    const login = await pw.page.$x("//button[@data-e2e='top-login-button']");
    if (!login.length) {
      // eslint-disable-next-line no-plusplus
      for (let count = random(); count > 0; count--) {
        // eslint-disable-next-line no-await-in-loop
        await autoScroll(pw.page);
        // eslint-disable-next-line no-await-in-loop
        await pw.page.waitForTimeout(random() * 1000);
      }
      await pw.SaveCookies();
      await pw.close();
      console.log(`See ${email} success`);
      return true;
    }

    await pw.close();
    console.log(`${email} not logined`);
    return false;
  } catch (err) {
    console.log('Seen Error');
    console.log(`${err}`);
    await pw.close();
    return false;
  }
}
try {
  (async () => {
    let accountList = [];
    console.log('TikTok see -v1.0.0');
    await mongoose.connect(config.db);

    if (email) {
      const account = await Account.findOne({ email }).exec();
      accountList.push(account);
    }

    if (!email) {
      accountList = await Account.find({ status: 1 }).exec();
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const one of accountList) {
      email = one.email;
      // eslint-disable-next-line no-await-in-loop
      const proxyServer = JSON.parse(one.proxy);

      if (email && proxyServer) {
        // eslint-disable-next-line no-await-in-loop
        const result = await see(email, proxyServer);
        // eslint-disable-next-line no-await-in-loop
        if (!result) { await Account.findByIdAndUpdate(one._id, { status: 3 }).exec(); }
      } else {
        console.log(`${email} Error account or password`);
      }
    }
    mongoose.disconnect();
  })();
} catch (err) {
  console.log(err);
}
