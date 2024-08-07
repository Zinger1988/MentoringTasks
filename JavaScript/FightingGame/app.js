class CharacterImage {
  constructor(characterName) {
    this.element = document.createElement("img");
    this.animations = {
      idle: null,
      attack1: null,
      attack2: null,
      attack3: null,
      defend: null,
      defeat: null,
      damage: null,
    };

    return this.calcAnimations({ characterName });
  }

  async calcAnimations({ baseUrl = "./assets/characters", characterName }) {
    const animationNames = Object.keys(this.animations);
    const durations = animationNames.map((animationName) => {
      return this.#calcAnimationDuration({
        baseUrl,
        characterName,
        animationName,
      });
    });

    await Promise.all(durations);
    return this;
  }

  loadImage(animationName) {
    const blob = new Blob([this.animations[animationName].arrayBuffer], {
      type: "image/gif",
    });
    const imageUrl = URL.createObjectURL(blob);
    this.element.src = imageUrl;
    this.element.alt = animationName;
  }

  async #calcAnimationDuration({ baseUrl, characterName, animationName }) {
    return fetch(`${baseUrl}/${characterName}/${animationName}.gif`)
      .then((response) => {
        if (!response.ok) {
          throw Error(response.statusText);
        }
        return response;
      })
      .then((res) => res.arrayBuffer())
      .then((ab) => {
        return (this.animations[animationName] = {
          duration: this.#isGifAnimated(new Uint8Array(ab)),
          arrayBuffer: new Uint8Array(ab),
        });
      })
      .catch((error) => {
        console.error("Failed to load animation", error);
        return (this.animations[animationName] = {
          duration: 0,
          arrayBuffer: null,
        });
      });
  }

  #isGifAnimated(uint8) {
    let duration = 0;
    const GIF_BLOCK_TYPE = 0x21;
    const EXTENSION_INTRODUCER = 0xf9;
    const GRAPHIC_CONTROL_LABEL = 0x04;
    const TERMINATOR = 0x00;

    for (let i = 0, len = uint8.length; i < len; i++) {
      if (
        uint8[i] === GIF_BLOCK_TYPE &&
        uint8[i + 1] === EXTENSION_INTRODUCER &&
        uint8[i + 2] === GRAPHIC_CONTROL_LABEL &&
        uint8[i + 7] === TERMINATOR
      ) {
        const delay = (uint8[i + 5] << 8) | (uint8[i + 4] & 0xff);
        duration += delay < 2 ? 10 : delay;
      }
    }
    return duration * 10;
  }
}

class Character {
  #images = null;
  #callbacks = {};

  constructor({
    name,
    health,
    attackRate,
    defenceRate,
    images,
    isPlayer = false,
    callbacks,
  }) {
    this.health = health;
    this.name = name;
    this.remainingHealth = health;
    this.attackRate = attackRate;
    this.defenceRate = defenceRate;
    this.element = null;
    this.status = "idle";
    this.isPlayer = isPlayer;

    this.#callbacks = { ...callbacks };
    this.#init(images);
  }

  async #init(images) {
    this.#images = await images;
    this.status = "loading";

    this.element = document.createElement("div");
    this.element.classList.add("character");
    this.element.append(this.#images.element);

    if (this.isPlayer) {
      this.element.classList.add("character--player");
    }

    this.idle();
    this.#callbacks?.onInit(this);
  }

  async attack(opponent) {
    if (this.status !== "idle" || opponent.status !== "idle") {
      return this.#getAttackSummary({ damage: 0, attacks: this, defends: opponent });
    }

    return new Promise((resolve) => {
      this.status = "attack";
      const attackAnimationsCount = 3;
      const animationName = `attack${Math.ceil(Math.random() * attackAnimationsCount)}`;

      this.#images.loadImage(animationName);
      const { duration } = this.#images.animations[animationName];

      setTimeout(() => {
        this.idle();
        resolve(opponent.#applyDamage({ damage: this.attackRate, opponent: this }));
      }, duration);
    });
  }

  async #applyDamage({ damage, opponent }) {
    const probabilityOfattack = 0.33;
    const isDefending = Math.random() >= probabilityOfattack;
    const defendingStatus = isDefending ? "defend" : "damage";
    const { duration } = this.#images.animations[defendingStatus];

    this.status = defendingStatus;
    this.#images.loadImage(defendingStatus);

    const damageTaken = isDefending ? damage - damage * this.defenceRate : damage;
    this.remainingHealth = Math.max(0, this.remainingHealth - damageTaken);

    return new Promise((resolve) => {
      setTimeout(() => {
        this.remainingHealth === 0 ? this.defeat() : this.idle();
        resolve(
          this.#getAttackSummary({
            damage: damageTaken,
            attacks: opponent,
            defends: this,
          })
        );
      }, duration);
    });
  }

  idle() {
    this.status = "idle";
    this.#images.loadImage("idle");
  }

  defeat() {
    this.status = "defeat";
    this.#images.loadImage("defeat");
    const { duration } = this.#images.animations.defeat;

    setTimeout(() => {
      this.#callbacks?.onDefeat(this);
    }, duration);
  }

  reset() {
    this.remainingHealth = this.health;
    this.idle();
  }

  #getAttackSummary({ damage, attacks, defends }) {
    return {
      damage,
      attacks,
      defends,
    };
  }
}

class HealhScale {
  constructor({ title, health, rtl = false }) {
    this.title = title;
    this.health = health;
    this.healthRemaining = health;
    this.rtl = rtl;
    this.container = null;
    this.scale = null;

    this.init();
  }

