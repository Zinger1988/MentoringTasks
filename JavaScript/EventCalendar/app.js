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
  const MONTH_MAP = [
    "січ",
    "лют",
    "бер",
    "кві",
    "тра",
    "чер",
    "лип",
    "сер",
    "вер",
    "жов",
    "лис",
    "гру",
  ];

  const WEEK_DAY_MAP = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

  const initialState = {
    events: [],
    uiState: {
      isEventsOpen: false,
      currentDate: null,
      selectedDate: null,
    },
  };

  const containers = initLayout(containerId);
  const watchedState = onChange(initialState, render(containers));
  const currentDate = new Date(new Date().setHours(0, 0, 0, 0));

  watchedState.uiState.currentDate = currentDate;
  watchedState.uiState.selectedDate = new Date(currentDate);

  const storedEvents = JSON.parse(localStorage.getItem("calendar-events")) || [];
  watchedState.events = storedEvents.map((event) => ({
    ...event,
    createdAt: new Date(event.createdAt),
  }));

  /**
   * This function triggers every time we reassign the
   * values of properties of the tracked object
   */
  function render(containers) {
    return function (path, value, prevValue) {
      switch (path) {
        case "events":
          storeEvents(this);
        case "uiState.selectedDate": {
          renderCalendarHead(this, containers.head);
          renderCalendarGrid(this, containers.grid);
          renderEvents(this, containers.events);
          break;
        }

        case "uiState.isEventsOpen": {
          renderCalendarGrid(this, containers.grid);
          renderEvents(this, containers.events);
          break;
        }
      }
    };
  }

  function storeEvents(state) {
    localStorage.setItem("calendar-events", JSON.stringify(state.events));
  }

  function renderEvents(state, eventsEl) {
    const { isEventsOpen, selectedDate } = state.uiState;
    eventsEl.innerHTML = "";

    if (!isEventsOpen) {
      return;
    }

    // form creation and handling
    const eventFormEl = createElement("form", { className: "event-form" });
    const eventFormInputEl = createElement("input", {
      type: "text",
      name: "title",
      placeholder: "Event title",
      className: "event-new-title",
      required: true,
    });

    const eventFormTextEl = createElement("textarea", {
      name: "description",
      placeholder: "Event description",
      className: "event-new-description",
      required: true,
    });

    const newEventBtn = createElement("button", { textContent: "Add new event" });

    eventFormEl.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);
      const title = formData.get("title");
      const description = formData.get("description");

      watchedState.events = [
        ...watchedState.events,
        {
          id: uid(),
          title,
          description,
          createdAt: watchedState.uiState.selectedDate,
        },
      ];
    });

    // events list creation and handling
    const eventList = createElement("ul", { className: "calendar-event-list" });
    const events = state.events
      .filter((event) => event.createdAt.toDateString() === selectedDate.toDateString())
      .map((event) => {
        const eventItem = createElement("li", {
          className: "calendar-event-item",
          innerHTML: `<h3>${event.title}</h3><p>${event.description}</p>`,
        });

        const eventDelete = createElement("button", {
          className: "calendar-event-delete",
          textContent: "Delete event",
        });

        eventDelete.addEventListener("click", () => {
          state.events = state.events.filter((e) => e.id !== event.id);
        });

        eventItem.append(eventDelete);

        return eventItem;
      });

    if (events.length === 0) {
      const blankEventItem = createElement("li", {
        className: "calendar-event-item",
        innerHTML: `<p>No events have been created for this date yet</p>`,
      });
      eventList.append(blankEventItem);
    }

    eventFormEl.append(eventFormInputEl, eventFormTextEl, newEventBtn);
    eventList.append(...events);
    eventsEl.append(eventFormEl, eventList);
  }

  /**
   * This function creates, configure
   * and returns main layout containers of app
   */
  function renderCalendarHead(state, calendarHeadEl) {
    calendarHeadEl.innerHTML = "";

    const calendarTitleEl = createElement("div", { className: "calendar-title" });
    const nextMonthBtn = createElement("button", { textContent: "Next Month" });
    const prevMonthBtn = createElement("button", { textContent: "Prev Month" });

    nextMonthBtn.addEventListener("click", () => {
      const { selectedDate } = state.uiState;

      state.uiState.selectedDate = new Date(
        selectedDate.setMonth(state.uiState.selectedDate.getMonth() + 1)
      );

      state.uiState.isEventsOpen = false;
    });

    prevMonthBtn.addEventListener("click", () => {
      const { selectedDate, currentDate } = state.uiState;

      if (selectedDate > currentDate) {
        state.uiState.selectedDate = new Date(
          selectedDate.setMonth(selectedDate.getMonth() - 1)
        );

        state.uiState.isEventsOpen = false;
      }
    });

    const { selectedDate } = state.uiState;

    calendarTitleEl.textContent = `
      ${MONTH_MAP[selectedDate.getMonth()]},
      ${selectedDate.getFullYear()}
    `;

    calendarHeadEl.append(prevMonthBtn, calendarTitleEl, nextMonthBtn);
  }

  /** This function creates array of month dates (from 1st to last) */
  function createMonthDates(year, month) {
    const lastDate = new Date(year, month + 1, 0).getDate();

    return Array(lastDate)
      .fill(null)
      .map((date, index) => new Date(year, month, index + 1));
  }

  /** this function creates and configure calendar grid */
  function renderCalendarGrid(state, container) {
    container.innerHTML = "";
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
      const calendarCellElem = createElement("div", { className: "calendar-cell" });

      /**
       * Check if the date belongs to the selected month
       * Handle the click if the date within the selected period.
       */
      if (
        index < prevMonthExcerpt.length ||
        index >= currentMonthDates.length + prevMonthExcerpt.length
      ) {
        calendarCellElem.classList.add("calendar-cell--out-of-range");
      } else {
        calendarCellElem.addEventListener("click", () => {
          watchedState.uiState.selectedDate = dateCell;
          watchedState.uiState.isEventsOpen = true;
        });
      }

      // Check if the date is today's date
      if (dateCell.getTime() === currentDate.getTime()) {
        calendarCellElem.classList.add("calendar-cell--today");
      }

      // Check if the date is currently selected
      if (dateCell.getTime() === selectedDate.getTime() && state.uiState.isEventsOpen) {
        calendarCellElem.classList.add("calendar-cell--selected");
      }

      // Calculate the number of events for this date
      const eventsCount = state.events.reduce((acc, cur) => {
        return cur.createdAt.toDateString() === dateCell.toDateString() ? acc + 1 : acc;
      }, 0);

      calendarCellElem.innerHTML = `<b>${dateCell.getDate()}</b><div><i>Events: ${eventsCount}</i></div>`;

      fragment.append(calendarCellElem);
    });

    container.append(fragment);
  }

  /** this function creates, configure and returns main layout containers */
  function initLayout(containerId) {
    const container = document.getElementById(containerId);
    container.classList.add("calendar");

    const head = createElement("div", { className: "calendar-head" });
    const grid = createElement("div", { className: "calendar-grid" });
    const events = createElement("div", { className: "calendar-events" });
    const legend = createElement("div", { className: "calendar-legend" });

    WEEK_DAY_MAP.forEach((dayName) => {
      const legendItem = createElement("div", {
        className: "calendar-legend-item",
        textContent: dayName,
      });
      legend.append(legendItem);
    });

    container.append(head, legend, grid, events);

    return {
      head,
      grid,
      events,
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

app("events-calendar");
