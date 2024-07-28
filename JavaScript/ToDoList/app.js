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

function app(containerId) {
  const FILTERS_MAP = ["all", "completed", "incompleted"];

  const initialState = {
    tasks: [],
    uiState: {
      filterBy: FILTERS_MAP[0],
    },
  };

  const containers = initLayout(containerId);
  const watchedState = onChange(initialState, render(containers));
  const storedTasks = JSON.parse(localStorage.getItem("tasks")) || [];

  // initialising tasks and fires first rerendering of the app
  watchedState.tasks = storedTasks;

  /**
   * This function triggers every time we reassign the
   * values of properties of the tracked object
   */
  function render(containers) {
    return function (path, value, prevValue) {
      switch (path) {
        case "tasks": {
          storeTasks(this);
        }
        case "uiState.filterBy": {
          renderHeader(this, containers.header);
          renderTasks(this, containers.list);
          renderFooter(this, containers.footer);
        }
      }
    };
  }

  /** this function creates and configure header (filters) */
  function renderHeader(state, headerEl) {
    headerEl.innerHTML = "";

    const { filterBy } = state.uiState;
    const filterButtons = FILTERS_MAP.map((filter) => {
      const isActive = filterBy === filter;
      const filterBtn = createElement("button", {
        className: `btn ${isActive ? "btn--yellow" : ""}`,
        textContent: filter,
      });
      filterBtn.dataset.filter = filter;
      return filterBtn;
    });

    headerEl.append(...filterButtons);

    headerEl.addEventListener("click", (e) => {
      if (e.target.classList.contains("btn")) {
        state.uiState.filterBy = e.target.dataset.filter;
      }
    });
  }

  /** this function filters tasks by "completed" property */
  function handleFilterTasks(state) {
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
  }

  /** this function creates and configure tasks list */
  function renderTasks(state, listEl) {
    listEl.innerHTML = "";

    const filteredTasks = handleFilterTasks(state);

    const tasksCards = filteredTasks.map((task) => {
      const card = createElement("article", {
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
      });

      const deleteBtn = createElement("button", {
        className: "btn btn--grey btn--small task-card__btn",
        textContent: "Delete",
      });

      const toggleCompleteBtn = createElement("button", {
        className: "btn btn--yellow btn--small task-card__btn",
        textContent: `mark as ${task.completed ? "incomplete" : "complete"}`,
      });

      deleteBtn.addEventListener("click", () => {
        state.tasks = state.tasks.filter((t) => t.id !== task.id);
      });

      toggleCompleteBtn.addEventListener("click", () => {
        state.tasks = state.tasks.map((t) =>
          t.id === task.id ? { ...t, completed: !t.completed } : t
        );
      });

      card.append(deleteBtn, toggleCompleteBtn);

      return card;
    });

    if (tasksCards.length === 0) {
      tasksCards.push(
        createElement("div", {
          className: "task-card todo-list__task-card",
          textContent: `No tasks here at this moment...`,
        })
      );
    }

    listEl.append(...tasksCards);
  }

  /** this function creates and configure footer (add form) */
  function renderFooter(state, footerEl) {
    footerEl.innerHTML = "";

    const formEl = createElement("form", { className: "add-form" });

    const titleEl = createElement("input", {
      type: "text",
      name: "title",
      className: "input-text input-text--white",
      required: true,
      placeholder: "Task title",
    });
    const descriptionEl = createElement("textarea", {
      name: "description",
      className: "textarea textarea--white",
      required: true,
      placeholder: "Task description",
    });

    const submitBtn = createElement("button", {
      className: "btn btn--large btn--white",
      textContent: "Add new task",
      type: "submit",
    });

    formEl.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);
      const taskData = Object.fromEntries(formData);

      state.tasks.push({ id: uid(), ...taskData });
    });

    formEl.append(titleEl, descriptionEl, submitBtn);
    footerEl.append(formEl);
  }

  function storeTasks(state) {
    localStorage.setItem("tasks", JSON.stringify(state.tasks));
  }

  /** this function creates, configure and returns main layout containers */
  function initLayout(containerId) {
    const wrapper = document.getElementById(containerId);
    wrapper.classList.add("todo-list");

    const list = createElement("div", { className: "todo-list__tasks" });
    const header = createElement("div", { className: "todo-list__header" });
    const footer = createElement("div", { className: "todo-list__footer" });

    wrapper.append(header, list, footer);

    return {
      list,
      header,
      footer,
    };
  }

  // Just simple utility function
  function createElement(tagName, props = {}) {
    const element = document.createElement(tagName);

    for (let prop in props) {
      element[prop] = props[prop];
    }

    return element;
  }
}

app("todo-list");
