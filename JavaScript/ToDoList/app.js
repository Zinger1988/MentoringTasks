import onChange from "https://cdn.jsdelivr.net/npm/on-change@5.0.1/+esm";
import { uid } from "https://cdn.jsdelivr.net/npm/uid@2.0.2/+esm";

/**
 * Завдання 2:
 * Створіть динамічний список завдань для проекту з можливістю:
 *
 * Додавання завдань до проекту через форму.
 * Відзначення завдань як виконаних.
 * Видалення завдань.
 * Фільтрація завдань за статусом (всі, виконані, невиконані).
 *
 * Вимоги:
 * Використовуйте методи document.createElement, appendChild, addEventListener для створення елементів списку завдань та управління ними.
 * Забезпечте динамічне оновлення списку завдань при додаванні, відзначенні як виконаних та видаленні.
 * Зберігайте стан завдань в LocalStorage, щоб вони зберігались між перезавантаженнями сторінки.
 */

const app = (containerId) => {
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

    const { filterBy } = state.uiState;

    const filterButtons = FILTERS_MAP.map((filter) => {
      const isActive = filterBy === filter;

      // prettier-ignore
      const filterBtn = createElement({
        tagName: "button",
        properties: { className: `btn ${isActive ? "btn--yellow" : ""}`, textContent: filter },
        attributes: { "aria-label": filter }
      });

      filterBtn.dataset.filter = filter;

      return filterBtn;
    });

    containerEl.append(...filterButtons);

    containerEl.addEventListener("click", (e) => {
      if (e.target.classList.contains("btn")) {
        state.uiState.filterBy = e.target.dataset.filter;
      }
    });
  };

  /** this function filters tasks by "completed" property */
  const handleFilterTasks = (state) => {
    const { tasks, uiState } = state;
    const { filterBy } = uiState;

    switch (filterBy) {
      case "completed": {
        return tasks.filter((t) => t.completed);
      }
      case "incompleted": {
        return tasks.filter((t) => !t.completed);
      }
      default: {
        return tasks;
      }
    }
  };

  /** this function creates and configure tasks list */
  const renderTasks = (state, containerEl) => {
    containerEl.innerHTML = "";

    const filteredTasks = handleFilterTasks(state);

    const tasksCards = filteredTasks.map((task) => {
      // prettier-ignore
      const elementsConfig = [
        {
          tagName: "div",
          properties: {
            className: "task-card todo-list__task-card",
            innerHTML: `
              <div class="task-card__inner">
                <h3 class="task-card__title">
                  ${task.completed ? "&#9989;" : ""}
                  ${task.title}
                </h3>
                <p class="task-card__description">${task.description}</p>
              </div>
            `,
          },
        },
        {
          tagName: "button",
          properties: { className: "btn btn--grey btn--small task-card__btn", textContent: "Delete"},
          attributes: { "aria-label": "Delete" },
        },
        {
          tagName: "button",
          properties: { className: "btn btn--yellow btn--small task-card__btn", textContent: `Mark as ${task.completed ? "incomplete" : "complete"}`},
          attributes: { "aria-label": `Mark as ${task.completed ? "incomplete" : "complete"}`},
        },
      ];

      const [cardEl, deleteBtn, toggleCompleteBtn] = elementsConfig.map((config) =>
        createElement(config)
      );

      deleteBtn.addEventListener("click", () => {
        state.uiState.confirm = {
          itemId: task.id,
          isVisible: true,
          text: "Are you sure you want to delete this task?",
        };
      });

      toggleCompleteBtn.addEventListener("click", () => {
        state.tasks = state.tasks.map((t) =>
          t.id === task.id ? { ...t, completed: !t.completed } : t
        );
      });

      cardEl.append(deleteBtn, toggleCompleteBtn);

      return cardEl;
    });

    if (tasksCards.length === 0) {
      tasksCards.push(
        createElement({
          tagName: "div",
          options: {
            className: "task-card task-card--blank todo-list__task-card",
            textContent:
              "It's empty here for now... 😭 Please enter the title and description of the task in the form below.",
          },
        })
      );
    }

    containerEl.append(...tasksCards);
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
        properties: { type: "text", name: "title", className: "input-text input-text--white", placeholder: "Task title" },
      },
      {
        tagName: "textarea",
        properties: { name: "description", className: "textarea textarea--white", required: true, placeholder: "Task description" },
      },
      {
        tagName: "button",
        properties: { className: "btn btn--large btn--white", textContent: "Add new task", type: "submit" },
        attributes: { "aria-label": "Add new task" }
      },
    ];

    const [formEl, titleEl, descriptionEl, submitBtn] = elementsConfig.map((config) =>
      createElement(config)
    );

    formEl.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);
      const title = formData.get("title");
      const description = formData.get("description");

      const isValid = [title, description].every((field) => field && field?.trim());

      if (!isValid) {
        e.target.reset();
        throw new Error("Invalid task form data");
      }

      state.tasks.push({ id: uid(), title, description });
    });

    formEl.append(titleEl, descriptionEl, submitBtn);
    containerEl.append(formEl);
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

  const storeData = (propName, data) => {
    localStorage.setItem(propName, JSON.stringify(data));
  };

  /** this function creates, configure and returns main layout containers */
  const initLayout = (containerId) => {
    const wrapper = document.getElementById(containerId);
    wrapper.classList.add("todo-list");

    // prettier-ignore
    const elementsConfig = [
      { tagName: "div", properties: { className: "todo-list__header" } },
      { tagName: "div", properties: { className: "todo-list__tasks" } },
      { tagName: "div", properties: { className: "todo-list__footer" } },
      { tagName: "div", properties: { className: "todo-list__modal" } }
    ];

    const [header, list, footer, modal] = elementsConfig.map((config) =>
      createElement(config)
    );

    wrapper.append(header, list, footer, modal);

    return {
      modal,
      list,
      header,
      footer,
    };
  };

  /**
   * This function triggers every time we reassign the
   * values of properties of the tracked object
   */
  const render = (containers) => {
    return function (path, value, prevValue) {
      switch (path) {
        case "tasks": {
          storeData("tasks", this.tasks);
        }
        case "uiState.filterBy": {
          renderHeader(this, containers.header);
          renderTasks(this, containers.list);
          renderFooter(this, containers.footer);
          break;
        }
        case "uiState.confirm": {
          renderConfirm({
            state: this,
            containerEl: containers.modal,
            onConfirm: (state) => {
              const { itemId } = state.uiState.confirm;
              state.tasks = state.tasks.filter((t) => t.id !== itemId);
            },
          });
          break;
        }
      }
    };
  };

  const FILTERS_MAP = ["all", "completed", "incompleted"];

  const initialState = {
    tasks: [],
    uiState: {
      filterBy: FILTERS_MAP[0],
      confirm: {
        itemId: null,
        isVisible: false,
        text: null,
      },
    },
  };

  let storedTasks = [];

  try {
    storedTasks = JSON.parse(localStorage.getItem("tasks")) || [];
  } catch (e) {
    console.error(
      `An error occurred during the parsing of todo-list data from Local Storage. ${e.message}`
    );
  }

  const containers = initLayout(containerId);

  // initialising tasks and fires first rerendering of the app
  const watchedState = onChange(initialState, render(containers));
  watchedState.tasks = storedTasks;
};

app("todo-list");
