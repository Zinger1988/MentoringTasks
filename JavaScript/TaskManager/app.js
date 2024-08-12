import { uid } from "https://cdn.jsdelivr.net/npm/uid@2.0.2/+esm";

class Task {
  constructor({ title, description, status, priority, callbacks = {} }) {
    this.id = uid();
    this.title = title;
    this.description = description;
    this.callbacks = { ...callbacks };
    this.options = {
      status: {
        value: null,
        variants: ["new", "in process", "completed"],
      },
      priority: {
        value: null,
        variants: ["low", "medium", "high"],
      },
    };
    this.elements = {
      container: document.createElement("article"),
      title: document.createElement("h2"),
      description: document.createElement("p"),
      priority: {
        wrapper: document.createElement("div"),
        valueContainer: document.createElement("div"),
        increaseBtn: document.createElement("button"),
        decreaseBtn: document.createElement("button"),
      },
      status: {
        wrapper: document.createElement("div"),
        buttons: [],
      },
    };
    this.callbacks = { ...callbacks };

    this.#init(status, priority);
  }

  #init(initialStatus = "new", initialPriority = "medium") {
    const { container, title, description, priority, status } = this.elements;
    const { wrapper: statusWrapper, buttons: statusButtons } = status;
    const {
      wrapper: priorityWrapper,
      valueContainer,
      increaseBtn,
      decreaseBtn,
    } = priority;

    // title
    title.textContent = this.title;
    title.classList.add("task__title");

    // description
    description.textContent = this.description;
    description.classList.add("task__description");

    // status
    statusWrapper.classList.add("task__status");

    this.options.status.variants.map((option) => {
      const statusBtn = document.createElement("button");
      statusBtn.classList.add("btn", "task__status-btn");
      statusBtn.setAttribute("aria-label", option);
      statusBtn.textContent = option;

      statusButtons.push(statusBtn);
    });

    statusWrapper.append(...statusButtons);

    // priority
    priorityWrapper.classList.add("task__priority");
    valueContainer.classList.add("task__priority-value");

    increaseBtn.classList.add(
      "btn",
      "btn--small",
      "task__priority-btn",
      "task__priority-increase"
    );
    increaseBtn.setAttribute("aria-label", "increase priority");
    increaseBtn.textContent = "increase";

    decreaseBtn.classList.add(
      "btn",
      "btn--small",
      "task__priority-btn",
      "task__priority-decrease"
    );
    decreaseBtn.setAttribute("aria-label", "decrease priority");
    decreaseBtn.textContent = "decrease";

    priorityWrapper.append(decreaseBtn, valueContainer, increaseBtn);

    // main container
    container.append(title, description, priorityWrapper, statusWrapper);
    container.classList.add("task");

    this.updateStatus(initialStatus);
    this.#handleStatus();
    this.updatePriority(initialPriority);
    this.#handlePriority();
  }

  #handleStatus() {
    const { wrapper } = this.elements.status;
    wrapper.addEventListener("click", (e) => {
      if (e.target.classList.contains("task__status-btn")) {
        const statusAttr = e.target.getAttribute("aria-label");
        this.updateStatus(statusAttr);
      }
    });
  }

  updateStatus(newValue) {
    this.options.status.value = newValue;
    this.elements.status.buttons.forEach((btn) => {
      const btnStatusAttr = btn.getAttribute("aria-label");
      if (btnStatusAttr === newValue) {
        btn.classList.add("btn--yellow");
      } else {
        btn.classList.remove("btn--yellow");
      }
    });

    if (typeof this.callbacks.onUpdateStatus === "function") {
      this.callbacks.onUpdateStatus(this);
    }
  }

  #handlePriority() {
    const { variants } = this.options.priority;
    const { increaseBtn, decreaseBtn } = this.elements.priority;

    increaseBtn.addEventListener("click", () => {
      const currentIndex = variants.indexOf(this.options.priority.value);
      const nextPriority = variants[currentIndex + 1];
      nextPriority && this.updatePriority(nextPriority);
    });

    decreaseBtn.addEventListener("click", () => {
      const currentIndex = variants.indexOf(this.options.priority.value);
      const prevPriority = variants[currentIndex - 1];
      prevPriority && this.updatePriority(prevPriority);
    });
  }

  updatePriority(newValue) {
    const { variants, value } = this.options.priority;
    const { wrapper, valueContainer, increaseBtn, decreaseBtn } = this.elements.priority;

    wrapper.classList.remove(`task__priority--${value}`);

    this.options.priority.value = newValue;
    const newIndex = variants.indexOf(newValue);
    valueContainer.textContent = newValue;

    wrapper.classList.add(`task__priority--${newValue}`);

    newIndex <= 0
      ? decreaseBtn.classList.add("btn--disabled")
      : decreaseBtn.classList.remove("btn--disabled");

    newIndex >= variants.length - 1
      ? increaseBtn.classList.add("btn--disabled")
      : increaseBtn.classList.remove("btn--disabled");

    if (typeof this.callbacks.onUpdatePriority === "function") {
      this.callbacks.onUpdatePriority(this);
    }
  }
}

