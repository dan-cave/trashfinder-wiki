class GameMasterMode {
  constructor() {
    this.navGmInput = document.querySelector("#header > .gm-mode > .gm-input");
    this.navGmButton = document.querySelector(
      "#header > .gm-mode > .gm-button",
    );
    this.mobileGmInput = document.querySelector("#mobile-nav .gm-input");
    this.mobileGmButton = document.querySelector("#mobile-nav .gm-button");

    this.localStorageKey = "gmModeKey";
    this.attemptLimit = 3;

    this.attempts = 0;
    this.state = this.#states.INPUT;
    this.key = "";

    this.navGmButton.addEventListener("click", () => this.#changeState());
    this.mobileGmButton.addEventListener("click", () => this.#changeState());

    this.navGmButton.addEventListener("animationend", () =>
      this.navGmButton.classList.remove(["failed", "bailout"]),
    );
    this.mobileGmButton.addEventListener("animationend", () =>
      this.mobileGmButton.classList.remove(["failed", "bailout"]),
    );
    this.navGmInput.addEventListener("animationend", () =>
      this.navGmInput.classList.remove("close"),
    );
    this.mobileGmInput.addEventListener("animationend", () =>
      this.mobileGmInput.classList.remove("close"),
    );
  }

  submit() {
    this.#changeState();
  }

  get #states() {
    return {
      IDLE: "GM Mode",
      INPUT: "Submit",
      GM: "Exit GM Mode",
    };
  }

  async #changeState() {
    switch (this.state) {
      case this.#states.IDLE:
        break;

      case this.#states.INPUT:
        await this.#enterGmMode();
        break;

      case this.#states.GM:
        this.#exitGmMode();
        break;

      default:
        break;
    }
  }

  #enterGmMode() {
    const isGm = this.#revealSpoilers();

    if (isGm) {
      this.state = this.#states.GM;

      this.navGmButton.classList.add("gm");
      this.mobileGmButton.classList.add("gm");
      this.navGmInput.classList.add("gm");
      this.mobileGmInput.classList.add("gm");

      return;
    }

    this.attempts++;
    if (this.attempts >= this.attemptLimit) {
      this.navGmInput.value = "";
      this.mobileGmInput.value = "";
      typeof localStorage !== "undefined" &&
        localStorage.removeItem(this.localStorageKey);

      this.navGmButton.classList.add("bailout");
      this.mobileGmButton.classList.add("bailout");
      this.navGmInput.classList.add("bailout");
      this.mobileGmInput.classList.add("bailout");

      this.attempts = 0;
      return;
    }
    this.navGmButton.classList.add("failed");
    this.mobileGmButton.classList.add("failed");
  }

  #exitGmMode() {}

  async #revealSpoilers() {
    if (crypto.subtle == null) {
      return false;
    }

    this.key = this.navGmInput.value || this.mobileGmButton.value;
    const cryptoKey = await this.#getCryptoKey();

    const gmElements = document.querySelectorAll(".gm-content");

    gmElements.forEach(async (element) => {
      // This matches encrypted GM content, which follows this pattern :
      // IV|CIPHERTEXT - IV and CIPHERTEXT are both base64 encoded byte arrays
      // GM Content will not be encrypted locally, so this allows local iteration without needing to provide the crypto key.
      if (
        element.innerHTML.match(
          "^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?|([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$",
        )
      ) {
        const [iv, cipherText] = element.innerHTML.split("|");

        const ivBuffer = this.#getBuffer(iv);
        const cipherTextBuffer = this.#getBuffer(cipherText);

        const plainTextBuffer = await crypto.subtle.decrypt(
          { name: "AES-CBC", iv: ivBuffer },
          cryptoKey,
          cipherTextBuffer,
        );
        element.innerHTML = new TextDecoder().decode(plainTextBuffer);
        element.classList.remove("gm-hidden");
      }
    });
  }

  #getBuffer(input) {
    const bin = atob(input);
    const buffer = new Uint8Array(bin.length);

    for (let i = 0; i < bin.length; i++) {
      buffer[i] = bin.charCodeAt(i);
    }
    return buffer;
  }

  #getCryptoKey() {
    const keyBuffer = this.#getBuffer(this.key);

    return crypto.subtle.importKey("raw", keyBuffer, "AES-CBC", true, [
      "decrypt",
    ]);
  }
}

export default new GameMasterMode();
