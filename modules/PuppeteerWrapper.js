const fs = require('fs');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

module.exports = class PuppeteerWrapper {
  constructor({ account, userAgent, proxyServer }) {
    if (!account) {
      throw new Error('Missing account error');
    } else {
      this.userDataDir = `./accounts/${account}`;
      this.account = account;
    }
    this.browser = {};
    this.userAgent = userAgent || 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36';
    this.page = {};
    this.browserConf = {
      headless: true,
      slowMo: 25,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-infobars',
        `--user-data-dir=${this.userDataDir}`,
        '--window-size=1080,1920',
        `--user-agent=${this.userAgent}`,
      ],
      ignoreHTTPSErrors: true,
    };

    if (proxyServer) {
      this.proxyServer = proxyServer;
      this.browserConf.args.push(`--proxy-server=${this.proxyServer.server}`);
    } else {
      throw new Error('Proxy account error');
    }
  }

  async init() {
    await puppeteer.use(StealthPlugin());
    this.browser = await puppeteer.launch(this.browserConf);
    this.page = await this.browser.newPage();
    if (this.proxyServer) {
      await this.page.authenticate({
        username: this.proxyServer.username,
        password: this.proxyServer.password,
      });
    }
    await this.SetCookies();
  }

  async close() {
    await this.page.close();
    await this.browser.close();
  }

  async SaveCookies() {
    console.log(`Save ${this.userDataDir}/${this.account}_cookies.json`);
    const cookies = await this.page.cookies();
    fs.writeFileSync(`${this.userDataDir}/${this.account}_cookies.json`, JSON.stringify(cookies, null, 2));
  }

  async RemoveCookies() {
    fs.unlinkSync(`${this.userDataDir}/${this.account}_cookies.json`);
  }

  async SetCookies() {
    if (!fs.existsSync(`${this.userDataDir}/${this.account}_cookies.json`)) { return false; }
    const cookiesString = fs.readFileSync(`${this.userDataDir}/${this.account}_cookies.json`, 'utf8');
    const cookies = JSON.parse(cookiesString);
    await this.page.setCookie(...cookies);
    return true;
  }
};
