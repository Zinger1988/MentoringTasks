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
  const initialState = {
    comments: [],
    uiState: {
      commentReplyId: null,
    },
  };

  const containers = initLayout(containerId);
  const watchedState = onChange(initialState, render(containers));
  const storedComments = JSON.parse(localStorage.getItem("comments")) || [];

  // initialising comments and fires first rerendering of the app
  watchedState.comments = storedComments.map((item) => ({
    ...item,
    createdAt: new Date(item.createdAt),
  }));

  /**
   * This function triggers every time we reassign the
   * values of properties of the tracked object
   */
  function render(containers) {
    return function (path, value, prevValue) {
      switch (path) {
        case "comments": {
          storeData("comments", this.comments);
        }
        case "uiState.commentReplyId": {
          renderCommentsList(this, containers.list);
          renderNewCommentForm(this, containers.form);
        }
      }
    };
  }

  /**
   * this function appends comments list into DOM
   */
  function renderCommentsList(state, containerEl) {
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
  }

  /**
   * this function creates, configure and returns comments list
   * but NOT appends it to DOM
   */
  function createCommentsList(state, comments) {
    const listEl = createElement("ul");

    const commentsCollectionEl = comments.map((comment) => {
      const listItemEl = createElement("li");
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
  }

  /**
   * this function creates, configure and returns comment card
   * but NOT appends it to DOM
   */
  function createSingleComment(state, commentData) {
    const elementsConfig = [
      {
        tagName: "article",
        options: {
          className: commentData.asReplyFor
            ? "comment-card comments__card comment-card--reply"
            : "comment-card comments__card",
        },
      },
      {
        tagName: "h3",
        options: {
          className: "comment-card__author",
          textContent: commentData.author,
        },
      },
      {
        tagName: "time",
        options: {
          className: "comment-card__publish-date",
          textContent: new Date(commentData.createdAt).toLocaleString(),
        },
      },
      {
        tagName: "div",
        options: {
          className: "comment-card__text",
          textContent: commentData.comment,
        },
      },
      {
        tagName: "button",
        options: {
          className: "btn btn--yellow btn--small comment-card__btn",
          textContent: "Add reply",
        },
      },
      {
        tagName: "button",
        options: {
          className: "btn btn--small comment-card__btn",
          textContent: "Delete",
        },
      },
    ];

    const [cardEl, authorEl, timeEl, commentEl, submitBtn, deleteBtn] =
      elementsConfig.map(({ tagName, options }) => createElement(tagName, options));

    submitBtn.addEventListener("click", () => {
      state.uiState.commentReplyId = commentData.id;
    });

    deleteBtn.addEventListener("click", () => {
      state.comments = state.comments
        .filter((c) => {
          return commentData.id !== c.id;
        })
        .filter((c) => {
          return commentData.id !== c.asReplyFor;
        });
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
  }

  /**
   * this function creates, configure and returns reply form
   * but NOT appends it to DOM
   */
  function createNewReplyForm(state) {
    const elementsConfig = [
      {
        tagName: "form",
        options: { className: "reply-form comment-card__reply" },
      },
      {
        tagName: "input",
        options: {
          type: "text",
          name: "author",
          className: "input-text",
          required: true,
          placeholder: "Your name",
        },
      },
      {
        tagName: "textarea",
        options: {
          name: "comment",
          className: "textarea",
          required: true,
          placeholder: "Leave your reply here...",
        },
      },
      {
        tagName: "button",
        options: {
          className: "btn btn--yellow",
          textContent: "Send reply",
          type: "submit",
        },
      },
      {
        tagName: "button",
        options: {
          className: "btn",
          textContent: "Cancel",
          type: "reset",
        },
      },
    ];

    const [formEl, authorEl, descriptionEl, submitBtn, cancelBtn] = elementsConfig.map(
      ({ tagName, options }) => createElement(tagName, options)
    );

    formEl.append(authorEl, descriptionEl, submitBtn, cancelBtn);

    formEl.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);
      const collectedData = Object.fromEntries(formData);
      const createdAt = new Date();

      state.comments.push({
        id: uid(),
        createdAt,
        asReplyFor: state.uiState.commentReplyId,
        ...collectedData,
      });
      e.target.reset();
    });

    formEl.addEventListener("reset", (e) => {
      e.preventDefault();
      state.uiState.commentReplyId = null;
    });

    return formEl;
  }

  /** this function creates and configure footer (add form) */
  function renderNewCommentForm(state, containerEl) {
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
          name: "author",
          className: "input-text input-text--white",
          required: true,
          placeholder: "Your name",
        },
      },
      {
        tagName: "textarea",
        options: {
          name: "comment",
          className: "textarea textarea--white",
          required: true,
          placeholder: "Leave your comment here...",
        },
      },
      {
        tagName: "button",
        options: {
          className: "btn btn--large btn--white",
          textContent: "Add comment",
          type: "submit",
        },
      },
    ];

    const [formEl, authorEl, commentEl, submitBtn] = elementsConfig.map(
      ({ tagName, options }) => createElement(tagName, options)
    );

    formEl.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);
      const collectedData = Object.fromEntries(formData);
      const createdAt = new Date();

      state.comments.push({
        id: uid(),
        createdAt,
        asReplyFor: null,
        ...collectedData,
      });
    });

    formEl.append(authorEl, commentEl, submitBtn);
    containerEl.append(formEl);
  }

  function storeData(propName, data) {
    localStorage.setItem(propName, JSON.stringify(data));
  }

  /** this function creates, configure and returns main layout containers */
  function initLayout(containerId) {
    const wrapper = document.getElementById(containerId);
    wrapper.classList.add("comments");

    const form = createElement("div", { className: "comments__form" });
    const list = createElement("div", { className: "comments__list" });

    wrapper.append(form, list);

    return {
      form,
      list,
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

app("comments");
