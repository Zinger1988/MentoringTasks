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
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const WEEK_DAY_MAP = ["Mon", "Tur", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
  const storedEvents = JSON.parse(localStorage.getItem("events")) || [];

  /**
   * initialising calendar values and fires first
   * rerendering of the app
   */
  watchedState.uiState.currentDate = currentDate;
  watchedState.uiState.selectedDate = new Date(currentDate);
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
          storeData("events", this.events);
        case "uiState.selectedDate": {
          renderCalendarHead(this, containers.head);
          renderCalendarGrid(this, containers.grid);
          renderEvents(this, containers.events);
          break;
        }
        case "uiState.isEventsOpen": {
          renderCalendarGrid(this, containers.grid);
          renderEventForm(this, containers.form);
          renderEvents(this, containers.events);
          break;
        }
      }
    };
  }

  function storeData(propName, data) {
    localStorage.setItem(propName, JSON.stringify(data));
  }

  function renderEventForm(state, containerEl) {
    const { isEventsOpen } = state.uiState;
    containerEl.innerHTML = "";

    if (!isEventsOpen) {
      return;
    }

    const elementsConfig = [
      {
        tagName: "form",
        options: { className: "add-form" },
      },
      {
        tagName: "input",
        options: {
          type: "text",
          name: "title",
          placeholder: "Event title",
          className: "input-text input-text--white",
          required: true,
        },
      },
      {
        tagName: "textarea",
        options: {
          name: "description",
          placeholder: "Event description",
          className: "textarea textarea--white",
          required: true,
        },
      },
      {
        tagName: "button",
        options: {
          textContent: "Add new event",
          className: "btn btn--white btn--large",
        },
      },
    ];

    const [eventFormEl, eventFormInputEl, eventFormTextEl, newEventBtn] =
      elementsConfig.map(({ tagName, options }) => createElement(tagName, options));

    eventFormEl.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);
      const title = formData.get("title");
      const description = formData.get("description");

      state.events = [
        ...watchedState.events,
        {
          id: uid(),
          title,
          description,
          createdAt: watchedState.uiState.selectedDate,
        },
      ];

      e.target.reset();
    });

    eventFormEl.append(eventFormInputEl, eventFormTextEl, newEventBtn);
    containerEl.append(eventFormEl);
  }

  function renderEvents(state, containerEl) {
    const { isEventsOpen, selectedDate } = state.uiState;
    containerEl.innerHTML = "";

    if (!isEventsOpen) {
      return;
    }

    // events list creation and handling
    const eventListEl = createElement("ul", { className: "calendar__event-list" });
    const events = state.events
      .filter((event) => event.createdAt.toDateString() === selectedDate.toDateString())
      .map((event) => {
        const elementsConfig = [
          {
            tagName: "li",
            options: { className: "calendar__list-item" },
          },
          {
            tagName: "article",
            options: {
              className: "event-card calendar__event-card",
            },
          },
          {
            tagName: "h3",
            options: {
              className: "event-card__title",
              textContent: event.title,
            },
          },
          {
            tagName: "p",
            options: {
              className: "event-card__desc",
              textContent: event.description,
            },
          },
          {
            tagName: "button",
            options: {
              className: "btn btn--grey btn--small",
              textContent: "Delete event",
            },
          },
        ];

        const [
          eventListItemEl,
          eventCardEl,
          eventCardTitleEl,
          eventCardDescEl,
          eventDeleteBtn,
        ] = elementsConfig.map(({ tagName, options }) => createElement(tagName, options));

        eventDeleteBtn.addEventListener("click", () => {
          state.events = state.events.filter((e) => e.id !== event.id);
        });

        eventCardEl.append(eventCardTitleEl, eventCardDescEl, eventDeleteBtn);
        eventListItemEl.append(eventCardEl);

        return eventListItemEl;
      });

    if (events.length === 0) {
      const blankEventItem = createElement("li", {
        className: "calendar__blank-event",
        innerHTML: `<p>No events have been created for this date yet</p>`,
      });
      eventListEl.append(blankEventItem);
    }

    eventListEl.append(...events);
    containerEl.append(eventListEl);
  }

  /**
   * This function creates, configure
   * and returns main layout containers of app
   */
  function renderCalendarHead(state, containerEL) {
    containerEL.innerHTML = "";

    const elementsConfig = [
      {
        tagName: "div",
        options: { className: "calendar-title" },
      },
      {
        tagName: "button",
        options: {
          textContent: "Next Month",
          className: "btn btn--small btn--yellow",
        },
      },
      {
        tagName: "button",
        options: {
          textContent: "Prev Month",
          className: "btn btn--small btn--yellow",
        },
      },
    ];

    const [calendarTitleEl, nextMonthBtn, prevMonthBtn] = elementsConfig.map(
      ({ tagName, options }) => createElement(tagName, options)
    );

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

    containerEL.append(prevMonthBtn, calendarTitleEl, nextMonthBtn);
  }

  /** This function creates array of month dates (from 1st to last) */
  function createMonthDates(year, month) {
    const lastDate = new Date(year, month + 1, 0).getDate();

    return Array(lastDate)
      .fill(null)
      .map((date, index) => new Date(year, month, index + 1));
  }

  /** this function creates and configure calendar grid */
  function renderCalendarGrid(state, containerEl) {
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
      const calendarCellElem = createElement("div", { className: "calendar__cell" });
      const isToday = dateCell.getTime() === currentDate.getTime();

      const isSelected =
        dateCell.getTime() === selectedDate.getTime() && state.uiState.isEventsOpen;

      const eventsCount = state.events.reduce((acc, cur) => {
        return cur.createdAt.toDateString() === dateCell.toDateString() ? acc + 1 : acc;
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
          watchedState.uiState.selectedDate = dateCell;
          watchedState.uiState.isEventsOpen = true;
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
  }

  /** this function creates, configure and returns main layout containers */
  function initLayout(containerId) {
    const container = document.getElementById(containerId);
    container.classList.add("calendar");

    const elementsConfig = [
      { tagName: "div", options: { className: "calendar__head" } },
      { tagName: "div", options: { className: "calendar__grid" } },
      { tagName: "div", options: { className: "calendar__events" } },
      { tagName: "div", options: { className: "calendar__form" } },
      { tagName: "div", options: { className: "calendar__legend" } },
    ];

    const [head, grid, events, form, legend] = elementsConfig.map(
      ({ tagName, options }) => createElement(tagName, options)
    );

    WEEK_DAY_MAP.forEach((dayName) => {
      const legendItem = createElement("div", {
        className: "calendar__legend-item",
        textContent: dayName,
      });
      legend.append(legendItem);
    });

    container.append(head, legend, grid, form, events);

    return {
      head,
      grid,
      events,
      form,
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

app("events-calendar");