class TaskManager {
  constructor({ rootSelector }) {
    this.tasks = [];
    this.elements = {
      container: document.createElement("section"),
      filterPanel: document.createElement("aside"),
      sortPanel: document.createElement("div"),
      tasksContainer: document.createElement("div"),
      taskList: document.createElement("ul"),
      formContainer: document.createElement("div"),
      form: document.createElement("form"),
    };
    this.sortOrder = "default";
    this.filters = {};

    this.#init(rootSelector);
  }

  #init(rootSelector) {
    const rootElement = document.querySelector(rootSelector);
    const {
      container,
      filterPanel,
      sortPanel,
      taskList,
      tasksContainer,
      formContainer,
      form,
    } = this.elements;

    if (rootElement === null) {
      console.error("Unable to find root selector");
      return;
    }

    container.classList.add("task-manager");
    tasksContainer.classList.add("task-manager__main");
    taskList.classList.add("task-manager__list");

    sortPanel.classList.add("task-manager__sort", "sort");
    sortPanel.addEventListener("click", this.#handleSortPanel.bind(this));

    filterPanel.classList.add("task-manager__filters", "filters");
    filterPanel.addEventListener("click", this.#handleFilterPanel.bind(this));

    formContainer.classList.add("task-manager__form");
    form.classList.add("form");
    form.addEventListener("submit", this.#handleForm.bind(this));

    tasksContainer.append(taskList, form);
    container.append(sortPanel, filterPanel, tasksContainer, formContainer);
    rootElement.append(container);

    this.#renderForm();
    this.#renderSortPanel();

    this.#initTasks();
    this.#initFilters();

    this.#renderTasks();
    this.#renderFilterPanel();
  }

  #initTasks() {
    this.tasks = this.#getStoredTasks();
    this.tasks = this.tasks.map((task) => {
      // prettier-ignore
      const instance = new Task(task);
      instance.callbacks.onUpdateStatus = () => {
        this.#storeTasks();
        this.#renderTasks();
      };
      instance.callbacks.onUpdatePriority = () => {
        this.#storeTasks();
        this.#renderTasks();
      };

      return instance;
    });
  }

  #renderTasks() {
    this.elements.taskList.innerHTML = "";

    // prettier-ignore
    /** Checking if the applied filters exist */
    const hasActiveFilters = Object
      .values(this.filters)
		  .some((filter) => {
			  return Object.values(filter).some((filterName) => filterName);
		  });

    let resultingTasks =
      this.sortOrder !== "default" ? this.#applyPrioritySort() : this.tasks;

    resultingTasks = hasActiveFilters ? this.#applyFilters() : resultingTasks;

    const listItems = resultingTasks.map((task) => {
      const listItem = document.createElement("li");
      listItem.classList.add("task-manager__list-item");
      listItem.append(task.elements.container);

      const deleteBtn = document.createElement("button");
      deleteBtn.classList.add("btn", "btn--grey", "task__delete");
      deleteBtn.setAttribute("aria-label", "delete");
      deleteBtn.textContent = "Delete task";

      deleteBtn.addEventListener("click", this.removeTask.bind(this, task.id));

      task.elements.container.append(deleteBtn);

      return listItem;
    });

    this.elements.taskList.append(...listItems);
  }

