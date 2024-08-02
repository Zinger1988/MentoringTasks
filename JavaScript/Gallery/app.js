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

  /** this function creates and configure gallery images */
  const renderGallery = (state, containerEl) => {
    containerEl.innerHTML = "";
    const imageCards = state.images.map((image) => {
      // prettier-ignore
      const elementsConfig = [
        { 
          tagName: "div",
          properties: { className: "gallery-card" }
        },
        { 
          tagName: "a",
          properties: { className: "gallery-card__link", href: image.url }
        },
        {
          tagName: "img",
          properties: { className: "gallery-card__img-item", src: image.url, alt: image.description }
        },
        {
          tagName: "a",
          properties: { className: "gallery-card__description", textContent: image.description, href: image.url }
        },
        {
          tagName: "button",
          properties: { className: "btn btn--grey btn--small gallery-card__delete-btn", textContent: "Delete"},
          attributes: { 'aria-label': "Delete"}
        }
      ];

      const [cardEl, imgAnchorEl, imageEl, imageDescEl, deleteBtn] = elementsConfig.map(
        (config) => createElement(config)
      );

      imgAnchorEl.addEventListener("click", (e) => {
        e.preventDefault();
        state.uiState.lightBoxImgId = image.id;
      });

      deleteBtn.addEventListener("click", () => {
        state.uiState.confirm = {
          itemId: image.id,
          isVisible: true,
          text: "Are you sure you want to delete this image?",
        };
      });

      imgAnchorEl.append(imageEl);
      cardEl.append(imgAnchorEl, imageDescEl, deleteBtn);

      return cardEl;
    });

    if (imageCards.length === 0) {
      imageCards.push(
        createElement({
          tagName: "div",
          properties: {
            className: "gallery-card gallery-card--blank",
            textContent:
              "There are no images here yet 😭. Please enter the URL and description of the image in the form below.",
          },
        })
      );
    }

    containerEl.append(...imageCards);
  };

  /** this function creates and configure lightbox */
  const renderLightBox = (state, containerEl) => {
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

    // prettier-ignore
    const elementsConfig = [
      {
        tagName: "div",
        properties: { className: "lightbox" },
      },
      {
        tagName: "div",
        properties: { className: "lightbox__inner" },
      },
      {
        tagName: "img",
        properties: { className: "lightbox__img-item", src: currentImage.url, alt: currentImage.description },
      },
      {
        tagName: "p",
        properties: { className: "lightbox__derscription", textContent: currentImage.description },
      },
      {
        tagName: "button",
        properties: { textContent: "Previous Image", className: "btn lightbox__btn lightbox__btn--prev" },
        attributes: { "aria-label": "Previous Image" },
      },
      {
        tagName: "button",
        properties: { textContent: "Next Image", className: "btn lightbox__btn lightbox__btn--prev" },
        attributes: { "aria-label": "Next Image" }
      },
    ];

    const [
      ligtBoxWrapperEl,
      ligtBoxInnerEl,
      imageEl,
      imageDescriptionEl,
      prevBtn,
      nextBtn,
    ] = elementsConfig.map((config) => createElement(config));

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

    ligtBoxInnerEl.append(imageEl, imageDescriptionEl);

    if (state.images.length > 1) {
      ligtBoxInnerEl.append(prevBtn, nextBtn);
    }

    ligtBoxWrapperEl.append(ligtBoxInnerEl);
    containerEl.append(ligtBoxWrapperEl);
  };

  /** this function creates and configure footer (add form) */
  const renderFooter = (state, containerEl) => {
    containerEl.innerHTML = "";

    // prettier-ignore
    const elementsConfig = [
      {
        tagName: "form",
        properties: { className: "add-form" }
      },
      {
        tagName: "input",
        properties: { type: "url", name: "url", className: "input-text input-text--white form__input", required: true, placeholder: "Image URL" },
      },
      {
        tagName: "input",
        properties: { type: "text", name: "description", className: "input-text input-text--white form__input", required: true, placeholder: "Image description"},
      },
      {
        tagName: "button",
        properties: { className: "btn btn--large btn--white", textContent: "Add new image", type: "submit" },
        attributes: { "aria-label": "Add new image" },
      },
    ];

    const [formEl, titleEl, descriptionEl, submitBtn] = elementsConfig.map((config) =>
      createElement(config)
    );

    formEl.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);
      const url = formData.get("url");
      const description = formData.get("description");

      const isValid = [url, description].every((field) => field && field?.trim());

      if (!isValid) {
        e.target.reset();
        throw new Error("Invalid image form data");
      }

      state.images.push({ id: uid(), url, description });
    });

    formEl.append(titleEl, descriptionEl, submitBtn);
    containerEl.append(formEl);
  };

  const storeData = (propName, data) => {
    localStorage.setItem(propName, JSON.stringify(data));
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
        properties: { className: "confirm-modal__text", textContent: text },
      },
      {
        tagName: "div",
        properties: { className: "confirm-modal__controls" },
      },
      {
        tagName: "button",
        properties: { className: "confirm-modal__btn btn", textContent: "Confirm" },
        attributes: { "aria-label": "Confirm" },
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

  /** this function creates, configure and returns main layout containers */
  const initLayout = (containerId) => {
    const wrapper = document.getElementById(containerId);
    wrapper.classList.add("gallery");

    // prettier-ignore
    const elementsConfig = [
      { tagName: "div", properties: { className: "gallery__list" } },
      { tagName: "div", properties: { className: "gallery__footer" } },
      { tagName: "div", properties: { className: "gallery__lightbox" } },
      { tagName: "div", properties: { className: "gallery__modal" } },
    ];

    const [list, footer, lightbox, modal] = elementsConfig.map((config) =>
      createElement(config)
    );

    wrapper.append(list, footer, lightbox, modal);

    return { list, footer, lightbox, modal };
  };

  /**
   * This function triggers every time we reassign the
   * values of properties of the tracked object
   */
  const render = (containers) => {
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
          break;
        }
        case "uiState.confirm": {
          renderConfirm({
            state: this,
            containerEl: containers.modal,
            onConfirm: (state) => {
              const { itemId } = state.uiState.confirm;
              state.images = state.images.filter((i) => i.id !== itemId);
            },
          });
          break;
        }
      }
    };
  };

  const initialState = {
    images: [],
    uiState: {
      lightBoxImgId: null,
      confirm: {
        itemId: null,
        isVisible: false,
        text: null,
      },
    },
  };

  let storedImages = [];

  try {
    storedImages = JSON.parse(localStorage.getItem("images")) || [];
  } catch (e) {
    console.error(
      `An error occurred during the parsing of gallery data from Local Storage. ${e.message}`
    );
  }

  const containers = initLayout(containerId);

  // initialising tasks and fires first rerendering of the app
  const watchedState = onChange(initialState, render(containers));
  watchedState.images = storedImages;
}

app("gallery");
