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
  const initialState = {
    contacts: [],
    uiState: {
      editId: null,
      searchQuery: "",
    },
  };

  const containers = initLayout(containerId);
  const watchedState = onChange(initialState, render(containers));
  const storedContacts = JSON.parse(localStorage.getItem("contacts")) || [];

  // initialising tasks and fires first rerendering of the app
  watchedState.contacts = storedContacts;

  /**
   * This function triggers every time we reassign the
   * values of properties of the tracked object
   */
  function render(containers) {
    return function (path, value, prevValue) {
      switch (path) {
        case "contacts": {
          storeData("contacts", this.contacts);
          renderHeader(this, containers.header);
          renderFooter(this, containers.footer);
        }
        case "uiState.editId":
        case "uiState.searchQuery": {
          renderContacts(this, containers.list);
        }
      }
    };
  }

  /** this function creates and configure header (filters) */
  function renderHeader(state, containerEl) {
    containerEl.innerHTML = "";

    const searchInputEl = createElement("input", {
      type: "text",
      className: "input-text contact-book__search",
      placeholder: "Enter contact name or phone number...",
      value: state.uiState.searchQuery,
    });

    searchInputEl.addEventListener("input", (e) => {
      state.uiState.editId = null;
      state.uiState.searchQuery = e.target.value.trim();
    });

    containerEl.append(searchInputEl);

    if (state.uiState.searchQuery) {
      searchInputEl.focus();
    }
  }

  /** this function filters contacts by name or phone */
  function handleSearch(state) {
    const { contacts, uiState } = state;
    const { searchQuery } = uiState;

    if (searchQuery.length) {
      return contacts.filter(
        (c) => c.name.includes(searchQuery) || c.phone.includes(searchQuery)
      );
    }

    return contacts;
  }

  /**
   * this function creates and configure contacts list
   * also it shows contact card or contact edit form,
   * depending on editId state propery
   */
  function renderContacts(state, containerEl) {
    containerEl.innerHTML = "";
    const FoundedContacts = handleSearch(state);
    const contactCards = FoundedContacts.map((contact) => {
      const isEditing = contact.id === state.uiState.editId;

      return isEditing
        ? renderContactEditForm(state, contact)
        : renderContactCard(state, contact);
    });

    if (contactCards.length === 0) {
      contactCards.push(
        createElement("div", {
          className: "contact-card contact-book__card",
          textContent: `No contacts were found...`,
        })
      );
    }

    containerEl.append(...contactCards);
  }

  /** this function creates and configure edit form */
  function renderContactEditForm(state, contact) {
    const elementsConfig = [
      {
        tagName: "form",
        options: {
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
        options: {
          className: "btn btn--small btn--yellow edit-form__btn",
          textContent: "Save",
          type: "submit",
        },
      },
      {
        tagName: "button",
        options: {
          className: "btn btn--small btn--grey edit-form__btn",
          textContent: "Cancel",
          type: "reset",
        },
      },
    ];

    const [formEl, submitBtn, cancelBtn] = elementsConfig.map(({ tagName, options }) =>
      createElement(tagName, options)
    );

    formEl.append(submitBtn, cancelBtn);

    formEl.addEventListener("reset", (e) => {
      e.preventDefault();
      state.uiState.editId = null;
    });

    formEl.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);
      const contactData = Object.fromEntries(formData);

      state.contacts = state.contacts.map((c) => {
        return c.id === contact.id ? { ...c, ...contactData } : c;
      });

      formEl.reset();
    });

    return formEl;
  }

  /** this function creates and configure contact card */
  function renderContactCard(state, contact) {
    const elementsConfig = [
      {
        tagName: "article",
        options: {
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
        options: {
          className: "btn btn--grey btn--small contact-card__btn",
          textContent: "Delete",
        },
      },
      {
        tagName: "button",
        options: {
          className: "btn btn--yellow btn--small contact-card__btn",
          textContent: `Edit`,
        },
      },
    ];

    const [cardEl, deleteBtn, editBtn] = elementsConfig.map(({ tagName, options }) =>
      createElement(tagName, options)
    );

    editBtn.addEventListener("click", () => {
      state.uiState.editId = contact.id;
    });

    deleteBtn.addEventListener("click", () => {
      state.contacts = state.contacts.filter((t) => t.id !== contact.id);
    });

    cardEl.append(deleteBtn, editBtn);

    return cardEl;
  }

  /** this function creates and configure footer (add form) */
  function renderFooter(state, containerEl) {
    containerEl.innerHTML = "";

    const elementsConfig = [
      {
        tagName: "form",
        options: { className: "add-form" },
      },
      {
        tagName: "input",
        options: {
          type: "text",
          name: "name",
          className: "input-text input-text--white form__input",
          required: true,
          placeholder: "Contact name",
        },
      },
      {
        tagName: "input",
        options: {
          type: "tel",
          name: "phone",
          className: "input-text input-text--white form__input",
          required: true,
          placeholder: "Contact phone",
        },
      },
      {
        tagName: "button",
        options: {
          className: "btn btn--large btn--white",
          textContent: "Add new contact",
          type: "submit",
        },
      },
    ];

    const [formEl, titleEl, telEl, submitBtn] = elementsConfig.map(
      ({ tagName, options }) => createElement(tagName, options)
    );

    formEl.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);
      const contactData = Object.fromEntries(formData);

      state.contacts.push({ id: uid(), ...contactData });
      state.uiState.editId = null;
    });

    formEl.append(titleEl, telEl, submitBtn);
    containerEl.append(formEl);
  }

  function storeData(propName, data) {
    localStorage.setItem(propName, JSON.stringify(data));
  }

  /** this function creates, configure and returns main layout containers */
  function initLayout(containerId) {
    const wrapper = document.getElementById(containerId);
    wrapper.classList.add("contact-book");

    const list = createElement("div", { className: "contact-book__contacts" });
    const header = createElement("div", { className: "contact-book__header" });
    const footer = createElement("div", { className: "contact-book__footer" });

    wrapper.append(header, list, footer);

    return {
      list,
      header,
      footer,
    };
  }

  // Just simple utility function
  function createElement(tagName, props) {
    const element = document.createElement(tagName);

    for (let prop in props) {
      element[prop] = props[prop];
    }

    return element;
  }
}

app("contact-book");
