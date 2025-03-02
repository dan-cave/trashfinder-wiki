class Banner {
  constructor() {
    this.banner = document.getElementById("banner");
    if (this.banner && typeof localStorage !== "undefined") {
      this.button = this.banner.querySelector("button");
      this.showUntil = new Date(this.banner.dataset.showUntil).getTime();
      this.bannerKey = btoa(`${this.banner.innerHTML}_${this.showUntil}`);

      this.button.addEventListener("click", this.dismissBanner.bind(this));
      this.displayBanner();
    }
  }

  displayBanner() {
    if (
      !Number.isNaN(this.showUntil) &&
      localStorage.getItem("banner") !== this.bannerKey &&
      this.showUntil - Date.now() > 0
    ) {
      this.banner.classList.remove("hidden");
    }
  }

  dismissBanner() {
    try {
      localStorage.setItem("banner", this.bannerKey);
    } finally {
      this.banner.classList.add("hidden");
    }
  }
}

export default new Banner();
