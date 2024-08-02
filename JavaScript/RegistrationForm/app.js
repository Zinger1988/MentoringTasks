class FormVaildator {
  #isValid = false;
  #isSubmitting = false;
  #validateOn = {
    change: true,
    blur: false,
    focus: false,
    input: false,
  };

  constructor({ formElement, controls = [], onSubmit, validateOn = {} }) {
    this.formElement = null;
    this.controls = {};
    this.errors = {};
    this.tooltips = {};
    this.validities = {};

    this.#validateOn = { ...this.#validateOn, ...validateOn };
    this.#init(formElement, controls, onSubmit);
  }

  #handleValidateOn() {
    const eventEntries = Object.entries(this.#validateOn);

    eventEntries.forEach(([eventType, shouldTrigger]) => {
      if (shouldTrigger) {
        const controlEntries = Object.entries(this.controls);

        controlEntries.forEach((entry) => {
          const [name, control] = entry;
          control.element.addEventListener(eventType, () => {
            control.touched = true;
            this.#checkControlValidity(name);
          });
        });
      }
    });
  }

  #init(formElement, controls, onSubmit) {
    this.#initForm(formElement, onSubmit);
    this.#initControls(controls);
    this.#handleValidateOn();

    Object.keys(this.controls).forEach((name) => this.#checkControlValidity(name));

    console.log(this);
  }

  #initForm(formElement, onSubmit) {
    formElement.noValidate = true;

    formElement.addEventListener("submit", (e) => {
      e.preventDefault();
      this.#isSubmitting = true;

      const controls = Object.keys(this.controls);
      controls.forEach((name) => this.#checkControlValidity(name));

      this.#checkFormValidity();

      if (this.#isValid) {
        onSubmit(e);
      }
    });

    this.formElement = formElement;
  }

  #checkFormValidity() {
    this.#isValid = Object.values(this.errors).every(
      ({ messages }) => messages.length === 0
    );
  }

  #initControls(controls) {
    controls.forEach((control) => {
      const { name, tooltips = [], validities = [], touched = false } = control;

      this.controls[name] = {
        element: this.formElement.querySelector(`[name="${name}"]`),
        touched,
      };

      this.errors[name] = {
        container: null,
        messages: [],
      };

      this.tooltips[name] = tooltips;
      this.validities[name] = validities;
    });
  }

  #renderError(name) {
    const { element } = this.controls[name];
    const errors = this.errors[name];

    if (!errors.container) {
      const container = document.createElement("div");
      container.classList.add("validity-errors");
      errors.container = container;
      element.after(container);
    }

    errors.container.innerHTML = "";

    errors.messages.forEach((message) => {
      errors.container.innerHTML += `<p class="validity-errors__item">${message}</p>`;
    });
  }

  #setError(name, message) {
    const errors = this.errors[name];
    errors.messages.push(message);
    this.#renderError(name);
  }

  #clearError(name) {
    const errors = this.errors[name];

    if (errors.container) {
      errors.container.innerHTML = "";
    }

    errors.messages = [];
  }

  #checkControlValidity(name) {
    // prettier-ignore
    const validityChecks = {
      name: (value) => (value.length === 0) || value.match(/^[a-z ,.'-]+$/i),
      minLength: (value, minLength) => (value.length === 0) || value.length >= minLength,
      email: (value) => (value.length === 0) || value.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g),
      password: (value) => (value.length === 0) || value.match(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/),
      required: (value) => !!value.trim(),
      match: (value, name) => {
        const targetControl = this.controls[name].element;
        return value.length === 0 || value === targetControl.value;
      },
    };

    this.#clearError(name);

    const { element, touched } = this.controls[name];
    const { value } = element;

    this.validities[name].forEach((validity) => {
      const checkFn = validityChecks[validity.name];
      const isValid = checkFn(value, validity.value);

      if ((!isValid && touched) || (!isValid && this.#isSubmitting)) {
        this.#setError(name, validity.message);
      }
    });
  }
}

// prettier-ignore
new FormVaildator({
  formElement: document.getElementById("registration"),
  controls: [
    {
      name: "name",
      tooltips: ["I am a tooltip"],
      validities: [
        { name: "name", message: "Enter valid name" },
        { name: "required", message: "This field is required" },
      ],
    },
    {
      name: "email",
      tooltips: ["I am a tooltip"],
      validities: [
        { name: "email", message: "Invalid email" },
        { name: "required", message: "This field is required" },
      ],
    },
    {
      name: "password",
      tooltips: ["I am a tooltip"],
      validities: [
        { name: "required", message: "This field is required" },
        { name: "password", message: "This field must have minimum 8 characters, at least 1 letter and 1 number"},
      ],
    },
    {
      name: "confirmPassword",
      tooltips: ["I am a tooltip"],
      validities: [
        { name: "match", value: "password", message: "The confirmation password must match the password"},
        { name: "required", message: "This field is required" },
      ],
    },
  ],
  validateOn: {
    change: true,
    input: true
  },
  onSubmit: () => {
    console.log("submit");
  }
});
