class FormVaildator {
  constructor({ element, controls = [], onSubmit, validateOn = {} }) {
    this.formElement = null;
    this.formControls = null;
    this.onSubmit = onSubmit;
    this.validations = null;
    this.validateOn = {
      change: true,
      blur: false,
      input: false,
      ...validateOn,
    };

    this.#init(element, controls);
    this.#handleValidate(this.formControls, this.validateOn);
  }

  #handleValidate(controls, validateOn) {
    const eventEntries = Object.entries(validateOn);

    eventEntries.forEach(([event, shouldTrigger]) => {
      if (shouldTrigger) {
        controls.forEach((control) => {
          control.touched = true;
          control.element.addEventListener(event, () => {
            this.#checkValidity(control);
          });
        });
      }
    });
  }

  #init(element, controls) {
    try {
      this.#initForm(element);
      this.#initControls(controls);
      console.log(this.formControls);

      this.formControls.forEach((item) => this.#checkValidity(item));
    } catch (e) {
      console.error(e);
    }
  }

  #initForm(formElement) {
    formElement.noValidate = true;
    formElement.addEventListener("submit", (e) => {
      e.preventDefault();

      this.formControls.forEach((control) => this.#checkValidity(control));

      this.onSubmit(e);
    });
    this.formElement = formElement;
  }

  #initControls(formControls) {
    this.formControls = Array.from(formControls).map((control) => {
      const { name, tooltip = null, validities = [] } = control;

      const element = this.formElement.querySelector(`[name="${name}"]`);
      const errorsContainer = document.createElement("div");
      errorsContainer.classList.add("validation-errors");
      element.insertAdjacentElement("afterend", errorsContainer);

      return {
        element,
        tooltip,
        validities,
        errors: [],
        errorsContainer,
        touched: false,
      };
    });
  }

  #renderErrors(control) {
    control.errorsContainer.innerHTML = "";

    control.errors.forEach((error) => {
      const errorEl = document.createElement("span");
      errorEl.classList.add("validation-errors__item");
      errorEl.textContent = error;
      control.errorsContainer.append(errorEl);
    });
  }

  #clearErrors(control) {
    control.errors = [];
    control.errorsContainer.innerHTML = "";
  }

  #checkValidity(control) {
    // prettier-ignore
    const validityChecks = {
      name: (control) =>
        control.value.length === 0 || control.value.match(/^[a-z ,.'-]+$/i),
      minLength: (control, minLength) =>
        control.value.length === 0 || control.value.length >= minLength,
      email: (control) =>
        control.value.length === 0 ||
        control.value.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g),
      password: (control) =>
        control.value.length === 0 ||
        control.value.match(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/),
      required: (control) => !!control.value.trim(),
      match: (control, fieldName) => {
        const targetControl = this.formControls.find((c) => c.element.name === fieldName);
        return (
          control.value.length === 0 || control.value === targetControl.element.value
        );
      },
    };

    this.#clearErrors(control);

    control.validities.forEach((validity) => {
      const checkFn = validityChecks[validity.name];
      const isValid = checkFn(control.element, validity.value);

      if (!isValid && control.touched) {
        control.errors.push(validity.message);
        this.#renderErrors(control);
      }
    });
  }
}

// prettier-ignore
new FormVaildator({
  element: document.getElementById("registration"),
  controls: [
    {
      name: "name",
      tooltip: "I am a tooltip",
      validities: [
        { name: "name", message: "Enter valid name" },
        { name: "required", message: "This field is required" },
      ],
    },
    {
      name: "email",
      tooltip: "I am a tooltip",
      validities: [
        // { name: "minLength", value: 3, message: "Min 3 symbols" },
        { name: "email", message: "Invalid email" },
        { name: "required", message: "This field is required" },
      ],
    },
    {
      name: "password",
      tooltip: "I am a tooltip",
      validities: [
        { name: "required", message: "This field is required" },
        {
          name: "password",
          value: 8,
          message:
            "This field must have minimum 8 characters, at least one letter and one number:",
        },
      ],
    },
    {
      name: "confirmPassword",
      tooltip: "I am a tooltip",
      validities: [
        {
          name: "match",
          value: "password",
          message: "The confirmation password must match the password",
        },
        { name: "required", message: "This field is required" },
      ],
    },
  ],
  validateOn: {
    change: true,
    input: true,
  },
  onSubmit: () => {
    console.log("submit");
  },
  customValidation: () => {},
});
