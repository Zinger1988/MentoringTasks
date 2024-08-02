import onChange from "https://cdn.jsdelivr.net/npm/on-change@5.0.1/+esm";
import { uid } from "https://cdn.jsdelivr.net/npm/uid@2.0.2/+esm";

/**
 * Завдання 1:
 * Реалізуйте інтерфейс календаря з можливістю:
 *
 * Вибору дати.
 * Перегляду подій на вибрану дату.
 * Додавання нових подій до вибраної дати.
 * Видалення подій з вибраної дати.
 *
 * Вимоги:
 * Використовуйте методи document.createElement, appendChild, addEventListener для створення елементів календаря та подій.
 * Забезпечте динамічне оновлення списку подій при виборі дати.
 * Зберігайте події в LocalStorage, щоб вони зберігались між перезавантаженнями сторінки.
 *
 * Підказка:
 * Створіть структуру календаря з таблицею або списком, де кожна дата є окремим елементом.
 * При натисканні на дату відображайте список подій для цієї дати та форму для додавання нових подій.
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

  const renderEventForm = (state, containerEl) => {
    const { isEventsOpen } = state.uiState;
    containerEl.innerHTML = "";

    if (!isEventsOpen) {
      return;
    }

    // prettier-ignore
    const elementsConfig = [
      {
        tagName: "form",
        properties: { className: "add-form" },
      },
      {
        tagName: "input",
        properties: { type: "text", name: "title", placeholder: "Event title", className: "input-text input-text--white", required: true },
      },
      {
        tagName: "textarea",
        properties: { name: "description", placeholder: "Event description", className: "textarea textarea--white", required: true },
      },
      {
        tagName: "button",
        properties: { textContent: "Add new event", className: "btn btn--white btn--large" },
        attributes: { "aria-label": "Add new event" },
      },
    ];

    const [eventFormEl, eventFormInputEl, eventFormTextEl, newEventBtn] =
      elementsConfig.map((config) => createElement(config));

    eventFormEl.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);
      const title = formData.get("title");
      const description = formData.get("description");

      const isValid = [title, description].every((field) => field && field?.trim());

      if (!isValid) {
        e.target.reset();
        throw new Error("Invalid event form data");
      }

      state.events.push({
        id: uid(),
        title,
        description,
        createdAt: String(state.uiState.selectedDate),
      });

      e.target.reset();
    });

    eventFormEl.append(eventFormInputEl, eventFormTextEl, newEventBtn);
    containerEl.append(eventFormEl);
  };

  const renderEvents = (state, containerEl) => {
    const { isEventsOpen, selectedDate } = state.uiState;
    containerEl.innerHTML = "";

    if (!isEventsOpen) {
      return;
    }

    // events list creation and handling
    const eventListEl = createElement({
      tagName: "ul",
      properties: { className: "calendar__event-list" },
    });

    const events = state.events.reduce((acc, cur) => {
      if (new Date(cur.createdAt).toDateString() === selectedDate.toDateString()) {
        const listItemEl = createElement({
          tagName: "li",
          properties: { className: "calendar__list-item" },
        });
        const eventCardEl = createEventCard(state, cur);

        listItemEl.append(eventCardEl);

        return [...acc, listItemEl];
      }

      return acc;
    }, []);

    if (events.length === 0) {
      // prettier-ignore
      const blankEventItem = createElement({
        tagName: "li",
        properties: { className: "calendar__blank-event", innerHTML: `<p>No events have been created for this date yet</p>`},
      });
      eventListEl.append(blankEventItem);
    }

    eventListEl.append(...events);
    containerEl.append(eventListEl);
  };

  /**
   * This function creates, configure
   * and returns signle event card but NOT appends it into the DOM
   */
  function createEventCard(state, event) {
    // prettier-ignore
    const elementsConfig = [
      {
        tagName: "article",
        properties: { className: "event-card calendar__event-card" },
      },
      {
        tagName: "h3",
        properties: { className: "event-card__title", textContent: event.title },
      },
      {
        tagName: "p",
        properties: { className: "event-card__desc", textContent: event.description },
      },
      {
        tagName: "button",
        properties: { className: "btn btn--grey btn--small", textContent: "Delete event" },
        attributes: { "aria-label": "Delete event" },
      },
    ];

    const [eventCardEl, eventCardTitleEl, eventCardDescEl, eventDeleteBtn] =
      elementsConfig.map((config) => createElement(config));

    eventDeleteBtn.addEventListener("click", () => {
      state.uiState.confirm = {
        itemId: event.id,
        isVisible: true,
        text: "Are you sure you want to delete this event?",
      };
    });

    eventCardEl.append(eventCardTitleEl, eventCardDescEl, eventDeleteBtn);

    return eventCardEl;
  }

  /**
   * This function creates, configure
   * and returns main layout containers of app
   */
  const renderCalendarHead = (state, containerEL) => {
    containerEL.innerHTML = "";

    // prettier-ignore
    const elementsConfig = [
      {
        tagName: "div",
        properties: { className: "calendar-title" },
      },
      {
        tagName: "button",
        properties: { textContent: "Next Month", className: "btn btn--small btn--yellow" },
        attributes: { "aria-label": "Next Month" },
      },
      {
        tagName: "button",
        properties: { textContent: "Prev Month", className: "btn btn--small btn--yellow" },
        attributes: { "aria-label": "Prev Month" },
      },
    ];

    const [calendarTitleEl, nextMonthBtn, prevMonthBtn] = elementsConfig.map((config) =>
      createElement(config)
    );

    nextMonthBtn.addEventListener("click", () => {
      const { selectedDate } = state.uiState;

      state.uiState.selectedDate = new Date(
        selectedDate.setMonth(state.uiState.selectedDate.getMonth() + 1)
      );

      state.uiState.headerDate = `${
        MONTH_MAP[state.uiState.selectedDate.getMonth()]
      }, ${state.uiState.selectedDate.getFullYear()}`;

      state.uiState.isEventsOpen = false;
    });

    prevMonthBtn.addEventListener("click", () => {
      const { selectedDate, currentDate } = state.uiState;

      if (selectedDate > currentDate) {
        state.uiState.selectedDate = new Date(
          selectedDate.setMonth(selectedDate.getMonth() - 1)
        );

        state.uiState.headerDate = `${
          MONTH_MAP[state.uiState.selectedDate.getMonth()]
        }, ${state.uiState.selectedDate.getFullYear()}`;

        state.uiState.isEventsOpen = false;
      }
    });

    calendarTitleEl.textContent = state.uiState.headerDate;

    containerEL.append(prevMonthBtn, calendarTitleEl, nextMonthBtn);
  };

  /** This function creates array of month dates (from 1st to last) */
  const createMonthDates = (year, month) => {
    const lastDate = new Date(year, month + 1, 0).getDate();

    return Array(lastDate)
      .fill(null)
      .map((date, index) => new Date(year, month, index + 1));
  };

  /** this function creates and configure calendar grid */
  const renderCalendarGrid = (state, containerEl) => {
    containerEl.innerHTML = "";
    const { currentDate, selectedDate } = state.uiState;
    const selectedYear = selectedDate.getFullYear();
    const selectedMonth = selectedDate.getMonth();

    const currentMonthDates = createMonthDates(selectedYear, selectedMonth); // dates array for selected month
    const prevMonthDates = createMonthDates(selectedYear, selectedMonth - 1); // dates array for prev month
    const nextMonthDates = createMonthDates(selectedYear, selectedMonth + 1); // dates array for next month

    // here we got 1st and the last day of the week for selected month
    const firstWeekDay = currentMonthDates.at(0).getDay();
    const lastWeekDay = currentMonthDates.at(-1).getDay();

    /**
     * Here, we trim the periods of the previous and next months
     * to obtain the day-of-the-week offset in the calendar grid.
     * (сonsidering that the first day of the week is Monday)
     */
    const prevMonthExcerpt =
      firstWeekDay + 1 === 1
        ? prevMonthDates.slice(-6)
        : -firstWeekDay + 1 !== 0
        ? prevMonthDates.slice(-firstWeekDay + 1)
        : [];
    const nextMonthExcerpt = nextMonthDates.slice(0, 6 - lastWeekDay + 1);

    // resulting calendar dates for the selected month
    const totalMonthDates = [
      ...prevMonthExcerpt,
      ...currentMonthDates,
      ...nextMonthExcerpt,
    ];

    const fragment = new DocumentFragment();

    // Fill the fragment with the markup for calendar date cells
    totalMonthDates.forEach((dateCell, index) => {
      const isToday = dateCell.toDateString() === new Date(currentDate).toDateString();
      const calendarCellElem = createElement({
        tagName: "div",
        properties: { className: "calendar__cell" },
      });

      const isSelected =
        dateCell.getTime() === selectedDate.getTime() && state.uiState.isEventsOpen;

      const eventsCount = state.events.reduce((acc, cur) => {
        return new Date(cur.createdAt).toDateString() === dateCell.toDateString()
          ? acc + 1
          : acc;
      }, 0);

      /**
       * Check if the date belongs to the selected month
       * Handle the click if the date within the selected period.
       */
      if (
        index < prevMonthExcerpt.length ||
        index >= currentMonthDates.length + prevMonthExcerpt.length
      ) {
        calendarCellElem.classList.add("calendar__cell--out-of-range");
      } else {
        calendarCellElem.addEventListener("click", () => {
          state.uiState.selectedDate = dateCell;
          state.uiState.isEventsOpen = true;
        });
      }

      if (isToday) {
        calendarCellElem.classList.add("calendar__cell--today");
      }

      if (isSelected) {
        calendarCellElem.classList.add("calendar__cell--selected");
      }

      if (eventsCount > 0) {
        calendarCellElem.classList.add("calendar__cell--has-events");
      }

      calendarCellElem.innerHTML = `
        <p class="calendar__date">${dateCell.getDate()}</p>
        ${isToday ? '<p class="calendar__today-mark">Today</p>' : ""}
        <p class="calendar__events-count">Events: ${eventsCount}</p>
      `;

      fragment.append(calendarCellElem);
    });

    containerEl.append(fragment);
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
    const container = document.getElementById(containerId);
    container.classList.add("calendar");

    const elementsConfig = [
      { tagName: "div", properties: { className: "calendar__head" } },
      { tagName: "div", properties: { className: "calendar__grid" } },
      { tagName: "div", properties: { className: "calendar__events" } },
      { tagName: "div", properties: { className: "calendar__form" } },
      { tagName: "div", properties: { className: "calendar__legend" } },
      { tagName: "div", properties: { className: "calendar__modal" } },
    ];

    const [head, grid, events, form, legend, modal] = elementsConfig.map((config) =>
      createElement(config)
    );

    WEEK_DAY_MAP.forEach((dayName) => {
      const legendItem = createElement({
        tagName: "div",
        properties: { className: "calendar__legend-item", textContent: dayName },
      });
      legend.append(legendItem);
    });

    container.append(head, legend, grid, form, events, modal);

    return { head, grid, events, form, modal };
  };

  /**
   * This function triggers every time we reassign the
   * values of properties of the tracked object
   */
  const render = (containers) => {
    return function (path, value, prevValue) {
      switch (path) {
        case "events":
          storeData("events", this.events);
        case "uiState.selectedDate": {
          renderCalendarGrid(this, containers.grid);
          renderEvents(this, containers.events);
          break;
        }
        case "uiState.headerDate": {
          renderCalendarHead(this, containers.head);
          break;
        }
        case "uiState.isEventsOpen": {
          renderCalendarGrid(this, containers.grid);
          renderEventForm(this, containers.form);
          renderEvents(this, containers.events);
          break;
        }
        case "uiState.confirm": {
          renderConfirm({
            state: this,
            containerEl: containers.modal,
            onConfirm: (state) => {
              const { itemId } = state.uiState.confirm;
              state.events = state.events.filter((e) => e.id !== itemId);
            },
          });
          break;
        }
      }
    };
  };

  // prettier-ignore
  const MONTH_MAP = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", ];
  const WEEK_DAY_MAP = ["Mon", "Tur", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const initialState = {
    events: [],
    uiState: {
      isEventsOpen: false,
      currentDate: null,
      selectedDate: null,
      headerDate: null,
      confirm: {
        itemId: null,
        isVisible: false,
        text: null,
      },
    },
  };

  let storedEvents = [];

  try {
    storedEvents = JSON.parse(localStorage.getItem("events")) || [];
  } catch (e) {
    console.error(
      `An error occurred during the parsing of calendar data from Local Storage. ${e.message}`
    );
  }

  const containers = initLayout(containerId);
  const watchedState = onChange(initialState, render(containers));
  const todayDate = new Date();
  const todayMonth = MONTH_MAP[todayDate.getMonth()];
  const todayYear = todayDate.getFullYear();

  /**
   * initialising calendar values and fires first
   * rerendering of the app
   */
  watchedState.uiState.headerDate = `${todayMonth}, ${todayYear}`;
  watchedState.uiState.currentDate = todayDate;
  watchedState.uiState.selectedDate = new Date(todayDate);
  watchedState.events = storedEvents.reduce((acc, cur) => {
    try {
      const createdAt = new Date(cur.createdAt);
      if (createdAt instanceof Date && !isNaN(createdAt)) {
        return [...acc, { ...cur, createdAt }];
      }
      throw new Error(`Invalid date string format. Event id: ${cur.id}`);
    } catch (e) {
      console.error({
        message: e.message,
        stack: e.stack,
      });
    }

    return acc;
  }, []);
}

app("events-calendar");
