class State {
  static instance = null;

  constructor({ rootSelector, theme, language, loginStatus }) {
    if (!State.instance) {
      State.instance = {
        options: {
          theme,
          language,
          loginStatus,
        },
        elements: {
          optionsList: document.createElement("ul"),
          rootElement: document.querySelector(rootSelector),
          form: document.createElement("form"),
          submitBtn: document.createElement("button"),
          inputs: [],
        },
      };

      State.#init();
    }

    return State.instance;
  }

  static #init() {
    const { elements } = this.instance;
    const { form, submitBtn, inputs, rootElement, optionsList } = elements;

    if (!rootElement) {
      console.error("Unable to find root element");
      return;
    }

    rootElement.classList.add("state");

    form.classList.add("form", "state__form");
    form.addEventListener("submit", this.#handleForm.bind(this));

    submitBtn.classList.add("btn", "btn--yellow", "btn--large", "form__submit");
    submitBtn.type = "submit";
    submitBtn.textContent = "Update";

    const inputsMap = [
      { label: "theme", name: "theme" },
      { label: "language", name: "language" },
      { label: "login Status", name: "loginStatus" },
    ];

    const inputElements = inputsMap.map(({ label, name }) => {
      const inputEl = document.createElement("input");
      inputEl.classList.add("input-text", "input-text--white", "control__item");
      inputEl.id = name;
      inputEl.name = name;
      inputEl.required = true;

      const labelEl = document.createElement("label");
      inputEl.classList.add("control__label");
      labelEl.setAttribute("for", name);
      labelEl.textContent = label;

      const inputContainer = document.createElement("div");
      inputContainer.classList.add("control", "form__control");

      inputContainer.append(labelEl, inputEl);
      return inputContainer;
    });

    optionsList.classList.add("options-list", "state__options-list");

    inputs.push(...inputElements);
    form.append(...inputs, submitBtn);
    rootElement.append(optionsList, form);

    this.render();
  }

  static #handleForm(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const theme = formData.get("theme");
    const language = formData.get("language");
    const loginStatus = formData.get("loginStatus");

    const isValid = [theme, language, loginStatus].every(
      (field) => field && field?.trim()
    );

    if (!isValid) {
      throw new Error("Invalid form data");
    }

    this.instance = {
      ...this.instance,
      options: {
        theme,
        language,
        loginStatus,
      },
    };

    e.target.reset();
    this.render();
    this.#storeData();
  }

  static setOptions(options) {
    State.instance = {
      ...State.instance,
      options,
    };
    this.render();
  }

  static #storeData() {
    localStorage.setItem("state", JSON.stringify(this.instance.options));
  }

  static render() {
    const { options, elements } = this.instance;
    const { optionsList } = elements;
    const { theme, language, loginStatus } = options;

    optionsList.innerHTML = "";

    const optionsMap = [
      { label: "Theme", value: theme },
      { label: "Language", value: language },
      { label: "Login Status", value: loginStatus },
    ];

    const optionsListItems = optionsMap.map((opt) => {
      const listEl = document.createElement("li");
      listEl.classList.add("options-list__item");

      const labelEl = document.createElement("span");
      labelEl.textContent = `${opt.label}:`;

      const valueEl = document.createElement("b");
      valueEl.textContent = opt.value;

      listEl.append(labelEl, valueEl);

      return listEl;
    });

    optionsList.append(...optionsListItems);
  }
}

let initialState = {
  rootSelector: "#root",
  theme: "violet",
  language: "chinese",
  loginStatus: "success",
};

try {
  initialState = JSON.parse(localStorage.getItem("state")) || initialState;
  initialState = { rootSelector: "#root", ...initialState };
} catch (e) {
  console.error(
    `An error occurred during the parsing of data from Local Storage. ${e.message}`
  );
}

new State(initialState);

window.addEventListener("storage", (e) => {
  try {
    const storedState = JSON.parse(localStorage.getItem("state")) || initialState;
    State.setOptions(storedState);
  } catch (error) {
    console.error(
      `An error occurred during the parsing of data from Local Storage. ${error.message}`
    );
  }
});