  init() {
    this.container = document.createElement("div");
    this.container.classList.add("health-scale");

    this.scale = document.createElement("div");
    this.scale.classList.add("health-scale__item");
    this.scale.style.width = `${Math.floor(this.#calculateHealthPrecentage())}%`;

    if (this.rtl) {
      this.container.classList.add("health-scale--player");
    }

    const name = document.createElement("div");
    name.classList.add("health-scale__name");
    name.textContent = this.title;

    this.container.append(this.scale, name);
    return this.container;
  }

  #calculateHealthPrecentage() {
    return (this.healthRemaining / this.health) * 100;
  }

  decreaseHealth(damage) {
    this.healthRemaining = Math.max(0, this.healthRemaining - damage);
    const remainingPercentage = this.#calculateHealthPrecentage();
    this.scale.style.width = `${Math.floor(remainingPercentage)}%`;

    if (remainingPercentage <= 20) {
      this.container.classList.add("health-scale--warning");
    }

    if (remainingPercentage === 0) {
      this.container.classList.remove("health-scale--warning");
    }

    return this.healthRemaining;
  }

  increaseHealth(hill) {
    this.healthRemaining = Math.min(this.health, this.healthRemaining + hill);
    const remainingPercentage = this.#calculateHealthPrecentage();
    this.scale.style.width = `${Math.floor(remainingPercentage)}%`;

    if (remainingPercentage >= 20) {
      this.container.classList.remove("health-scale--warning");
    }

    return this.healthRemaining;
  }
}

class Game {
  constructor({ playerCharacter, pcCharacter }) {
    this.status = "idle";
    this.container = null;
    this.startScreen = null;
    this.tip = null;
    this.gameOverScreen = null;
    this.playerCharacter = null;
    this.playerScale = null;
    this.computerCharacter = null;
    this.pcScale = null;

    this.init(playerCharacter, pcCharacter);
  }

  init(playerCharacter, pcCharacter) {
    try {
      const container = document.getElementById("game");

      if (container === null) {
        throw Error('Unable to find app root html element (id="game")');
      }

      this.container = container;
    } catch (error) {
      console.error(error);
      return;
    }

    this.playerCharacter = new Character({
      ...playerCharacter,
      isPlayer: true,
      callbacks: {
        onInit: (char) => {
          this.container.append(char.element);
        },
        onDefeat: (char) => this.#showGameOverScreen(this.computerCharacter.name),
      },
    });

    this.computerCharacter = new Character({
      ...pcCharacter,
      callbacks: {
        onInit: (char) => {
          this.container.append(char.element);
        },
        onDefeat: (char) => this.#showGameOverScreen(this.playerCharacter.name),
      },
    });

    this.playerScale = new HealhScale({
      title: `${this.playerCharacter.name} (player)`,
      health: this.playerCharacter.health,
      rtl: true,
    });

    this.pcScale = new HealhScale({
      title: this.computerCharacter.name,
      health: this.computerCharacter.health,
    });

    this.container.classList.add("game");

    this.startScreen = document.createElement("div");
    this.startScreen.classList.add("game__screen", "start-screen");
    this.startScreen.innerHTML = `<p class="start-screen__text">Press space to start</p>`;

    this.tip = document.createElement("div");
    this.tip.classList.add("game__tip");
    this.tip.textContent = "Press ENTER to hit an enemy";

    this.gameOverScreen = document.createElement("div");
    this.gameOverScreen.classList.add("game__screen", "gameover-screen");

    this.container.append(this.playerScale.container, this.pcScale.container, this.tip);
    this.#hanldleActions();
    this.#showStartScreen();
  }

  #hanldleActions() {
    document.addEventListener("keydown", async (e) => {
      if (e.code.toLowerCase() === "enter" && this.status === "running") {
        const { playerCharacter, computerCharacter, tip } = this;

        tip.classList.add("game__tip--hidden");

        const playerAttackSummary = await playerCharacter.attack(computerCharacter);
        this.pcScale.decreaseHealth(playerAttackSummary.damage);

        const pcAttackSummary = await computerCharacter.attack(playerCharacter);
        this.playerScale.decreaseHealth(pcAttackSummary.damage);

        tip.classList.remove("game__tip--hidden");
      }

      if (e.code.toLowerCase() === "space") {
        switch (this.status) {
          case "idle":
            this.#removeStartScreen();
            break;
          case "game over":
            this.#reset();
            break;
        }
      }
    });
  }

  #showGameOverScreen(name) {
    this.status = "game over";
    this.container.append(this.gameOverScreen);

    this.gameOverScreen.innerHTML = `
		<p class="gameover-screen__text">${name} wins!</p>
		<p class="gameover-screen__text">Press space to continue</p>
		`;
  }

  #removeGameOverScreen() {
    this.gameOverScreen.remove();
  }

  #showStartScreen() {
    this.status = "idle";
    this.container.append(this.startScreen);
  }

  #removeStartScreen() {
    this.status = "running";
    this.startScreen.remove();
  }

  #reset() {
    this.computerCharacter.reset();
    this.playerCharacter.reset();
    this.pcScale.increaseHealth(this.computerCharacter.health);
    this.playerScale.increaseHealth(this.playerCharacter.health);
    this.#removeGameOverScreen();
    this.#showStartScreen();
  }
}

const CHARACTERS = {
  troll: {
    name: "Ugly troll",
    health: 115,
    attackRate: 40,
    defenceRate: 0.6,
    images: new CharacterImage("troll"),
  },
  heavyKnight: {
    name: "Black Knight",
    health: 100,
    attackRate: 30,
    defenceRate: 0.8,
    images: new CharacterImage("heavyKnight"),
  },
};

new Game({
  playerCharacter: CHARACTERS.heavyKnight,
  pcCharacter: CHARACTERS.troll,
});
