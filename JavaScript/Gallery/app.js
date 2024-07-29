import onChange from "https://cdn.jsdelivr.net/npm/on-change@5.0.1/+esm";
import { uid } from "https://cdn.jsdelivr.net/npm/uid@2.0.2/+esm";

/**
 * Завдання 0:
 * Створіть динамічну галерею зображень з наступними функціональностями:
 *
 * Додавання нового зображення через форму (URL та опис).
 * Видалення зображення.
 * Показ великого зображення при натисканні на маленьке зображення (lightbox ефект).
 * Перехід між зображеннями в lightbox режимі.
 */

function app(containerId) {
  const initialState = {
    images: [],
    uiState: {
      lightBoxImgId: null,
    },
  };

  const containers = initLayout(containerId);
  const watchedState = onChange(initialState, render(containers));
  const storedImages = JSON.parse(localStorage.getItem("images")) || [];

  // initialising tasks and fires first rerendering of the app
  watchedState.images = storedImages;

  /**
   * This function triggers every time we reassign the
   * values of properties of the tracked object
   */
  function render(containers) {
    return function (path, value, prevValue) {
      switch (path) {
        case "images": {
          storeData("images", this.images);
          renderFooter(this, containers.footer);
          renderGallery(this, containers.list);
          break;
        }
        case "uiState.lightBoxImgId": {
          renderLightBox(this, containers.lightbox);
        }
      }
    };
  }

  /** this function creates and configure gallery images */
  function renderGallery(state, containerEl) {
    containerEl.innerHTML = "";
    const imageCards = state.images.map((image) => {
      const elementsConfig = [
        {
          tagName: "div",
          options: { className: "gallery-card" },
        },
        {
          tagName: "a",
          options: {
            className: "gallery-card__link",
            href: image.url,
          },
        },
        {
          tagName: "img",
          options: {
            className: "gallery-card__img-item",
            src: image.url,
            alt: image.description,
          },
        },
        {
          tagName: "a",
          options: {
            className: "gallery-card__description",
            textContent: image.description,
            href: image.url,
          },
        },
        {
          tagName: "button",
          options: {
            className: "btn btn--grey btn--small gallery-card__delete-btn",
            textContent: "Delete",
          },
        },
      ];

      const [cardEl, imgAnchorEl, imageEl, imageDescEl, deleteBtn] = elementsConfig.map(
        ({ tagName, options }) => createElement(tagName, options)
      );

      imgAnchorEl.addEventListener("click", (e) => {
        e.preventDefault();
        state.uiState.lightBoxImgId = image.id;
      });

      deleteBtn.addEventListener("click", () => {
        state.images = state.images.filter((i) => i.id !== image.id);
      });

      imgAnchorEl.append(imageEl);
      cardEl.append(imgAnchorEl, imageDescEl, deleteBtn);

      return cardEl;
    });

    if (imageCards.length === 0) {
      imageCards.push(
        createElement("div", {
          className: "gallery-card gallery-card--blank",
          textContent: `No images added yet...`,
        })
      );
    }

    containerEl.append(...imageCards);
  }

  /** this function creates and configure lightbox */
  function renderLightBox(state, containerEl) {
    containerEl.innerHTML = "";

    if (!state.uiState.lightBoxImgId) {
      return;
    }

    const { images, uiState } = state;
    const { lightBoxImgId } = uiState;

    const currentIndex = images.findIndex((image) => image.id === lightBoxImgId);
    const currentImage = images.at(currentIndex);

    const nextSlide = images.at(currentIndex + 1)?.id || images.at(0).id;
    const prevSlide = images.at(currentIndex - 1)?.id || images.at(-1).id;

    const elementsConfig = [
      {
        tagName: "div",
        options: { className: "lightbox" },
      },
      {
        tagName: "div",
        options: { className: "lightbox__inner" },
      },
      {
        tagName: "img",
        options: {
          className: "lightbox__img-item",
          src: currentImage.url,
          alt: currentImage.description,
        },
      },
      {
        tagName: "p",
        options: {
          className: "lightbox__derscription",
          textContent: currentImage.description,
        },
      },
      {
        tagName: "button",
        options: {
          textContent: "Previous Image",
          className: "btn lightbox__btn lightbox__btn--prev",
        },
      },
      {
        tagName: "button",
        options: {
          textContent: "Next Image",
          className: "btn lightbox__btn lightbox__btn--prev",
        },
      },
    ];

    const [
      ligtBoxWrapperEl,
      ligtBoxInnerEl,
      imageEl,
      imageDescriptionEl,
      prevBtn,
      nextBtn,
    ] = elementsConfig.map(({ tagName, options }) => createElement(tagName, options));

    ligtBoxWrapperEl.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) {
        state.uiState.lightBoxImgId = null;
      }
    });

    nextBtn.addEventListener("click", () => {
      state.uiState.lightBoxImgId = nextSlide;
    });

    prevBtn.addEventListener("click", () => {
      state.uiState.lightBoxImgId = prevSlide;
    });

    ligtBoxInnerEl.append(imageEl, imageDescriptionEl, prevBtn, nextBtn);
    ligtBoxWrapperEl.append(ligtBoxInnerEl);
    containerEl.append(ligtBoxWrapperEl);
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
          type: "url",
          name: "url",
          className: "input-text input-text--white form__input",
          required: true,
          placeholder: "Image URL",
        },
      },
      {
        tagName: "input",
        options: {
          type: "text",
          name: "description",
          className: "input-text input-text--white form__input",
          required: true,
          placeholder: "Image description",
        },
      },
      {
        tagName: "button",
        options: {
          className: "btn btn--large btn--white",
          textContent: "Add new image",
          type: "submit",
        },
      },
    ];

    const [formEl, titleEl, descriptionEl, submitBtn] = elementsConfig.map(
      ({ tagName, options }) => createElement(tagName, options)
    );

    formEl.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);
      const imageData = Object.fromEntries(formData);

      state.images.push({ id: uid(), ...imageData });
    });

    formEl.append(titleEl, descriptionEl, submitBtn);
    containerEl.append(formEl);
  }

  function storeData(propName, data) {
    localStorage.setItem(propName, JSON.stringify(data));
  }

  /** this function creates, configure and returns main layout containers */
  function initLayout(containerId) {
    const wrapper = document.getElementById(containerId);
    wrapper.classList.add("gallery");

    const list = createElement("div", { className: "gallery__list" });
    const footer = createElement("div", { className: "gallery__footer" });
    const lightbox = createElement("div", { className: "gallery__lightbox" });

    wrapper.append(list, footer, lightbox);

    return {
      list,
      footer,
      lightbox,
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

app("gallery");
