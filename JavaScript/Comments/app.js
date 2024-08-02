import onChange from "https://cdn.jsdelivr.net/npm/on-change@5.0.1/+esm";
import { uid } from "https://cdn.jsdelivr.net/npm/uid@2.0.2/+esm";

/**
 * Завдання 4:
 * Створіть динамічну систему коментарів для блогу з можливістю:
 *
 * Додавання нових коментарів через форму.
 * Відповіді на коментарі (вкладені коментарі).
 * Видалення коментарів.
 * Відображення часу додавання коментаря.
 *
 * Вимоги:
 * Використовуйте методи document.createElement, appendChild, addEventListener для створення елементів системи коментарів та управління ними.
 * Забезпечте динамічне оновлення списку коментарів при додаванні, відповіді та видаленні.
 * Зберігайте коментарі в LocalStorage, щоб вони зберігались між перезавантаженнями сторінки.
 *
 * Підказка:
 * Створіть структуру системи коментарів з використанням HTML-елементів ul та li.
 * Додайте форми для додавання та відповіді на коментарі, а також кнопку для видалення коментарів.
 *
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

  /**
   * this function appends comments list into DOM
   */
  const renderCommentsList = (state, containerEl) => {
    containerEl.innerHTML = "";
    const { comments } = state;

    const rootComments = comments.filter((comment) => !comment.asReplyFor);

    const commentsWithReplies = rootComments
      .map((comment) => {
        const replies = comments
          .filter((c) => c.asReplyFor === comment.id)
          .sort((a, b) => b.createdAt - a.createdAt);
        return { ...comment, replies };
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    const commentsListEl = createCommentsList(state, commentsWithReplies);

    containerEl.append(commentsListEl);
  };

  /**
   * this function creates, configure and returns comments list
   * but NOT appends it to DOM
   */
  const createCommentsList = (state, comments) => {
    const listEl = createElement({ tagName: "ul" });

    const commentsCollectionEl = comments.map((comment) => {
      const listItemEl = createElement({ tagName: "li" });
      const commentEl = createSingleComment(state, comment);
      const hasReplies = comment.replies ?? false;

      listItemEl.append(commentEl);

      if (hasReplies && hasReplies.length !== 0) {
        const replies = createCommentsList(state, comment.replies);
        listItemEl.append(replies);
      }

      return listItemEl;
    });

    listEl.append(...commentsCollectionEl);
    return listEl;
  };

  /**
   * this function creates, configure and returns comment card
   * but NOT appends it to DOM
   */
  const createSingleComment = (state, commentData) => {
    // prettier-ignore
    const elementsConfig = [
      {
        tagName: "article",
        properties: { className: commentData.asReplyFor ? "comment-card comments__card comment-card--reply" : "comment-card comments__card" },
      },
      {
        tagName: "h3",
        properties: { className: "comment-card__author", textContent: commentData.author },
      },
      {
        tagName: "time",
        properties: { className: "comment-card__publish-date", textContent: new Date(commentData.createdAt).toLocaleString() },
      },
      {
        tagName: "div",
        properties: { className: "comment-card__text", textContent: commentData.comment },
      },
      {
        tagName: "button",
        properties: { className: "btn btn--yellow btn--small comment-card__btn", textContent: "Add reply" },
        attributes: { "aria-label": "Add reply" }
      },
      {
        tagName: "button",
        properties: { className: "btn btn--small comment-card__btn", textContent: "Delete" },
        attributes: { "aria-label": "Delete" }
      },
    ];

    const [cardEl, authorEl, timeEl, commentEl, submitBtn, deleteBtn] =
      elementsConfig.map((config) => createElement(config));

    submitBtn.addEventListener("click", () => {
      state.uiState.commentReplyId = commentData.id;
    });

    deleteBtn.addEventListener("click", () => {
      state.uiState.confirm = {
        itemId: commentData.id,
        isVisible: true,
        text: `Are you sure you want to delete this ${
          commentData.asReplyFor ? "reply" : "comment"
        }?`,
      };
    });

    cardEl.append(authorEl, timeEl, commentEl, deleteBtn);

    commentData.asReplyFor
      ? cardEl.append(deleteBtn)
      : cardEl.append(submitBtn, deleteBtn);

    if (state.uiState.commentReplyId === commentData.id) {
      const replyFormEl = createNewReplyForm(state);
      cardEl.append(replyFormEl);
    }

    return cardEl;
  };

  /**
   * this function creates, configure and returns reply form
   * but NOT appends it to DOM
   */
  const createNewReplyForm = (state) => {
    // prettier-ignore
    const elementsConfig = [
      {
        tagName: "form",
        properties: { className: "reply-form comment-card__reply" },
      },
      {
        tagName: "input",
        properties: { type: "text", name: "author", className: "input-text", required: true, placeholder: "Your name" },
      },
      {
        tagName: "textarea",
        properties: { name: "comment", className: "textarea", required: true, placeholder: "Leave your reply here..." },
      },
      {
        tagName: "button",
        properties: { className: "btn btn--yellow", textContent: "Send reply", type: "submit" },
        attributes: { "aria-label": "Send reply" }
      },
      {
        tagName: "button",
        properties: { className: "btn", textContent: "Cancel", type: "reset" },
        attributes: { "aria-label": "Cancel" }
      },
    ];

    const [formEl, authorEl, descriptionEl, submitBtn, cancelBtn] = elementsConfig.map(
      (config) => createElement(config)
    );

    formEl.append(authorEl, descriptionEl, submitBtn, cancelBtn);

    formEl.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);
      const author = formData.get("author");
      const comment = formData.get("comment");
      const createdAt = new Date();

      const isValid = [author, comment].every((field) => field && field?.trim());

      if (!isValid) {
        e.target.reset();
        throw new Error("Invalid reply form data");
      }

      state.comments.push({
        id: uid(),
        createdAt: String(createdAt),
        asReplyFor: state.uiState.commentReplyId,
        author,
        comment,
      });
      e.target.reset();
    });

    formEl.addEventListener("reset", (e) => {
      e.preventDefault();
      state.uiState.commentReplyId = null;
    });

    return formEl;
  };

  /** this function creates and configure footer (add form) */
  const renderNewCommentForm = (state, containerEl) => {
    containerEl.innerHTML = "";

    // prettier-ignore
    const elementsConfig = [
      {
        tagName: "form",
        properties: { className: "add-form" },
      },
      {
        tagName: "input",
        properties: { type: "text", name: "author", className: "input-text input-text--white", required: true, placeholder: "Your name" },
      },
      {
        tagName: "textarea",
        properties: { name: "comment", className: "textarea textarea--white", required: true, placeholder: "Leave your comment here..." },
      },
      {
        tagName: "button",
        properties: { className: "btn btn--large btn--white", textContent: "Add comment", type: "submit" },
        attributes: { "aria-label": "Add comment" }
      },
    ];

    const [formEl, authorEl, commentEl, submitBtn] = elementsConfig.map((config) =>
      createElement(config)
    );

    formEl.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);
      const author = formData.get("author");
      const comment = formData.get("comment");
      const createdAt = new Date();

      const isValid = [author, comment].every((field) => field && field?.trim());

      if (!isValid) {
        e.target.reset();
        throw new Error("Invalid comment form data");
      }

      state.comments.push({
        id: uid(),
        createdAt,
        asReplyFor: null,
        author,
        comment,
      });
    });

    formEl.append(authorEl, commentEl, submitBtn);
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
    wrapper.classList.add("comments");

    // prettier-ignore
    const elementsConfig = [
      { tagName: "div", properties: { className: "comments__form" }},
      { tagName: "div", properties: { className: "comments__list" }},
      { tagName: "div", properties: { className: "comments__modal" }}
    ];

    const [form, list, modal] = elementsConfig.map((config) => createElement(config));

    wrapper.append(form, list, modal);

    return { form, list, modal };
  };

  /**
   * This function triggers every time we reassign the
   * values of properties of the tracked object
   */
  const render = (containers) => {
    return function (path, value, prevValue) {
      switch (path) {
        case "comments": {
          storeData("comments", this.comments);
        }
        case "uiState.commentReplyId": {
          renderCommentsList(this, containers.list);
          renderNewCommentForm(this, containers.form);
          break;
        }
        case "uiState.confirm": {
          renderConfirm({
            state: this,
            containerEl: containers.modal,
            onConfirm: (state) => {
              const { itemId } = state.uiState.confirm;
              state.comments = state.comments
                .filter((c) => {
                  return itemId !== c.id;
                })
                .filter((c) => {
                  return itemId !== c.asReplyFor;
                });
            },
          });
          break;
        }
      }
    };
  };

  const initialState = {
    comments: [],
    uiState: {
      commentReplyId: null,
      confirm: {
        itemId: null,
        isVisible: false,
        text: null,
      },
    },
  };

  let storedComments = [];

  try {
    storedComments = JSON.parse(localStorage.getItem("comments")) || [];
  } catch (e) {
    console.error(
      `An error occurred during the parsing of comments data from Local Storage. ${e.message}`
    );
  }

  const containers = initLayout(containerId);

  // initialising comments and fires first rerendering of the app
  const watchedState = onChange(initialState, render(containers));
  watchedState.comments = storedComments.reduce((acc, cur) => {
    try {
      const createdAt = new Date(cur.createdAt);
      if (createdAt instanceof Date && !isNaN(createdAt)) {
        return [...acc, { ...cur, createdAt }];
      }
      throw new Error(`Invalid date string format. Comment id: ${cur.id}`);
    } catch (e) {
      console.error({
        message: e.message,
        stack: e.stack,
      });
    }

    return acc;
  }, []);
}

app("comments");
