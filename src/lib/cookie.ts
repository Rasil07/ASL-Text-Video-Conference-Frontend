import Cookies from "js-cookie";

class BrowserCookie {
  private browserToken: string;
  private browserUser: string;
  constructor() {
    this.browserToken = "token";
    this.browserUser = "user";
  }

  setBrowserToken(
    token: string,
    options: { expires?: number; path?: string } = {}
  ) {
    Cookies.set(this.browserToken, token, options);
  }

  getBrowserToken() {
    return Cookies.get(this.browserToken);
  }

  removeBrowserToken() {
    Cookies.remove(this.browserToken);
  }

  setBrowserUser(
    user: string,
    options: { expires?: number; path?: string } = {}
  ) {
    Cookies.set(this.browserUser, user, options);
  }

  getBrowserUser() {
    return Cookies.get(this.browserUser);
  }

  removeBrowserUser() {
    Cookies.remove(this.browserUser);
  }
}

const browserCookie = new BrowserCookie();

export default browserCookie;
