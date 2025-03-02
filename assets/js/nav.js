class Nav {
  constructor() {
    this.breakWidth = 801;
    this.breakMedium = false;
    this.ham = document.getElementById("ham");
    this.mobileNav = document.getElementById("mobile-nav");
    this.mobileGmMode = document.querySelector("#mobile-nav .gm-mode");

    this.ham.addEventListener("click", this.toggleMobileNav.bind(this));
    window.addEventListener("resize", this.handleMobileNavOnResize.bind(this));
  }
  toggleMobileNav() {
    this.ham.classList.toggle("opened");
    this.ham.ariaExpanded = !this.ham.ariaExpanded;

    this.mobileNav.classList.toggle("hidden");
    this.mobileNav.ariaExpanded = !this.mobileNav.ariaExpanded;

    this.mobileGmMode.classList.toggle("hidden");
    this.mobileGmMode.ariaExpanded = !this.mobileGmMode.ariaExpanded;
  }

  handleMobileNavOnResize() {
    if (
      !this.breakMedium &&
      window.matchMedia(`(min-width: ${this.breakWidth}px)`).matches
    ) {
      this.breakMedium = true;

      this.ham.classList.remove("opened");
      this.ham.ariaExpanded = false;
      this.mobileNav.classList.add("hidden");
      this.mobileNav.ariaExpanded = false;
      this.mobileGmMode.classList.add("hidden");
      this.mobileGmMode.ariaExpanded = false;
    } else if (
      this.breakMedium &&
      window.matchMedia(`(max-width: ${this.breakWidth - 1}px)`).matches
    ) {
      this.breakMedium = false;
    }
  }
}

export default new Nav();
