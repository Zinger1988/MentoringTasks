import onChange from "https://cdn.jsdelivr.net/npm/on-change@5.0.1/+esm";
import { uid } from "https://cdn.jsdelivr.net/npm/uid@2.0.2/+esm";

/**
 * Завдання 3:
 * Реалізуйте інтерфейс для відображення та управління контактами з телефонної книги з можливістю:
 * Додавання нових контактів через форму.
 * Редагування існуючих контактів.
 * Видалення контактів.
 * Пошуку контактів за ім'ям або номером телефону.
 *
 * Вимоги:
 * Використовуйте методи document.createElement, appendChild, addEventListener для створення елементів телефонної книги та управління ними.
 * Забезпечте динамічне оновлення списку контактів при додаванні, редагуванні та видаленні.
 * Зберігайте контакти в LocalStorage, щоб вони зберігались між перезавантаженнями сторінки.
 *
 * Підказка:
 * Створіть структуру телефонної книги з використанням HTML-елементів ul та li.
 * Додайте форми для додавання та редагування контактів, а також поле для пошуку.
 */

function app(containerId) {
  // Just simple utility function
  const createElement = ({ tagName, properties = {}, attributes = {} }) => {
    const element = document.createElement(tagName);

    for (let prop in properties) {
      element[prop] = properties[prop];
    }

    for (let attr in attributes) {
      element.setAttribute(attr, attributes[attr]);
    }

    return element;
  };

  /** this function creates and configure header (filters) */
  const renderHeader = (state, containerEl) => {
    containerEl.innerHTML = "";

    const searchInputEl = createElement({
      tagName: "input",
      properties: {
        type: "text",
        className: "input-text contact-book__search",
        placeholder: "Enter contact name or phone number...",
        value: state.uiState.searchQuery,
      },
    });

    let debounceTimerId = null;

    searchInputEl.addEventListener("input", (e) => {
      state.uiState.editId = null;

      if (debounceTimerId) {
        clearTimeout(debounceTimerId);
      }

      debounceTimerId = setTimeout(() => {
        state.uiState.searchQuery = e.target.value.trim();
      }, 500);
    });

    containerEl.append(searchInputEl);
  };

  /** this function filters contacts by name or phone */
  const handleSearch = (state) => {
    const { contacts, uiState } = state;
    const { searchQuery } = uiState;

    if (searchQuery.length) {
      return contacts.filter(
        (c) => c.name.includes(searchQuery) || c.phone.includes(searchQuery)
      );
    }

    return contacts;
  };

  /**
   * this function creates and configure contacts list
   * also it shows contact card or contact edit form,
   * depending on editId state propery
   */
  const renderContacts = (state, containerEl) => {
    containerEl.innerHTML = "";

    const contacts = state.uiState.searchQuery ? handleSearch(state) : state.contacts;

    const contactCards = contacts.map((contact) => {
      const isEditing = contact.id === state.uiState.editId;

      return isEditing
        ? renderContactEditForm(state, contact)
        : renderContactCard(state, contact);
    });

    if (contactCards.length === 0) {
      contactCards.push(
        createElement({
          tagName: "div",
          properties: {
            className: "contact-card contact-card--blank contact-book__card",
            textContent: `No contacts were found... 🙄`,
          },
        })
      );
    }

    containerEl.append(...contactCards);
  };

  /** this function creates and configure edit form */
  const renderContactEditForm = (state, contact) => {
    // prettier-ignore
    const elementsConfig = [
      {
        tagName: "form",
        properties: {
          className: "contact-book__edit-form edit-form",
          innerHTML: `
            <div class="edit-form__inner">
              <input
                type="text"
                name="name"
                class="input-text edit-form__input"
                placeholder="Contact name"
                value="${contact.name}"
                required
              >
              <input
                type="tel"
                name="phone"
                class="input-text edit-form__input"
                placeholder="Contact name"
                value="${contact.phone}"
                required
              >
            </div>
          `,
        },
      },
      {
        tagName: "button",
        properties: { className: "btn btn--small btn--yellow edit-form__btn", textContent: "Save", type: "submit" },
        attributes: { "aria-label": "Save" },
      },
      {
        tagName: "button",
        properties: { className: "btn btn--small btn--grey edit-form__btn", textContent: "Cancel", type: "reset" },
        attributes: { "aria-label": "Cancel" },
      },
    ];

    const [formEl, submitBtn, cancelBtn] = elementsConfig.map((config) =>
      createElement(config)
    );

    formEl.append(submitBtn, cancelBtn);

    formEl.addEventListener("reset", (e) => {
      e.preventDefault();
      state.uiState.editId = null;
    });

    formEl.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);
      const name = formData.get("name");
      const phone = formData.get("phone");

      const isValid = [name, phone].every((field) => field && field?.trim());

      if (!isValid) {
        e.target.reset();
        throw new Error("Invalid contact form data");
      }

      state.contacts = state.contacts.reduce((acc, cur) => {
        cur.id === contact.id ? acc.push({ ...cur, name, phone }) : acc.push(cur);
        return acc;
      }, []);

      formEl.reset();
    });

    return formEl;
  };

  /** this function creates and configure contact card */
  const renderContactCard = (state, contact) => {
    // prettier-ignore
    const elementsConfig = [
      {
        tagName: "article",
        properties: {
          className: "contact-card contact-book__card",
          innerHTML: `
            <div class="contact-card__inner">
              <h3 class="contact-card__title">
                ${contact.name}
              </h3>
              <p class="contact-card__description">${contact.phone}</p>
            </div>
          `,
        },
      },
      {
        tagName: "button",
        properties: { className: "btn btn--grey btn--small contact-card__btn", textContent: "Delete" },
        attributes: { "aria-label": "Delete" },
      },
      {
        tagName: "button",
        properties: { className: "btn btn--yellow btn--small contact-card__btn", textContent: `Edit` },
        attributes: { "aria-label": "Edit" },
      },
    ];

    const [cardEl, deleteBtn, editBtn] = elementsConfig.map((config) =>
      createElement(config)
    );

    editBtn.addEventListener("click", () => {
      state.uiState.editId = contact.id;
    });

    deleteBtn.addEventListener("click", () => {
      state.uiState.confirm = {
        itemId: contact.id,
        isVisible: true,
        text: "Are you sure you want to delete this contact?",
      };
    });

    cardEl.append(deleteBtn, editBtn);

    return cardEl;
  };

  /** this function creates and configure footer (add form) */
  const renderFooter = (state, containerEl) => {
    containerEl.innerHTML = "";

    // prettier-ignore
    const elementsConfig = [
      {
        tagName: "form",
        properties: { className: "add-form" },
      },
      {
        tagName: "input",
        properties: { type: "text", name: "name", className: "input-text input-text--white form__input", required: true, placeholder: "Contact name" },
      },
      {
        tagName: "input",
        properties: { type: "tel", name: "phone", className: "input-text input-text--white form__input", required: true, placeholder: "Contact phone" },
      },
      {
        tagName: "button",
        properties: { className: "btn btn--large btn--white", textContent: "Add new contact", type: "submit" },
        attributes: { "aria-label": "Add new contact" },
      },
    ];

    const [formEl, titleEl, telEl, submitBtn] = elementsConfig.map((config) =>
      createElement(config)
    );

    formEl.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);
      const name = formData.get("name");
      const phone = formData.get("phone");

      const isValid = [name, phone].every((field) => field && field?.trim());

      if (!isValid) {
        e.target.reset();
        throw new Error("Invalid contact form data");
      }

      state.contacts.push({ id: uid(), name, phone });
      state.uiState.editId = null;
      e.target.reset();
    });

    formEl.append(titleEl, telEl, submitBtn);
    containerEl.append(formEl);
  };

  const storeData = (propName, data) => {
    localStorage.setItem(propName, JSON.stringify(data));
  };

  /** this function renders confirm modal and
   * accepts onConfirm and onCancel callbacks
   */
  const renderConfirm = ({ state, containerEl, onConfirm, onCancel }) => {
    const { isVisible, text } = state.uiState.confirm;
    containerEl.innerHTML = "";

    if (!isVisible) {
      return;
    }

    // prettier-ignore
    const elementsConfig = [
      {
        tagName: "div",
        properties: { className: "confirm-modal todo-list__confirm", innerHTML: `` },
      },
      {
        tagName: "div",
        properties: { className: "confirm-modal__body" },
      },
      {
        tagName: "p",
        properties: { className: "confirm-modal__text", textContent: text, },
      },
      {
        tagName: "div",
        properties: { className: "confirm-modal__controls" },
      },
      {
        tagName: "button",
        properties: { className: "confirm-modal__btn btn", textContent: "Confirm" },
        attributes: { "aria-label": "Confirm", },
      },
      {
        tagName: "button",
        properties: { className: "confirm-modal__btn btn btn--grey", textContent: "Cancel" },
        attributes: { "aria-label": "Cancel" },
      },
    ];

    const [wrapperEl, contentEl, textEl, controlsEl, confirmBtn, cancelBtn] =
      elementsConfig.map((config) => createElement(config));

    const handleCloseConfirm = (callback) => {
      if (callback) {
        callback(state);
      }

      state.uiState.confirm = {
        isVisible: false,
        text: null,
      };
    };

    confirmBtn.addEventListener("click", () => {
      handleCloseConfirm(onConfirm);
    });

    cancelBtn.addEventListener("click", () => {
      handleCloseConfirm(onCancel);
    });

    wrapperEl.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) {
        handleCloseConfirm();
      }
    });

    controlsEl.append(confirmBtn, cancelBtn);
    contentEl.append(textEl, controlsEl);
    wrapperEl.append(contentEl);
    containerEl.append(wrapperEl);
  };

  /** this function creates, configure and returns main layout containers */
  const initLayout = (containerId) => {
    const wrapper = document.getElementById(containerId);
    wrapper.classList.add("contact-book");

    const elementsConfig = [
      { tagName: "div", properties: { className: "contact-book__contacts" } },
      { tagName: "div", properties: { className: "contact-book__header" } },
      { tagName: "div", properties: { className: "contact-book__footer" } },
      { tagName: "div", properties: { className: "contact-book__modal" } },
    ];

    const [list, header, footer, modal] = elementsConfig.map((config) =>
      createElement(config)
    );

    wrapper.append(header, list, footer, modal);

    return { list, header, footer, modal };
  };

  /**
   * This function triggers every time we reassign the
   * values of properties of the tracked object
   */
  const render = (containers) => {
    return function (path, value, prevValue) {
      switch (path) {
        case "contacts": {
          storeData("contacts", this.contacts);
        }
        case "uiState.editId":
        case "uiState.searchQuery": {
          renderContacts(this, containers.list);
          break;
        }
        case "uiState.confirm": {
          renderConfirm({
            state: this,
            containerEl: containers.modal,
            onConfirm: (state) => {
              const { itemId } = state.uiState.confirm;
              state.contacts = state.contacts.filter((c) => c.id !== itemId);
            },
          });
          break;
        }
      }
    };
  };

  const initialState = {
    contacts: [],
    uiState: {
      editId: null,
      searchQuery: "",
      confirm: {
        itemId: null,
        isVisible: false,
        text: null,
      },
    },
  };

  let storedContacts = [];

  try {
    storedContacts = JSON.parse(localStorage.getItem("contacts")) || [];
  } catch (e) {
    console.error(
      `An error occurred during the parsing of contacts data from Local Storage. ${e.message}`
    );
  }

  const containers = initLayout(containerId);

  // initialising contacts and fires first rerendering of the app
  const watchedState = onChange(initialState, render(containers));
  watchedState.contacts = storedContacts;
  renderHeader(watchedState, containers.header);
  renderFooter(watchedState, containers.footer);
}

app("contact-book");