  #initFilters() {
    this.filters = {};

    this.tasks = this.tasks.map((task) => {
      // prettier-ignore
      /**
       * Calculating the available options and their values
       * for applying them to the filter panel
       */

      Object.keys(task.options).forEach((key) => {
        if (!this.filters[key]) {
          this.filters[key] = {};
        }

        task.options[key].variants.forEach((optName) => {
          this.filters[key][optName] = false;
        });
      });

      return task;
    });
  }

  #renderFilterPanel() {
    this.elements.filterPanel.innerHTML = "";

    const filterEntries = Object.entries(this.filters);
    const filterGroups = filterEntries.map(([filterKey, values]) => {
      const filtersGroup = document.createElement("div");
      filtersGroup.classList.add("filters__group");

      const filterTitle = document.createElement("h3");
      filterTitle.classList.add("filters__title");
      filterTitle.textContent = filterKey;

      const filterItems = [];

      for (let key in values) {
        const filterLabel = document.createElement("div");
        filterLabel.classList.add("filters__item");
        filterLabel.setAttribute("for", key.replace(" ", "_"));

        const filterName = document.createElement("span");
        filterName.classList.add("filters__name");
        filterName.textContent = key;

        const filterControl = document.createElement("input");
        filterControl.classList.add("filters__control");
        filterControl.type = "checkbox";
        filterControl.checked = values[key];
        filterControl.name = key;
        filterControl.id = key.replace(" ", "_");
        filterControl.setAttribute("data-filter", filterKey);

        filterLabel.append(filterControl, filterName);
        filterItems.push(filterLabel);
      }

      filtersGroup.append(filterTitle, ...filterItems);

      return filtersGroup;
    });

    this.elements.filterPanel.append(...filterGroups);
  }

  #applyFilters() {
    /**
     * Calculating the names of the filters that have
     * been applied
     */
    const activeFilters = Object.entries(this.filters).reduce((acc, entry) => {
      const [filterName, variants] = entry;
      const truthyVariants = Object.entries(variants).reduce((acc, entry) => {
        const [variantName, variantValue] = entry;
        return variantValue ? [...acc, variantName] : acc;
      }, []);
      acc[filterName] = truthyVariants;
      return acc;
    }, {});

    /**
     * Calculating the intersection between the applied filters
     * and the current value of the option in the task
     */
    const filterCriteria = Object.entries(activeFilters)
      .filter(([_, values]) => values.length > 0) // тут відкинемо фільтри
      .map(
        ([name, values]) =>
          (task) =>
            values.includes(task.options[name].value)
      );

    const result = this.tasks.filter((task) =>
      filterCriteria.every((criteria) => criteria(task))
    );

    return result;
  }

  #handleFilterPanel(e) {
    const filterLabel = e.target.classList.contains("filters__item")
      ? e.target
      : e.target.closest(".filters__item");

    if (filterLabel) {
      const filterControl = filterLabel.querySelector(
        `#${filterLabel.getAttribute("for")}`
      );

      const filterName = filterControl.dataset.filter;
      const currentFilterValue = this.filters[filterName][filterControl.name];
      this.filters[filterName][filterControl.name] = !currentFilterValue;
      filterControl.checked = !currentFilterValue;

      this.#renderTasks();
    }
  }

  #renderSortPanel() {
    const ascendingBtn = document.createElement("button");
    ascendingBtn.classList.add("btn", "btn--small", "sort__btn");
    ascendingBtn.textContent = "Ascending priority";
    ascendingBtn.setAttribute("data-sort", "ascending");
    ascendingBtn.setAttribute("aria-label", "Sort by ascending priority");

    const descendingBtn = document.createElement("button");
    descendingBtn.classList.add("btn", "btn--small", "sort__btn");
    descendingBtn.textContent = "Descending priority";
    descendingBtn.setAttribute("data-sort", "descending");
    descendingBtn.setAttribute("aria-label", "Sort by descending priority");

    const defaultBtn = document.createElement("button");
    defaultBtn.classList.add("btn", "btn--small", "btn--yellow", "sort__btn");
    defaultBtn.textContent = "Default";
    defaultBtn.setAttribute("data-sort", "default");
    defaultBtn.setAttribute("aria-label", "Sort by default");

    const prefix = document.createElement("span");
    prefix.classList.add("sort__prefix");
    prefix.textContent = "Sort by:";

    this.elements.sortPanel.append(prefix, defaultBtn, ascendingBtn, descendingBtn);
  }

  #applyPrioritySort() {
    const sortedTasks = [...this.tasks].sort((taskA, taskB) => {
      const priorityA = taskA.options.priority.value;
      const priorityIndexA = taskA.options.priority.variants.indexOf(priorityA);

      const priorityB = taskB.options.priority.value;
      const priorityIndexB = taskB.options.priority.variants.indexOf(priorityB);

      return (
        (priorityIndexA - priorityIndexB) * (this.sortOrder === "ascending" ? 1 : -1)
      );

      return sortedTasks;
    });

    return sortedTasks;
  }

  #handleSortPanel(e) {
    if (e.target.classList.contains("sort__btn")) {
      const sortButtons = e.currentTarget.querySelectorAll(".sort__btn");
      sortButtons.forEach((btn) => btn.classList.remove("btn--yellow"));
      e.target.classList.add("btn--yellow");
      this.sortOrder = e.target.dataset.sort;

      this.#renderTasks();
    }
  }

  #renderForm() {
    const { form } = this.elements;

    const input = document.createElement("input");
    input.classList.add("input-text", "input-text--white");
    input.name = "title";
    input.required = "true";
    input.placeholder = "Task title";
    input.type = "text";

    const textarea = document.createElement("textarea");
    textarea.classList.add("textarea", "textarea--white");
    textarea.name = "description";
    textarea.required = "true";
    textarea.placeholder = "Task title";

    const submitBtn = document.createElement("button");
    submitBtn.classList.add("btn", "btn--large", "btn--white");
    submitBtn.type = "submit";
    submitBtn.textContent = "Add new task";
    submitBtn.setAttribute("aria-label", "Add new task");

    form.append(input, textarea, submitBtn);
  }

  #getStoredTasks() {
    let tasks;
    try {
      tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    } catch (e) {
      console.error(
        `An error occurred during the parsing of tasks data from Local Storage. ${e.message}`
      );
    }

    return tasks;
  }

  #storeTasks() {
    const tasksForStorage = this.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.options.priority.value,
      status: task.options.status.value,
    }));

    localStorage.setItem("tasks", JSON.stringify(tasksForStorage));
  }

  #handleForm(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const title = formData.get("title");
    const description = formData.get("description");

    const isValid = [title, description].every((field) => field && field?.trim());

    if (!isValid) {
      e.target.reset();
      throw new Error("Invalid task form data");
    }

    e.target.reset();

    this.addTask({ title, description });
  }

  addTask(task) {
    const instance = new Task(task);
    instance.callbacks.onUpdateStatus = () => {
      this.#storeTasks();
      this.#renderTasks();
    };
    instance.callbacks.onUpdatePriority = () => {
      this.#storeTasks();
      this.#renderTasks();
    };

    this.tasks.push(instance);
    this.#storeTasks();
    this.#renderTasks();
    this.#initFilters();
    this.#renderFilterPanel();
  }

  removeTask(id) {
    this.tasks = this.tasks.filter((task) => task.id !== id);
    this.#storeTasks();
    this.#renderTasks();
    this.#initFilters();
    this.#renderFilterPanel();
  }
}

new TaskManager({
  rootSelector: "#root",
});
