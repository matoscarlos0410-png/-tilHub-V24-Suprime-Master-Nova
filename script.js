/* =========================================================
   ÚTILHUB V24 — NOVA FLOW
   SCRIPT PRINCIPAL
   120 ANIMACIONES ÚNICAS
   ========================================================= */

"use strict";

/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

const STORAGE_KEY = "utilhub-v24";
const OLD_KEYS = [
  "utilhub-v23",
  "utilhub-v22",
  "utilhub-v21",
  "utilhub-v20",
  "utilhub-v19"
];

const API_DICTIONARY =
  "https://api.dictionaryapi.dev/api/v2/entries/es/";

const REDUCED_MOTION = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

/* =========================================================
   ESTADO
   ========================================================= */

const defaultState = {
  theme: "dark",
  motion: !REDUCED_MOTION,
  performance: "balanced",
  focus: false,

  novaMode: 1,
  novaIntensity: 0.8,
  globalFx: true,
  scrollParallax: true,

  favorites: [],
  recent: [],

  notes: "",
  tasks: [],
  shopping: [],

  dictionaryRecent: [],

  settings: {}
};

let state = loadState();

/* =========================================================
   UTILIDADES GENERALES
   ========================================================= */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(random(min, max + 1));
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function lerp(a, b, amount) {
  return a + (b - a) * amount;
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");

  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16)
  };
}

function rgba(hex, alpha) {
  const c = hexToRgb(hex);
  return `rgba(${c.r},${c.g},${c.b},${alpha})`;
}

function saveState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state)
    );
  } catch (error) {
    console.warn("No se pudo guardar el estado.", error);
  }
}

function loadState() {
  let saved = null;

  try {
    saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "null"
    );
  } catch {}

  if (!saved) {
    for (const key of OLD_KEYS) {
      try {
        const old = JSON.parse(
          localStorage.getItem(key) || "null"
        );

        if (old) {
          saved = old;
          break;
        }
      } catch {}
    }
  }

  return {
    ...defaultState,
    ...(saved || {})
  };
}

/* =========================================================
   TOAST
   ========================================================= */

let toastTimer;

function toast(message) {
  const element = $("#toast");

  if (!element) return;

  element.textContent = message;
  element.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    element.classList.remove("show");
  }, 2600);
}

/* =========================================================
   TEMA
   ========================================================= */

function applyTheme() {
  document.body.classList.toggle(
    "light",
    state.theme === "light"
  );
}

$("#themeBtn")?.addEventListener("click", () => {
  state.theme =
    state.theme === "dark"
      ? "light"
      : "dark";

  applyTheme();
  saveState();
});

/* =========================================================
   MOTION
   ========================================================= */

function applyMotion() {
  document.body.classList.toggle(
    "motion-off",
    !state.motion
  );

  if (!state.motion) {
    stopNova();
  } else {
    startNova();
  }

  const button = $("#motionBtn");

  if (button) {
    button.textContent =
      state.motion ? "✦" : "○";
  }
}

$("#motionBtn")?.addEventListener("click", () => {
  state.motion = !state.motion;

  applyMotion();
  saveState();

  toast(
    state.motion
      ? "NOVA FLOW activado"
      : "NOVA FLOW desactivado"
  );
});

/* =========================================================
   MODO CONCENTRACIÓN
   ========================================================= */

$("#focusBtn")?.addEventListener("click", () => {
  state.focus = !state.focus;

  document.body.classList.toggle(
    "focus-mode",
    state.focus
  );

  saveState();

  toast(
    state.focus
      ? "Modo concentración activado"
      : "Modo concentración desactivado"
  );
});

/* =========================================================
   HERRAMIENTAS
   ========================================================= */

const TOOLS = [
  ["calculator", "🧮", "Calculadora", "math", "Calcula operaciones rápidamente."],
  ["percentage", "%", "Porcentajes", "math", "Calcula porcentajes."],
  ["discount", "🏷", "Descuentos", "math", "Calcula precios con descuento."],
  ["rule3", "⅓", "Regla de tres", "math", "Resuelve reglas de tres."],
  ["average", "∑", "Promedio", "math", "Calcula promedios."],
  ["percentageChange", "↗", "Cambio porcentual", "math", "Compara cambios entre valores."],

  ["length", "📏", "Longitud", "convert", "Convierte unidades de longitud."],
  ["weight", "⚖", "Peso", "convert", "Convierte unidades de peso."],
  ["volume", "🧪", "Volumen", "convert", "Convierte unidades de volumen."],
  ["temperature", "🌡", "Temperatura", "convert", "Convierte temperaturas."],
  ["speed", "🏎", "Velocidad", "convert", "Convierte unidades de velocidad."],
  ["base", "01", "Bases numéricas", "convert", "Convierte números entre bases."],

  ["clock", "🕐", "Reloj", "time", "Muestra la hora actual."],
  ["timer", "⏱", "Temporizador", "time", "Crea una cuenta regresiva."],
  ["stopwatch", "⏲", "Cronómetro", "time", "Mide el tiempo."],
  ["countdown", "⌛", "Cuenta regresiva", "time", "Cuenta hasta una fecha."],
  ["datediff", "📅", "Diferencia de fechas", "time", "Calcula días entre fechas."],
  ["age", "🎂", "Edad", "time", "Calcula una edad."],

  ["text", "Aa", "Texto", "text", "Analiza y transforma texto."],
  ["dictionary", "📖", "Diccionario", "text", "Busca definiciones y ejemplos."],
  ["case", "Aa", "Cambiar mayúsculas", "text", "Transforma el formato del texto."],
  ["counter", "#", "Contador de palabras", "text", "Cuenta palabras y caracteres."],
  ["slug", "🔗", "Generador de slug", "text", "Crea identificadores para URLs."],
  ["json", "{}", "Formateador JSON", "text", "Ordena y valida JSON."],

  ["notes", "📝", "Notas", "organize", "Guarda notas localmente."],
  ["tasks", "✓", "Tareas", "organize", "Organiza tus pendientes."],
  ["shopping", "🛒", "Lista de compras", "organize", "Crea listas de compras."],
  ["checklist", "☑", "Checklist", "organize", "Crea listas de comprobación."],

  ["tip", "💡", "Propina", "life", "Calcula una propina."],
  ["split", "💵", "Dividir cuenta", "life", "Divide una cuenta."],
  ["currency", "💱", "Monedas", "life", "Consulta conversión de monedas."],
  ["food", "🍽", "Comida", "life", "Busca opciones de comida."],
  ["buy", "🛍", "Compras", "life", "Busca productos para comprar."],

  ["random", "🎲", "Aleatorio", "fun", "Genera números aleatorios."],
  ["password", "🔐", "Contraseña", "fun", "Genera contraseñas seguras."],
  ["qr", "▦", "Código QR", "fun", "Genera códigos QR."],
  ["color", "🎨", "Color HEX", "fun", "Convierte y analiza colores."]
];

function renderTools() {
  const grid = $("#toolGrid");

  if (!grid) return;

  grid.innerHTML = "";

  TOOLS.forEach((tool) => {
    const [id, icon, title, category, description] = tool;

    const card = document.createElement("article");

    card.className = "toolCard";
    card.dataset.category = category;
    card.dataset.tool = id;

    const favorite = state.favorites.includes(id);

    card.innerHTML = `
      <button
        class="favoriteButton ${favorite ? "active" : ""}"
        data-favorite="${id}"
        type="button"
        aria-label="Favorito"
      >
        ${favorite ? "★" : "☆"}
      </button>

      <button
        class="toolCardOpen"
        data-open="${id}"
        type="button"
        style="
          all:unset;
          display:block;
          width:100%;
          height:100%;
          cursor:pointer;
        "
      >
        <div class="toolCardIcon">${icon}</div>

        <h3>${title}</h3>

        <p>${description}</p>
      </button>
    `;

    grid.appendChild(card);
  });

  $("#toolCount").textContent = TOOLS.length;
}

function toggleFavorite(id) {
  if (state.favorites.includes(id)) {
    state.favorites =
      state.favorites.filter((x) => x !== id);
  } else {
    state.favorites.unshift(id);
  }

  saveState();
  renderTools();
  updateStats();
}

function addRecent(id) {
  state.recent =
    [id, ...state.recent.filter((x) => x !== id)]
      .slice(0, 10);

  saveState();
  renderQuickTools();
  updateStats();
}

function updateStats() {
  if ($("#favoriteCount")) {
    $("#favoriteCount").textContent =
      state.favorites.length;
  }

  if ($("#recentCount")) {
    $("#recentCount").textContent =
      state.recent.length;
  }
}

/* =========================================================
   BUSCADOR Y CATEGORÍAS
   ========================================================= */

let activeCategory = "all";

function filterTools() {
  const search =
    ($("#toolSearch")?.value || "")
      .trim()
      .toLowerCase();

  $$(".toolCard").forEach((card) => {
    const category = card.dataset.category;
    const text = card.textContent.toLowerCase();

    const categoryOK =
      activeCategory === "all" ||
      category === activeCategory;

    const searchOK =
      !search ||
      text.includes(search);

    card.style.display =
      categoryOK && searchOK
        ? ""
        : "none";
  });
}

$("#toolSearch")?.addEventListener(
  "input",
  filterTools
);

$$(".category").forEach((button) => {
  button.addEventListener("click", () => {
    $$(".category").forEach((x) =>
      x.classList.remove("active")
    );

    button.classList.add("active");

    activeCategory =
      button.dataset.category;

    filterTools();
  });
});

document.addEventListener("keydown", (event) => {
  if (
    (event.ctrlKey || event.metaKey) &&
    event.key.toLowerCase() === "k"
  ) {
    event.preventDefault();
    $("#toolSearch")?.focus();
  }
});

/* =========================================================
   ACCESO RÁPIDO
   ========================================================= */

function renderQuickTools() {
  const box = $("#quickTools");

  if (!box) return;

  box.innerHTML = "";

  const ids = [
    ...state.favorites,
    ...state.recent
  ].filter(
    (id, index, array) =>
      array.indexOf(id) === index
  ).slice(0, 8);

  if (!ids.length) {
    box.innerHTML = `
      <div class="quickTool">
        Todavía no tienes herramientas recientes.
      </div>
    `;

    return;
  }

  ids.forEach((id) => {
    const tool = TOOLS.find((x) => x[0] === id);

    if (!tool) return;

    const button =
      document.createElement("button");

    button.className = "quickTool";
    button.dataset.open = id;
    button.type = "button";

    button.textContent =
      `${tool[1]}  ${tool[2]}`;

    box.appendChild(button);
  });
}

$("#clearRecentBtn")?.addEventListener(
  "click",
  () => {
    state.recent = [];

    saveState();
    renderQuickTools();
    updateStats();

    toast("Recientes eliminados");
  }
);

/* =========================================================
   PANEL DE HERRAMIENTAS
   ========================================================= */

const toolPanel = $("#toolPanel");

function openTool(id) {
  const tool = TOOLS.find((x) => x[0] === id);

  if (!tool) return;

  addRecent(id);

  $("#toolPanelIcon").textContent = tool[1];
  $("#toolPanelCategory").textContent = tool[3];
  $("#toolPanelTitle").textContent = tool[2];

  $("#toolContent").innerHTML =
    toolHTML(id);

  toolPanel.classList.add("open");
  toolPanel.setAttribute("aria-hidden", "false");

  setupTool(id);
}

function closeTool() {
  toolPanel?.classList.remove("open");
  toolPanel?.setAttribute("aria-hidden", "true");
}

document.addEventListener("click", (event) => {
  const openButton =
    event.target.closest("[data-open]");

  if (
    openButton &&
    !event.target.closest("[data-favorite]")
  ) {
    openTool(openButton.dataset.open);
  }

  const favorite =
    event.target.closest("[data-favorite]");

  if (favorite) {
    event.preventDefault();
    event.stopPropagation();

    toggleFavorite(
      favorite.dataset.favorite
    );
  }

  if (event.target.closest("[data-close-tool]")) {
    closeTool();
  }
});

$("#closeTool")?.addEventListener(
  "click",
  closeTool
);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeTool();
    closeModal();
  }
});

/* =========================================================
   HTML DE HERRAMIENTAS
   ========================================================= */

function toolHTML(id) {

  switch (id) {

    case "calculator":
      return `
        <div class="toolForm">
          <input id="calcInput" placeholder="Ejemplo: 25 + 8 * 2">
          <button class="primaryButton" id="calcBtn">Calcular</button>
          <div id="calcResult"></div>
        </div>
      `;

    case "percentage":
      return `
        <div class="toolForm">
          <input id="percentA" type="number" placeholder="Porcentaje">
          <input id="percentB" type="number" placeholder="Número">
          <button class="primaryButton" id="percentBtn">Calcular</button>
          <div id="percentResult"></div>
        </div>
      `;

    case "discount":
      return `
        <div class="toolForm">
          <input id="price" type="number" placeholder="Precio">
          <input id="discount" type="number" placeholder="Descuento %">
          <button class="primaryButton" id="discountBtn">Calcular</button>
          <div id="discountResult"></div>
        </div>
      `;

    case "rule3":
      return `
        <div class="toolForm">
          <input id="rA" type="number" placeholder="A">
          <input id="rB" type="number" placeholder="B">
          <input id="rC" type="number" placeholder="C">
          <button class="primaryButton" id="ruleBtn">Resolver</button>
          <div id="ruleResult"></div>
        </div>
      `;

    case "average":
      return `
        <div class="toolForm">
          <input id="averageInput" placeholder="Ejemplo: 12, 15, 18, 20">
          <button class="primaryButton" id="averageBtn">Calcular</button>
          <div id="averageResult"></div>
        </div>
      `;

    case "counter":
      return `
        <div class="toolForm">
          <textarea id="counterInput" rows="8" placeholder="Escribe o pega tu texto"></textarea>
          <div id="counterResult"></div>
        </div>
      `;

    case "case":
      return `
        <div class="toolForm">
          <textarea id="caseInput" rows="8" placeholder="Escribe tu texto"></textarea>
          <button class="secondaryButton" id="upperBtn">MAYÚSCULAS</button>
          <button class="secondaryButton" id="lowerBtn">minúsculas</button>
          <div id="caseResult"></div>
        </div>
      `;

    case "json":
      return `
        <div class="toolForm">
          <textarea id="jsonInput" rows="10" placeholder='{"nombre":"ÚtilHub"}'></textarea>
          <button class="primaryButton" id="jsonBtn">Formatear</button>
          <pre id="jsonResult"></pre>
        </div>
      `;

    case "dictionary":
      return `
        <div class="toolForm">
          <input
            id="dictionaryInput"
            autocomplete="off"
            placeholder="Escribe una palabra"
          >

          <button
            class="primaryButton"
            id="dictionaryBtn"
          >
            Buscar
          </button>

          <div id="dictionaryRecent"></div>

          <div id="dictionaryResult">
            <p>Escribe una palabra para buscar su significado.</p>
          </div>
        </div>
      `;

    case "notes":
      return `
        <div class="toolForm">
          <textarea
            id="notesInput"
            rows="12"
            placeholder="Escribe tus notas..."
          ></textarea>

          <button
            class="primaryButton"
            id="saveNotes"
          >
            Guardar
          </button>
        </div>
      `;

    case "tasks":
      return `
        <div class="toolForm">
          <input id="taskInput" placeholder="Nueva tarea">
          <button class="primaryButton" id="addTask">Agregar</button>
          <div id="taskList"></div>
        </div>
      `;

    case "shopping":
      return `
        <div class="toolForm">
          <input id="shoppingInput" placeholder="Producto">
          <button class="primaryButton" id="addShopping">Agregar</button>
          <div id="shoppingList"></div>
        </div>
      `;

    case "password":
      return `
        <div class="toolForm">
          <input id="passwordLength" type="number" min="4" max="64" value="16">
          <button class="primaryButton" id="passwordBtn">Generar</button>
          <input id="passwordResult" readonly>
        </div>
      `;

    case "random":
      return `
        <div class="toolForm">
          <input id="randomMin" type="number" value="1" placeholder="Mínimo">
          <input id="randomMax" type="number" value="100" placeholder="Máximo">
          <button class="primaryButton" id="randomBtn">Generar</button>
          <div id="randomResult"></div>
        </div>
      `;

    case "timer":
      return `
        <div class="toolForm">
          <input id="timerSeconds" type="number" min="1" value="60">
          <button class="primaryButton" id="timerStart">Iniciar</button>
          <button class="secondaryButton" id="timerStop">Detener</button>
          <h2 id="timerDisplay">01:00</h2>
        </div>
      `;

    case "stopwatch":
      return `
        <div class="toolForm">
          <h2 id="stopwatchDisplay">00:00.0</h2>
          <button class="primaryButton" id="stopwatchStart">Iniciar</button>
          <button class="secondaryButton" id="stopwatchStop">Detener</button>
          <button class="secondaryButton" id="stopwatchReset">Reiniciar</button>
        </div>
      `;

    case "clock":
      return `
        <div class="toolForm">
          <h1 id="liveClock">--:--:--</h1>
          <p id="liveDate"></p>
        </div>
      `;

    case "tip":
      return `
        <div class="toolForm">
          <input id="tipBill" type="number" placeholder="Cuenta">
          <input id="tipPercent" type="number" value="10" placeholder="Propina %">
          <button class="primaryButton" id="tipBtn">Calcular</button>
          <div id="tipResult"></div>
        </div>
      `;

    case "split":
      return `
        <div class="toolForm">
          <input id="splitBill" type="number" placeholder="Cuenta">
          <input id="splitPeople" type="number" min="1" value="2" placeholder="Personas">
          <button class="primaryButton" id="splitBtn">Dividir</button>
          <div id="splitResult"></div>
        </div>
      `;

    case "food":
      return `
        <div class="toolForm">
          <input id="foodSearch" placeholder="Ejemplo: pizza">
          <button class="primaryButton" id="foodBtn">Buscar</button>
          <div id="foodResult"></div>
        </div>
      `;

    case "buy":
      return `
        <div class="toolForm">
          <input id="buySearch" placeholder="Ejemplo: audífonos">
          <button class="primaryButton" id="buyBtn">Buscar</button>
          <div id="buyResult"></div>
        </div>
      `;

    case "qr":
      return `
        <div class="toolForm">
          <input id="qrInput" placeholder="Texto o enlace">
          <button class="primaryButton" id="qrBtn">Generar QR</button>
          <div id="qrResult"></div>
        </div>
      `;

    case "length":
    case "weight":
    case "volume":
    case "temperature":
    case "speed":
      return converterHTML(id);

    default:
      return `
        <div class="toolForm">
          <p>Esta herramienta está preparada para V24.</p>
        </div>
      `;
  }
}

function converterHTML(id) {
  const names = {
    length: "Longitud",
    weight: "Peso",
    volume: "Volumen",
    temperature: "Temperatura",
    speed: "Velocidad"
  };

  return `
    <div class="toolForm">
      <h3>${names[id]}</h3>
      <input id="convertValue" type="number" placeholder="Valor">

      <select id="convertFrom">
        <option value="1">Unidad base</option>
      </select>

      <input
        id="convertTo"
        placeholder="Unidad destino"
      >

      <button
        class="primaryButton"
        id="convertBtn"
      >
        Convertir
      </button>

      <div id="convertResult"></div>
    </div>
  `;
}

/* =========================================================
   CONFIGURAR HERRAMIENTAS
   ========================================================= */

function setupTool(id) {

  if (id === "calculator") {
    $("#calcBtn")?.addEventListener("click", () => {
      const input = $("#calcInput").value;

      const result = safeCalculate(input);

      $("#calcResult").textContent =
        result === null
          ? "Operación no válida."
          : `Resultado: ${result}`;
    });
  }

  if (id === "percentage") {
    $("#percentBtn")?.addEventListener("click", () => {
      const a = Number($("#percentA").value);
      const b = Number($("#percentB").value);

      if (!Number.isFinite(a) || !Number.isFinite(b)) {
        $("#percentResult").textContent =
          "Introduce valores válidos.";
        return;
      }

      $("#percentResult").textContent =
        `${a}% de ${b} = ${(a * b) / 100}`;
    });
  }

  if (id === "discount") {
    $("#discountBtn")?.addEventListener("click", () => {
      const price = Number($("#price").value);
      const discount = Number($("#discount").value);

      if (
        !Number.isFinite(price) ||
        !Number.isFinite(discount)
      ) return;

      const saved =
        price * discount / 100;

      const finalPrice =
        price - saved;

      $("#discountResult").textContent =
        `Descuento: ${saved.toFixed(2)} | Total: ${finalPrice.toFixed(2)}`;
    });
  }

  if (id === "rule3") {
    $("#ruleBtn")?.addEventListener("click", () => {
      const a = Number($("#rA").value);
      const b = Number($("#rB").value);
      const c = Number($("#rC").value);

      if (!a || !Number.isFinite(b) || !Number.isFinite(c)) {
        $("#ruleResult").textContent =
          "Introduce valores válidos.";
        return;
      }

      const x = b * c / a;

      $("#ruleResult").textContent =
        `x = ${x}`;
    });
  }

  if (id === "average") {
    $("#averageBtn")?.addEventListener("click", () => {
      const values =
        $("#averageInput").value
          .split(",")
          .map(Number)
          .filter(Number.isFinite);

      if (!values.length) return;

      const average =
        values.reduce((a, b) => a + b, 0)
        / values.length;

      $("#averageResult").textContent =
        `Promedio: ${average}`;
    });
  }

  if (id === "counter") {
    $("#counterInput")?.addEventListener("input", () => {
      const text = $("#counterInput").value;

      const words =
        text.trim()
          ? text.trim().split(/\s+/).length
          : 0;

      $("#counterResult").textContent =
        `Palabras: ${words} | Caracteres: ${text.length}`;
    });
  }

  if (id === "case") {
    $("#upperBtn")?.addEventListener("click", () => {
      $("#caseResult").textContent =
        $("#caseInput").value.toUpperCase();
    });

    $("#lowerBtn")?.addEventListener("click", () => {
      $("#caseResult").textContent =
        $("#caseInput").value.toLowerCase();
    });
  }

  if (id === "json") {
    $("#jsonBtn")?.addEventListener("click", () => {
      try {
        const object =
          JSON.parse($("#jsonInput").value);

        $("#jsonResult").textContent =
          JSON.stringify(object, null, 2);
      } catch {
        $("#jsonResult").textContent =
          "JSON no válido.";
      }
    });
  }

  if (id === "dictionary") {
    setupDictionary();
  }

  if (id === "notes") {
    $("#notesInput").value =
      state.notes || "";

    $("#saveNotes")?.addEventListener("click", () => {
      state.notes =
        $("#notesInput").value;

      saveState();

      toast("Notas guardadas");
    });
  }

  if (id === "tasks") {
    setupTasks();
  }

  if (id === "shopping") {
    setupShopping();
  }

  if (id === "password") {
    $("#passwordBtn")?.addEventListener(
      "click",
      generatePassword
    );
  }

  if (id === "random") {
    $("#randomBtn")?.addEventListener("click", () => {
      const min = Number($("#randomMin").value);
      const max = Number($("#randomMax").value);

      if (min > max) return;

      $("#randomResult").textContent =
        randomInt(min, max);
    });
  }

  if (id === "timer") {
    setupTimer();
  }

  if (id === "stopwatch") {
    setupStopwatch();
  }

  if (id === "clock") {
    setupClock();
  }

  if (id === "tip") {
    $("#tipBtn")?.addEventListener("click", () => {
      const bill = Number($("#tipBill").value);
      const percent = Number($("#tipPercent").value);

      const tip =
        bill * percent / 100;

      $("#tipResult").textContent =
        `Propina: ${tip.toFixed(2)} | Total: ${(bill + tip).toFixed(2)}`;
    });
  }

  if (id === "split") {
    $("#splitBtn")?.addEventListener("click", () => {
      const bill = Number($("#splitBill").value);
      const people = Number($("#splitPeople").value);

      if (people <= 0) return;

      $("#splitResult").textContent =
        `Cada persona paga: ${(bill / people).toFixed(2)}`;
    });
  }

  if (id === "food") {
    $("#foodBtn")?.addEventListener("click", () => {
      const query =
        encodeURIComponent($("#foodSearch").value.trim());

      if (!query) return;

      $("#foodResult").innerHTML = `
        <p>Busca opciones de comida:</p>
        <a
          href="https://www.google.com/search?q=${query}+comida"
          target="_blank"
          rel="noopener noreferrer"
        >
          Buscar en Google
        </a>
      `;
    });
  }

  if (id === "buy") {
    $("#buyBtn")?.addEventListener("click", () => {
      const query =
        encodeURIComponent($("#buySearch").value.trim());

      if (!query) return;

      $("#buyResult").innerHTML = `
        <p>Revisa los resultados y realiza tú mismo la compra.</p>

        <a
          href="https://www.google.com/search?tbm=shop&q=${query}"
          target="_blank"
          rel="noopener noreferrer"
        >
          Buscar productos
        </a>
      `;
    });
  }

  if (id === "qr") {
    $("#qrBtn")?.addEventListener("click", () => {
      const value =
        $("#qrInput").value.trim();

      if (!value) return;

      const url =
        `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(value)}`;

      $("#qrResult").innerHTML =
        `<img src="${url}" alt="Código QR generado" style="max-width:300px;width:100%;">`;
    });
  }
}

/* =========================================================
   CALCULADORA SEGURA
   ========================================================= */

function safeCalculate(expression) {

  if (!expression) return null;

  let clean =
    expression
      .replace(/,/g, ".")
      .replace(/\s+/g, "");

  if (!/^[0-9+\-*/().%]+$/.test(clean)) {
    return null;
  }

  while (clean.includes("%")) {
    clean = clean.replace(
      /(\d+(?:\.\d+)?)%/g,
      "($1/100)"
    );
  }

  /*
    Parser matemático sencillo.
    No usamos eval() ni Function().
  */

  const tokens =
    clean.match(
      /(?:\d+(?:\.\d+)?)|[()+\-*/]/g
    );

  if (!tokens) return null;

  let position = 0;

  function parseExpression() {
    let value = parseTerm();

    while (
      tokens[position] === "+" ||
      tokens[position] === "-"
    ) {
      const op = tokens[position++];
      const right = parseTerm();

      value =
        op === "+"
          ? value + right
          : value - right;
    }

    return value;
  }

  function parseTerm() {
    let value = parseFactor();

    while (
      tokens[position] === "*" ||
      tokens[position] === "/"
    ) {
      const op = tokens[position++];
      const right = parseFactor();

      if (op === "/" && right === 0) {
        throw new Error("División por cero");
      }

      value =
        op === "*"
          ? value * right
          : value / right;
    }

    return value;
  }

  function parseFactor() {
    const token = tokens[position++];

    if (token === "(") {
      const value = parseExpression();

      if (tokens[position++] !== ")") {
        throw new Error("Paréntesis");
      }

      return value;
    }

    if (token === "-") {
      return -parseFactor();
    }

    const number = Number(token);

    if (!Number.isFinite(number)) {
      throw new Error("Número");
    }

    return number;
  }

  try {
    const result = parseExpression();

    if (position !== tokens.length) {
      return null;
    }

    return Number.isFinite(result)
      ? result
      : null;

  } catch {
    return null;
  }
}

/* =========================================================
   DICCIONARIO TURBO
   ========================================================= */

const dictionaryCache = new Map();
const dictionaryPending = new Map();

async function fetchDictionary(word) {

  const key =
    word.trim().toLowerCase();

  if (!key) return null;

  if (dictionaryCache.has(key)) {
    return dictionaryCache.get(key);
  }

  if (dictionaryPending.has(key)) {
    return dictionaryPending.get(key);
  }

  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => controller.abort(),
      5000
    );

  const promise =
    fetch(
      API_DICTIONARY +
      encodeURIComponent(key),
      {
        signal: controller.signal,
        headers: {
          Accept: "application/json"
        }
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("NOT_FOUND");
        }

        return response.json();
      })
      .then((data) => {

        dictionaryCache.set(
          key,
          data
        );

        return data;
      })
      .finally(() => {
        clearTimeout(timeout);
        dictionaryPending.delete(key);
      });

  dictionaryPending.set(
    key,
    promise
  );

  return promise;
}

function setupDictionary() {

  const input =
    $("#dictionaryInput");

  const button =
    $("#dictionaryBtn");

  const result =
    $("#dictionaryResult");

  if (!input || !button || !result) {
    return;
  }

  const search = async () => {

    const word =
      input.value.trim().toLowerCase();

    if (!word) {
      result.innerHTML =
        "<p>Escribe una palabra.</p>";
      return;
    }

    result.innerHTML =
      "<p>Buscando...</p>";

    try {

      const data =
        await fetchDictionary(word);

      if (!Array.isArray(data) || !data.length) {
        throw new Error();
      }

      const entry = data[0];

      const meanings =
        entry.meanings || [];

      let html =
        `<h3>${escapeHTML(entry.word || word)}</h3>`;

      meanings.slice(0, 5).forEach((meaning) => {

        html += `
          <div style="margin:18px 0;">
            <strong>
              ${escapeHTML(meaning.partOfSpeech || "")}
            </strong>
          `;

        (meaning.definitions || [])
          .slice(0, 3)
          .forEach((definition) => {

            html += `
              <p>
                ${escapeHTML(
                  definition.definition || ""
                )}
              </p>
            `;

            if (definition.example) {
              html += `
                <p>
                  <em>
                    Ejemplo:
                    ${escapeHTML(definition.example)}
                  </em>
                </p>
              `;
            }
          });

        const synonyms =
          meaning.definitions
            ?.flatMap(
              (x) => x.synonyms || []
            )
            .slice(0, 8);

        if (synonyms?.length) {
          html += `
            <p>
              <strong>Sinónimos:</strong>
              ${synonyms
                .map(escapeHTML)
                .join(", ")}
            </p>
          `;
        }

        html += "</div>";
      });

      result.innerHTML = html;

      state.dictionaryRecent =
        [
          word,
          ...state.dictionaryRecent
            .filter((x) => x !== word)
        ].slice(0, 10);

      saveState();

    } catch (error) {

      result.innerHTML = `
        <p>
          No se encontró la palabra o hubo un
          problema de conexión.
        </p>
      `;
    }
  };

  button.addEventListener("click", search);

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      search();
    }
  });
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================================================
   NOTAS / TAREAS / COMPRAS
   ========================================================= */

function setupTasks() {
  renderTasks();

  $("#addTask")?.addEventListener("click", () => {
    const input = $("#taskInput");
    const value = input.value.trim();

    if (!value) return;

    state.tasks.push({
      id: Date.now(),
      text: value,
      done: false
    });

    input.value = "";

    saveState();
    renderTasks();
  });
}

function renderTasks() {
  const list = $("#taskList");

  if (!list) return;

  list.innerHTML = "";

  state.tasks.forEach((task) => {

    const item =
      document.createElement("div");

    item.innerHTML = `
      <label>
        <input
          type="checkbox"
          ${task.done ? "checked" : ""}
          data-task="${task.id}"
        >
        ${escapeHTML(task.text)}
      </label>
    `;

    list.appendChild(item);
  });

  list.querySelectorAll("[data-task]")
    .forEach((checkbox) => {

      checkbox.addEventListener("change", () => {

        const task =
          state.tasks.find(
            (x) =>
              x.id === Number(
                checkbox.dataset.task
              )
          );

        if (!task) return;

        task.done =
          checkbox.checked;

        saveState();
      });
    });
}

function setupShopping() {
  renderShopping();

  $("#addShopping")?.addEventListener("click", () => {

    const input = $("#shoppingInput");
    const value = input.value.trim();

    if (!value) return;

    state.shopping.push({
      id: Date.now(),
      text: value,
      done: false
    });

    input.value = "";

    saveState();
    renderShopping();
  });
}

function renderShopping() {
  const list = $("#shoppingList");

  if (!list) return;

  list.innerHTML = "";

  state.shopping.forEach((item) => {

    const row =
      document.createElement("div");

    row.innerHTML = `
      <label>
        <input
          type="checkbox"
          ${item.done ? "checked" : ""}
          data-shopping="${item.id}"
        >
        ${escapeHTML(item.text)}
      </label>
    `;

    list.appendChild(row);
  });

  list.querySelectorAll("[data-shopping]")
    .forEach((checkbox) => {

      checkbox.addEventListener("change", () => {

        const item =
          state.shopping.find(
            (x) =>
              x.id === Number(
                checkbox.dataset.shopping
              )
          );

        if (!item) return;

        item.done =
          checkbox.checked;

        saveState();
      });
    });
}

/* =========================================================
   CONTRASEÑA
   ========================================================= */

function generatePassword() {

  const length =
    clamp(
      Number($("#passwordLength")?.value) || 16,
      4,
      64
    );

  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";

  const values =
    new Uint32Array(length);

  crypto.getRandomValues(values);

  let password = "";

  for (let i = 0; i < length; i++) {
    password +=
      chars[values[i] % chars.length];
  }

  $("#passwordResult").value =
    password;
}

/* =========================================================
   RELOJ
   ========================================================= */

let clockInterval;

function setupClock() {

  clearInterval(clockInterval);

  const update = () => {

    const now = new Date();

    $("#liveClock").textContent =
      now.toLocaleTimeString("es-PE");

    $("#liveDate").textContent =
      now.toLocaleDateString(
        "es-PE",
        {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        }
      );
  };

  update();

  clockInterval =
    setInterval(update, 1000);
}

/* =========================================================
   TIMER
   ========================================================= */

let timerInterval = null;
let timerRemaining = 0;

function setupTimer() {

  const display =
    $("#timerDisplay");

  function render() {
    const min =
      Math.floor(timerRemaining / 60);

    const sec =
      timerRemaining % 60;

    display.textContent =
      `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  $("#timerStart")?.addEventListener("click", () => {

    clearInterval(timerInterval);

    timerRemaining =
      Math.max(
        1,
        Number($("#timerSeconds").value)
      );

    render();

    timerInterval =
      setInterval(() => {

        timerRemaining--;

        render();

        if (timerRemaining <= 0) {
          clearInterval(timerInterval);
          toast("Temporizador terminado");
        }

      }, 1000);
  });

  $("#timerStop")?.addEventListener("click", () => {
    clearInterval(timerInterval);
  });
}

/* =========================================================
   CRONÓMETRO
   ========================================================= */

let stopwatchInterval = null;
let stopwatchStartTime = 0;
let stopwatchElapsed = 0;

function setupStopwatch() {

  const display =
    $("#stopwatchDisplay");

  const render = () => {

    const seconds =
      stopwatchElapsed / 1000;

    const minutes =
      Math.floor(seconds / 60);

    const remaining =
      seconds % 60;

    display.textContent =
      `${String(minutes).padStart(2, "0")}:${remaining
        .toFixed(1)
        .padStart(4, "0")}`;
  };

  $("#stopwatchStart")?.addEventListener(
    "click",
    () => {

      if (stopwatchInterval) return;

      stopwatchStartTime =
        performance.now() -
        stopwatchElapsed;

      stopwatchInterval =
        setInterval(() => {

          stopwatchElapsed =
            performance.now() -
            stopwatchStartTime;

          render();

        }, 100);

    }
  );

  $("#stopwatchStop")?.addEventListener(
    "click",
    () => {

      clearInterval(stopwatchInterval);
      stopwatchInterval = null;

    }
  );

  $("#stopwatchReset")?.addEventListener(
    "click",
    () => {

      clearInterval(stopwatchInterval);

      stopwatchInterval = null;
      stopwatchElapsed = 0;

      render();

    }
  );
}

/* =========================================================
   EXPORTAR / IMPORTAR
   ========================================================= */

$("#exportBtn")?.addEventListener("click", () => {

  const data =
    JSON.stringify(
      state,
      null,
      2
    );

  const blob =
    new Blob(
      [data],
      {
        type: "application/json"
      }
    );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;
  link.download =
    "utilhub-v24-datos.json";

  link.click();

  URL.revokeObjectURL(url);

  toast("Datos exportados");
});

$("#importBtn")?.addEventListener("click", () => {
  $("#importFile")?.click();
});

$("#importFile")?.addEventListener(
  "change",
  async (event) => {

    const file =
      event.target.files?.[0];

    if (!file) return;

    try {

      const text =
        await file.text();

      const imported =
        JSON.parse(text);

      state = {
        ...defaultState,
        ...imported
      };

      saveState();

      applyTheme();
      applyMotion();
      renderTools();
      renderQuickTools();
      updateStats();

      toast("Datos importados");

    } catch {
      toast("Archivo no válido");
    }

    event.target.value = "";
  }
);

/* =========================================================
   NOVA FLOW — MOTOR GLOBAL
   ========================================================= */

const canvas = $("#nova");
const ctx = canvas?.getContext("2d", {
  alpha: true
});

let width = 0;
let height = 0;
let dpr = 1;

let novaRunning = false;
let novaFrame = 0;

let pointer = {
  x: 0.5,
  y: 0.5,
  targetX: 0.5,
  targetY: 0.5
};

let scrollValue = 0;
let scrollTarget = 0;

let novaParticles = [];
let novaObjects = [];

let lastFrame = performance.now();
let fpsFrames = 0;
let fpsTime = performance.now();

function resizeNova() {

  if (!canvas || !ctx) return;

  width = window.innerWidth;
  height = window.innerHeight;

  dpr =
    Math.min(
      window.devicePixelRatio || 1,
      2
    );

  canvas.width =
    Math.max(1, Math.floor(width * dpr));

  canvas.height =
    Math.max(1, Math.floor(height * dpr));

  canvas.style.width =
    `${width}px`;

  canvas.style.height =
    `${height}px`;

  ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );

  createNovaObjects();
}

window.addEventListener(
  "resize",
  resizeNova,
  {
    passive: true
  }
);

window.addEventListener(
  "pointermove",
  (event) => {

    pointer.targetX =
      event.clientX / width;

    pointer.targetY =
      event.clientY / height;

    document.documentElement.style
      .setProperty(
        "--nova-x",
        `${event.clientX}px`
      );

    document.documentElement.style
      .setProperty(
        "--nova-y",
        `${event.clientY}px`
      );

  },
  {
    passive: true
  }
);

window.addEventListener(
  "scroll",
  () => {
    scrollTarget = window.scrollY;
  },
  {
    passive: true
  }
);

function particleCount() {

  switch (state.performance) {

    case "high":
      return 220;

    case "performance":
      return 70;

    case "low":
      return 40;

    case "balanced":
      return 130;

    default:
      return 110;
  }
}

function createParticles(count = particleCount()) {

  novaParticles =
    Array.from(
      { length: count },
      () => ({
        x: random(0, width),
        y: random(0, height),
        vx: random(-0.7, 0.7),
        vy: random(-0.7, 0.7),
        r: random(0.7, 2.5),
        life: random(0, 1),
        angle: random(0, Math.PI * 2),
        speed: random(0.2, 1.8),
        size: random(1, 4)
      })
    );
}

function createNovaObjects() {
  createParticles();

  novaObjects =
    Array.from(
      { length: Math.max(25, particleCount() / 3) },
      () => ({
        x: random(0, width),
        y: random(0, height),
        r: random(10, 80),
        angle: random(0, Math.PI * 2),
        speed: random(0.002, 0.02),
        size: random(1, 4)
      })
    );
}

function clearNova() {

  ctx.clearRect(
    0,
    0,
    width,
    height
  );

  const gradient =
    ctx.createRadialGradient(
      width * 0.5,
      height * 0.5,
      0,
      width * 0.5,
      height * 0.5,
      Math.max(width, height) * 0.75
    );

  gradient.addColorStop(
    0,
    "rgba(5,9,20,0.05)"
  );

  gradient.addColorStop(
    1,
    "rgba(5,9,20,0.42)"
  );

  ctx.fillStyle = gradient;

  ctx.fillRect(
    0,
    0,
    width,
    height
  );
}

function drawParticle(
  particle,
  color = "#00e5ff",
  alpha = 0.5
) {

  ctx.beginPath();

  ctx.arc(
    particle.x,
    particle.y,
    particle.r,
    0,
    Math.PI * 2
  );

  ctx.fillStyle =
    rgba(
      color,
      alpha * state.novaIntensity
    );

  ctx.fill();
}

/* =========================================================
   120 ANIMACIONES
   ========================================================= */

const NOVA_NAMES = [
  "Cosmic Drift",
  "Aurora Ribbon",
  "Pulse Field",
  "Matrix Rain",
  "Nebula Cloud",
  "Ocean Waves",
  "Starfield",
  "Vortex Spiral",
  "Fireflies",
  "Digital Rain",
  "Quantum Grid",
  "Golden Spiral",
  "Orbit Dance",
  "Plasma Flow",
  "DNA Helix",
  "Snowfall",
  "Lightning Web",
  "Galaxy Arms",
  "Comet Trails",
  "Quantum Rings",
  "Solar System",
  "Meteor Shower",
  "Bubble Field",
  "Hexagonal Space",
  "Water Ripples",
  "Spark Explosion",
  "Petal Dance",
  "Constellation",
  "Tunnel Flight",
  "Ring Pulse",
  "Glitch Field",
  "Spectrum Flow",
  "Fractal Bloom",
  "Satellite Orbit",
  "Electric Mesh",
  "Chrono Wheel",
  "Particle Fountain",
  "Mandala Spin",
  "Eclipse",
  "Crystal Prism",
  "Prism Rays",
  "Ink Universe",
  "Lava Motion",
  "Deep Ocean",
  "Desert Wind",
  "Forest Particles",
  "Ember Rise",
  "Smoke Trails",
  "Double Vortex",
  "Magnetic Field",
  "Kaleidoscope",
  "Clockwork",
  "Circuit Board",
  "Radar Sweep",
  "Sonar Rings",
  "Topographic Lines",
  "Blueprint",
  "Binary Storm",
  "Rainbow Arcs",
  "Aurora Spiral",
  "Comet Storm",
  "Firestorm",
  "Snowstorm",
  "Sandstorm",
  "Leafstorm",
  "Particle Swarm",
  "Flock Flight",
  "Wave Grid",
  "Moiré Motion",
  "Hologram",
  "Neon Lines",
  "Ribbon Dance",
  "Galaxy Expansion",
  "Supernova",
  "Wormhole",
  "Stardust",
  "Portal",
  "Heartbeat",
  "Equalizer",
  "Infinity",
  "Aurora Boreal",
  "Deep Space",
  "Star Pulse",
  "Quantum Dust",
  "Cosmic Rings",
  "Solar Flare",
  "Moonlight",
  "Dark Matter",
  "Gravity Well",
  "Asteroid Field",
  "Space Dust",
  "Energy Flow",
  "Neon Pulse",
  "Cyber Rain",
  "Digital Storm",
  "Laser Grid",
  "Techno Wave",
  "Infinity Tunnel",
  "Cosmic Portal",
  "Nova Core",
  "Crystal Rain",
  "Magnetic Storm",
  "Photon Garden",
  "Orbit Garden",
  "Time Fragments",
  "Cosmic Strings",
  "Light Cathedral",
  "Star Bloom",
  "Gravity Waves",
  "Quantum Garden",
  "Solar Threads",
  "Nova Spiral",
  "Celestial Clock",
  "Particle DNA",
  "Cosmic Mirror",
  "Energy Cathedral",
  "NOVA Infinity"
];

/*
  Cada función utiliza una geometría o comportamiento
  diferente. Las animaciones no son solamente cambios
  de color.
*/

function drawMode(index, t) {

  switch (index) {

    /* 01 */
    case 1:
      cosmicDrift(t);
      break;

    /* 02 */
    case 2:
      auroraRibbon(t);
      break;

    /* 03 */
    case 3:
      pulseField(t);
      break;

    /* 04 */
    case 4:
      matrixRain(t);
      break;

    /* 05 */
    case 5:
      nebulaCloud(t);
      break;

    /* 06 */
    case 6:
      oceanWaves(t);
      break;

    /* 07 */
    case 7:
      starfield(t);
      break;

    /* 08 */
    case 8:
      vortexSpiral(t);
      break;

    /* 09 */
    case 9:
      fireflies(t);
      break;

    /* 10 */
    case 10:
      digitalRain(t);
      break;

    /* 11 */
    case 11:
      quantumGrid(t);
      break;

    /* 12 */
    case 12:
      goldenSpiral(t);
      break;

    /* 13 */
    case 13:
      orbitDance(t);
      break;

    /* 14 */
    case 14:
      plasmaFlow(t);
      break;

    /* 15 */
    case 15:
      dnaHelix(t);
      break;

    /* 16 */
    case 16:
      snowfall(t);
      break;

    /* 17 */
    case 17:
      lightningWeb(t);
      break;

    /* 18 */
    case 18:
      galaxyArms(t);
      break;

    /* 19 */
    case 19:
      cometTrails(t);
      break;

    /* 20 */
    case 20:
      quantumRings(t);
      break;

    /* 21 */
    case 21:
      solarSystem(t);
      break;

    /* 22 */
    case 22:
      meteorShower(t);
      break;

    /* 23 */
    case 23:
      bubbleField(t);
      break;

    /* 24 */
    case 24:
      hexSpace(t);
      break;

    /* 25 */
    case 25:
      waterRipples(t);
      break;

    /* 26 */
    case 26:
      sparkExplosion(t);
      break;

    /* 27 */
    case 27:
      petalDance(t);
      break;

    /* 28 */
    case 28:
      constellation(t);
      break;

    /* 29 */
    case 29:
      tunnelFlight(t);
      break;

    /* 30 */
    case 30:
      ringPulse(t);
      break;

    /* 31 */
    case 31:
      glitchField(t);
      break;

    /* 32 */
    case 32:
      spectrumFlow(t);
      break;

    /* 33 */
    case 33:
      fractalBloom(t);
      break;

    /* 34 */
    case 34:
      satelliteOrbit(t);
      break;

    /* 35 */
    case 35:
      electricMesh(t);
      break;

    /* 36 */
    case 36:
      chronoWheel(t);
      break;

    /* 37 */
    case 37:
      particleFountain(t);
      break;

    /* 38 */
    case 38:
      mandalaSpin(t);
      break;

    /* 39 */
    case 39:
      eclipse(t);
      break;

    /* 40 */
    case 40:
      crystalPrism(t);
      break;

    /* 41 */
    case 41:
      prismRays(t);
      break;

    /* 42 */
    case 42:
      inkUniverse(t);
      break;

    /* 43 */
    case 43:
      lavaMotion(t);
      break;

    /* 44 */
    case 44:
      deepOcean(t);
      break;

    /* 45 */
    case 45:
      desertWind(t);
      break;

    /* 46 */
    case 46:
      forestParticles(t);
      break;

    /* 47 */
    case 47:
      emberRise(t);
      break;

    /* 48 */
    case 48:
      smokeTrails(t);
      break;

    /* 49 */
    case 49:
      doubleVortex(t);
      break;

    /* 50 */
    case 50:
      magneticField(t);
      break;

    /* 51 */
    case 51:
      kaleidoscope(t);
      break;

    /* 52 */
    case 52:
      clockwork(t);
      break;

    /* 53 */
    case 53:
      circuitBoard(t);
      break;

    /* 54 */
    case 54:
      radarSweep(t);
      break;

    /* 55 */
    case 55:
      sonarRings(t);
      break;

    /* 56 */
    case 56:
      topographic(t);
      break;

    /* 57 */
    case 57:
      blueprint(t);
      break;

    /* 58 */
    case 58:
      binaryStorm(t);
      break;

    /* 59 */
    case 59:
      rainbowArcs(t);
      break;

    /* 60 */
    case 60:
      auroraSpiral(t);
      break;

    /* 61 */
    case 61:
      cometStorm(t);
      break;

    /* 62 */
    case 62:
      firestorm(t);
      break;

    /* 63 */
    case 63:
      snowstorm(t);
      break;

    /* 64 */
    case 64:
      sandstorm(t);
      break;

    /* 65 */
    case 65:
      leafstorm(t);
      break;

    /* 66 */
    case 66:
      particleSwarm(t);
      break;

    /* 67 */
    case 67:
      flockFlight(t);
      break;

    /* 68 */
    case 68:
      waveGrid(t);
      break;

    /* 69 */
    case 69:
      moireMotion(t);
      break;

    /* 70 */
    case 70:
      hologram(t);
      break;

    /* 71 */
    case 71:
      neonLines(t);
      break;

    /* 72 */
    case 72:
      ribbonDance(t);
      break;

    /* 73 */
    case 73:
      galaxyExpansion(t);
      break;

    /* 74 */
    case 74:
      supernova(t);
      break;

    /* 75 */
    case 75:
      wormhole(t);
      break;

    /* 76 */
    case 76:
      stardust(t);
      break;

    /* 77 */
    case 77:
      portal(t);
      break;

    /* 78 */
    case 78:
      heartbeat(t);
      break;

    /* 79 */
    case 79:
      equalizer(t);
      break;

    /* 80 */
    case 80:
      infinity(t);
      break;

    /* 81 */
    case 81:
      auroraBoreal(t);
      break;

    /* 82 */
    case 82:
      deepSpace(t);
      break;

    /* 83 */
    case 83:
      starPulse(t);
      break;

    /* 84 */
    case 84:
      quantumDust(t);
      break;

    /* 85 */
    case 85:
      cosmicRings(t);
      break;

    /* 86 */
    case 86:
      solarFlare(t);
      break;

    /* 87 */
    case 87:
      moonlight(t);
      break;

    /* 88 */
    case 88:
      darkMatter(t);
      break;

    /* 89 */
    case 89:
      gravityWell(t);
      break;

    /* 90 */
    case 90:
      asteroidField(t);
      break;

    /* 91 */
    case 91:
      spaceDust(t);
      break;

    /* 92 */
    case 92:
      energyFlow(t);
      break;

    /* 93 */
    case 93:
      neonPulse(t);
      break;

    /* 94 */
    case 94:
      cyberRain(t);
      break;

    /* 95 */
    case 95:
      digitalStorm(t);
      break;

    /* 96 */
    case 96:
      laserGrid(t);
      break;

    /* 97 */
    case 97:
      technoWave(t);
      break;

    /* 98 */
    case 98:
      infinityTunnel(t);
      break;

    /* 99 */
    case 99:
      cosmicPortal(t);
      break;

    /* 100 */
    case 100:
      novaCore(t);
      break;

    /* 101 */
    case 101:
      crystalRain(t);
      break;

    /* 102 */
    case 102:
      magneticStorm(t);
      break;

    /* 103 */
    case 103:
      photonGarden(t);
      break;

    /* 104 */
    case 104:
      orbitGarden(t);
      break;

    /* 105 */
    case 105:
      timeFragments(t);
      break;

    /* 106 */
    case 106:
      cosmicStrings(t);
      break;

    /* 107 */
    case 107:
      lightCathedral(t);
      break;

    /* 108 */
    case 108:
      starBloom(t);
      break;

    /* 109 */
    case 109:
      gravityWaves(t);
      break;

    /* 110 */
    case 110:
      quantumGarden(t);
      break;

    /* 111 */
    case 111:
      solarThreads(t);
      break;

    /* 112 */
    case 112:
      novaSpiral(t);
      break;

    /* 113 */
    case 113:
      celestialClock(t);
      break;

    /* 114 */
    case 114:
      particleDNA(t);
      break;

    /* 115 */
    case 115:
      cosmicMirror(t);
      break;

    /* 116 */
    case 116:
      energyCathedral(t);
      break;

    /* 117 */
    case 117:
      novaInfinity(t);
      break;

    /* 118 */
    case 118:
      photonStorm(t);
      break;

    /* 119 */
    case 119:
      dimensionalGrid(t);
      break;

    /* 120 */
    case 120:
      finalNova(t);
      break;

    default:
      cosmicDrift(t);
  }
}

/* =========================================================
   FUNCIONES VISUALES — 1 A 20
   ========================================================= */

function cosmicDrift(t) {
  const cx = width / 2;
  const cy = height / 2;

  novaParticles.forEach((p, i) => {
    const a =
      p.angle +
      t * 0.00015 * p.speed;

    const radius =
      100 +
      i * 2.5;

    p.x =
      cx +
      Math.cos(a) * radius;

    p.y =
      cy +
      Math.sin(a) * radius * 0.55;

    drawParticle(p, "#00e5ff", 0.4);
  });
}

function auroraRibbon(t) {
  for (let x = 0; x < width; x += 10) {
    const y =
      height * 0.45 +
      Math.sin(x * 0.008 + t * 0.001) * 80 +
      Math.sin(x * 0.019 + t * 0.0007) * 35;

    ctx.fillStyle =
      `rgba(0,229,255,${0.04 * state.novaIntensity})`;

    ctx.fillRect(x, y, 9, height * 0.4);
  }
}

function pulseField(t) {
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < 14; i++) {
    const radius =
      ((t * 0.05 + i * 55) % Math.max(width, height));

    ctx.beginPath();

    ctx.arc(
      cx,
      cy,
      radius,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle =
      `rgba(123,97,255,${0.16 * (1 - radius / Math.max(width, height))})`;

    ctx.lineWidth = 2;

    ctx.stroke();
  }
}

function matrixRain(t) {
  const columns = Math.ceil(width / 22);

  for (let i = 0; i < columns; i++) {
    const x = i * 22;

    const y =
      ((t * 0.12 + i * 83) %
        (height + 300)) - 300;

    ctx.fillStyle =
      "rgba(0,255,140,0.32)";

    ctx.font = "13px monospace";

    for (let j = 0; j < 14; j++) {
      ctx.fillText(
        Math.random() > 0.5 ? "1" : "0",
        x,
        y + j * 18
      );
    }
  }
}

function nebulaCloud(t) {
  for (let i = 0; i < 12; i++) {
    const x =
      width * (0.15 + i * 0.07) +
      Math.sin(t * 0.0005 + i) * 80;

    const y =
      height * 0.5 +
      Math.cos(t * 0.0007 + i) * 130;

    const gradient =
      ctx.createRadialGradient(
        x,
        y,
        0,
        x,
        y,
        130
      );

    gradient.addColorStop(
      0,
      "rgba(123,97,255,0.10)"
    );

    gradient.addColorStop(
      1,
      "rgba(0,229,255,0)"
    );

    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.arc(x, y, 130, 0, Math.PI * 2);
    ctx.fill();
  }
}

function oceanWaves(t) {
  for (let row = 0; row < 8; row++) {

    ctx.beginPath();

    for (let x = 0; x <= width; x += 12) {

      const y =
        height * 0.45 +
        row * 45 +
        Math.sin(
          x * 0.012 +
          t * 0.001 +
          row
        ) * 18;

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle =
      `rgba(0,229,255,${0.09 * state.novaIntensity})`;

    ctx.stroke();
  }
}

function starfield(t) {
  novaParticles.forEach((p) => {
    p.y += p.speed * 0.8;

    if (p.y > height) {
      p.y = 0;
      p.x = random(0, width);
    }

    drawParticle(p, "#ffffff", 0.65);
  });
}

function vortexSpiral(t) {
  const cx = width / 2;
  const cy = height / 2;

  novaParticles.forEach((p, i) => {

    const a =
      i * 0.3 +
      t * 0.0005;

    const radius =
      (i * 4 + t * 0.03) %
      Math.max(width, height);

    p.x =
      cx +
      Math.cos(a) * radius;

    p.y =
      cy +
      Math.sin(a) * radius;

    drawParticle(p, "#ff4ecd", 0.45);
  });
}

function fireflies(t) {
  novaParticles.forEach((p, i) => {

    p.x +=
      Math.sin(t * 0.001 + i) * 0.35;

    p.y +=
      Math.cos(t * 0.0008 + i) * 0.3;

    const alpha =
      (Math.sin(t * 0.003 + i) + 1) / 2;

    drawParticle(
      p,
      "#ffe66d",
      alpha * 0.8
    );
  });
}

function digitalRain(t) {
  for (let i = 0; i < 25; i++) {

    const x =
      (i * 97) % width;

    const y =
      (t * (0.06 + i * 0.002) +
        i * 80) %
      height;

    ctx.fillStyle =
      "rgba(0,229,255,0.25)";

    ctx.fillRect(
      x,
      y,
      2,
      45
    );
  }
}

function quantumGrid(t) {
  const size = 55;

  for (let x = 0; x < width; x += size) {
    for (let y = 0; y < height; y += size) {

      const wave =
        Math.sin(
          t * 0.002 +
          x * 0.01 +
          y * 0.008
        );

      ctx.strokeStyle =
        `rgba(123,97,255,${0.025 + wave * 0.015})`;

      ctx.strokeRect(
        x,
        y,
        size,
        size
      );
    }
  }
}

function goldenSpiral(t) {
  const cx = width / 2;
  const cy = height / 2;

  ctx.beginPath();

  for (let i = 0; i < 900; i++) {

    const a =
      i * 0.12 +
      t * 0.0003;

    const r =
      i * 0.32;

    const x =
      cx +
      Math.cos(a) * r;

    const y =
      cy +
      Math.sin(a) * r;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.strokeStyle =
    "rgba(255,210,80,0.18)";

  ctx.stroke();
}

function orbitDance(t) {
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < 10; i++) {

    const a =
      t * 0.001 *
      (i % 2 ? 1 : -1) +
      i;

    const r =
      50 + i * 35;

    const x =
      cx + Math.cos(a) * r;

    const y =
      cy + Math.sin(a) * r * 0.65;

    ctx.beginPath();

    ctx.arc(
      x,
      y,
      4 + i * 0.25,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      "#00e5ff";

    ctx.fill();
  }
}

function plasmaFlow(t) {
  for (let i = 0; i < 12; i++) {

    ctx.beginPath();

    for (let x = 0; x < width; x += 12) {

      const y =
        height / 2 +
        i * 24 +
        Math.sin(
          x * 0.009 +
          t * 0.001 +
          i
        ) * 50;

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle =
      `rgba(255,78,205,${0.05 * state.novaIntensity})`;

    ctx.stroke();
  }
}

function dnaHelix(t) {
  const center = width / 2;

  for (let y = 0; y < height; y += 10) {

    const a =
      y * 0.035 +
      t * 0.001;

    const x1 =
      center +
      Math.sin(a) * 100;

    const x2 =
      center +
      Math.sin(a + Math.PI) * 100;

    ctx.fillStyle =
      "rgba(0,229,255,0.38)";

    ctx.fillRect(x1, y, 4, 4);

    ctx.fillStyle =
      "rgba(255,78,205,0.38)";

    ctx.fillRect(x2, y, 4, 4);

    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);

    ctx.strokeStyle =
      "rgba(123,97,255,0.12)";

    ctx.stroke();
  }
}

function snowfall(t) {
  novaParticles.forEach((p) => {

    p.y +=
      0.5 +
      p.speed * 0.4;

    p.x +=
      Math.sin(
        t * 0.001 +
        p.y * 0.01
      ) * 0.5;

    if (p.y > height) p.y = -5;

    drawParticle(
      p,
      "#dff8ff",
      0.5
    );
  });
}

function lightningWeb(t) {
  for (let i = 0; i < 8; i++) {

    let x =
      width * 0.1 +
      i * width * 0.11;

    let y = 0;

    ctx.beginPath();
    ctx.moveTo(x, y);

    for (let j = 0; j < 12; j++) {

      x += random(-25, 25);
      y += height / 12;

      ctx.lineTo(x, y);
    }

    ctx.strokeStyle =
      "rgba(120,220,255,0.18)";

    ctx.stroke();
  }
}

function galaxyArms(t) {
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < 700; i++) {

    const arm =
      i % 4;

    const r =
      i * 0.45;

    const a =
      r * 0.03 +
      arm * Math.PI / 2 +
      t * 0.0002;

    const x =
      cx + Math.cos(a) * r;

    const y =
      cy + Math.sin(a) * r * 0.6;

    ctx.fillStyle =
      `rgba(150,180,255,${0.15 * state.novaIntensity})`;

    ctx.fillRect(x, y, 2, 2);
  }
}

function cometTrails(t) {
  for (let i = 0; i < 12; i++) {

    const x =
      ((t * 0.2 + i * 170) %
        (width + 300)) - 150;

    const y =
      (i * 91) % height;

    ctx.beginPath();

    ctx.moveTo(x, y);

    ctx.lineTo(
      x - 130,
      y + 35
    );

    ctx.strokeStyle =
      "rgba(0,229,255,0.20)";

    ctx.lineWidth = 2;

    ctx.stroke();
  }
}

function quantumRings(t) {
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < 16; i++) {

    const radius =
      20 +
      i * 28 +
      Math.sin(t * 0.002 + i) * 8;

    ctx.beginPath();

    ctx.arc(
      cx,
      cy,
      radius,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle =
      `rgba(0,229,255,${0.05 + i * 0.003})`;

    ctx.stroke();
  }
}

/* =========================================================
   21 — 60
   ========================================================= */

function solarSystem(t) {
  const cx = width / 2;
  const cy = height / 2;

  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.fillStyle = "#ffd45a";
  ctx.fill();

  for (let i = 0; i < 6; i++) {

    const r = 50 + i * 45;
    const a = t * 0.001 / (i + 1);

    ctx.beginPath();
    ctx.arc(
      cx,
      cy,
      r,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle =
      "rgba(255,255,255,0.07)";

    ctx.stroke();

    ctx.beginPath();

    ctx.arc(
      cx + Math.cos(a) * r,
      cy + Math.sin(a) * r,
      5,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      "#00e5ff";

    ctx.fill();
  }
}

function meteorShower(t) {
  for (let i = 0; i < 30; i++) {

    const x =
      ((t * 0.4 + i * 180) %
        (width + 300)) - 150;

    const y =
      ((t * 0.2 + i * 97) %
        (height + 200)) - 100;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 45, y + 45);

    ctx.strokeStyle =
      "rgba(255,255,255,0.16)";

    ctx.stroke();
  }
}

function bubbleField(t) {
  novaObjects.forEach((o, i) => {

    o.y =
      (o.y - 0.25 - o.speed * 4 + height) %
      height;

    ctx.beginPath();

    ctx.arc(
      o.x,
      o.y,
      o.r * 0.35,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle =
      "rgba(0,229,255,0.13)";

    ctx.stroke();
  });
}

function hexSpace(t) {
  const size = 50;

  for (let row = -1; row < height / size + 1; row++) {

    for (let col = -1; col < width / size + 1; col++) {

      const x =
        col * size * 1.5;

      const y =
        row * size * 1.73 +
        (col % 2) * size * 0.86;

      ctx.beginPath();

      for (let i = 0; i < 6; i++) {

        const a =
          Math.PI / 3 * i;

        const px =
          x + Math.cos(a) * 18;

        const py =
          y + Math.sin(a) * 18;

        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }

      ctx.closePath();

      ctx.strokeStyle =
        "rgba(123,97,255,0.045)";

      ctx.stroke();
    }
  }
}

function waterRipples(t) {
  for (let i = 0; i < 9; i++) {

    const x =
      width * (0.1 + i * 0.1);

    const y =
      height * 0.55 +
      Math.sin(t * 0.001 + i) * 80;

    const radius =
      (t * 0.04 + i * 80) %
      260;

    ctx.beginPath();

    ctx.ellipse(
      x,
      y,
      radius,
      radius * 0.35,
      0,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle =
      "rgba(0,229,255,0.12)";

    ctx.stroke();
  }
}

function sparkExplosion(t) {
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < 150; i++) {

    const a =
      i * 2.399 +
      t * 0.0003;

    const r =
      (t * 0.15 + i * 5) %
      500;

    ctx.fillStyle =
      "rgba(255,255,255,0.15)";

    ctx.fillRect(
      cx + Math.cos(a) * r,
      cy + Math.sin(a) * r,
      2,
      2
    );
  }
}

function petalDance(t) {
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < 80; i++) {

    const a =
      i * 0.7 +
      t * 0.0003;

    const r =
      80 +
      130 *
      Math.sin(i * 0.5 + t * 0.001);

    const x =
      cx + Math.cos(a) * r;

    const y =
      cy + Math.sin(a) * r;

    ctx.beginPath();

    ctx.ellipse(
      x,
      y,
      5,
      15,
      a,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      "rgba(255,78,205,0.10)";

    ctx.fill();
  }
}

function constellation(t) {
  const points =
    novaParticles.slice(0, 55);

  points.forEach((p) => {
    p.x += p.vx * 0.1;
    p.y += p.vy * 0.1;

    drawParticle(
      p,
      "#b7d8ff",
      0.45
    );
  });

  for (let i = 0; i < points.length; i++) {

    for (let j = i + 1; j < points.length; j++) {

      const d =
        distance(
          points[i],
          points[j]
        );

      if (d < 120) {

        ctx.beginPath();

        ctx.moveTo(
          points[i].x,
          points[i].y
        );

        ctx.lineTo(
          points[j].x,
          points[j].y
        );

        ctx.strokeStyle =
          `rgba(0,229,255,${0.07 * (1 - d / 120)})`;

        ctx.stroke();
      }
    }
  }
}

function tunnelFlight(t) {
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < 35; i++) {

    const z =
      ((t * 0.15 + i * 35) % 700);

    const scale =
      700 / (700 - z + 1);

    const r =
      100 * scale;

    ctx.strokeStyle =
      `rgba(123,97,255,${0.08 * scale})`;

    ctx.strokeRect(
      cx - r,
      cy - r,
      r * 2,
      r * 2
    );
  }
}

function ringPulse(t) {
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < 8; i++) {

    const pulse =
      (t * 0.1 + i * 70) % 600;

    ctx.beginPath();

    ctx.arc(
      cx,
      cy,
      pulse,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle =
      `rgba(0,229,255,${0.16 * (1 - pulse / 600)})`;

    ctx.stroke();
  }
}

function glitchField(t) {
  for (let i = 0; i < 30; i++) {

    const y =
      random(0, height);

    const x =
      random(0, width);

    const w =
      random(10, 150);

    ctx.fillStyle =
      Math.random() > 0.5
        ? "rgba(0,229,255,0.07)"
        : "rgba(255,78,205,0.07)";

    ctx.fillRect(
      x,
      y,
      w,
      random(1, 5)
    );
  }
}

function spectrumFlow(t) {
  for (let i = 0; i < 7; i++) {

    ctx.beginPath();

    for (let x = 0; x < width; x += 8) {

      const y =
        height / 2 +
        i * 35 +
        Math.sin(
          x * 0.012 +
          t * 0.001 +
          i
        ) * 45;

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle =
      `hsla(${i * 50 + t * 0.03},90%,65%,0.13)`;

    ctx.stroke();
  }
}

function fractalBloom(t) {
  function branch(x, y, length, angle, depth) {

    if (depth <= 0) return;

    const x2 =
      x + Math.cos(angle) * length;

    const y2 =
      y + Math.sin(angle) * length;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);

    ctx.strokeStyle =
      `rgba(123,97,255,${depth * 0.012})`;

    ctx.stroke();

    branch(
      x2,
      y2,
      length * 0.7,
      angle + 0.45,
      depth - 1
    );

    branch(
      x2,
      y2,
      length * 0.7,
      angle - 0.45,
      depth - 1
    );
  }

  branch(
    width / 2,
    height,
    150,
    -Math.PI / 2,
    7
  );
}

function satelliteOrbit(t) {
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < 5; i++) {

    const r =
      80 + i * 70;

    const a =
      t * 0.0005 *
      (i + 1);

    ctx.strokeStyle =
      "rgba(255,255,255,0.05)";

    ctx.beginPath();

    ctx.arc(
      cx,
      cy,
      r,
      0,
      Math.PI * 2
    );

    ctx.stroke();

    ctx.fillStyle =
      "#00e5ff";

    ctx.fillRect(
      cx + Math.cos(a) * r - 3,
      cy + Math.sin(a) * r - 3,
      6,
      6
    );
  }
}

function electricMesh(t) {
  for (let i = 0; i < 10; i++) {

    ctx.beginPath();

    for (let x = 0; x < width; x += 20) {

      const y =
        i * height / 10 +
        Math.sin(
          x * 0.02 +
          t * 0.002 +
          i
        ) * 25;

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle =
      "rgba(0,229,255,0.10)";

    ctx.stroke();
  }
}

function chronoWheel(t) {
  const cx = width / 2;
  const cy = height / 2;

  ctx.beginPath();

  ctx.arc(
    cx,
    cy,
    130,
    0,
    Math.PI * 2
  );

  ctx.strokeStyle =
    "rgba(0,229,255,0.12)";

  ctx.stroke();

  for (let i = 0; i < 60; i++) {

    const a =
      i * Math.PI * 2 / 60;

    const r1 =
      i % 5 === 0
        ? 112
        : 120;

    const r2 = 130;

    ctx.beginPath();

    ctx.moveTo(
      cx + Math.cos(a) * r1,
      cy + Math.sin(a) * r1
    );

    ctx.lineTo(
      cx + Math.cos(a) * r2,
      cy + Math.sin(a) * r2
    );

    ctx.strokeStyle =
      "rgba(255,255,255,0.10)";

    ctx.stroke();
  }
}

function particleFountain(t) {
  const cx = width / 2;

  for (let i = 0; i < 100; i++) {

    const a =
      i * 0.3;

    const y =
      height -
      ((t * 0.12 + i * 12) %
        height);

    const spread =
      Math.sin(
        (y / height) *
        Math.PI
      ) * 250;

    const x =
      cx +
      Math.sin(a) * spread;

    ctx.fillStyle =
      "rgba(0,229,255,0.16)";

    ctx.fillRect(
      x,
      y,
      3,
      3
    );
  }
}

function mandalaSpin(t) {
  const cx = width / 2;
  const cy = height / 2;

  for (let ring = 1; ring < 7; ring++) {

    ctx.beginPath();

    for (let i = 0; i <= 360; i += 4) {

      const a =
        i * Math.PI / 180 +
        t * 0.0002 *
        (ring % 2 ? 1 : -1);

      const r =
        ring * 30 +
        Math.sin(a * 6) * 12;

      const x =
        cx + Math.cos(a) * r;

      const y =
        cy + Math.sin(a) * r;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle =
      "rgba(255,78,205,0.08)";

    ctx.stroke();
  }
}

function eclipse(t) {
  const x =
    width / 2 +
    Math.sin(t * 0.0002) * width * 0.25;

  const y =
    height / 2;

  ctx.beginPath();

  ctx.arc(
    x,
    y,
    90,
    0,
    Math.PI * 2
  );

  ctx.fillStyle =
    "rgba(0,0,0,0.45)";

  ctx.fill();

  ctx.beginPath();

  ctx.arc(
    x - 20,
    y - 20,
    105,
    0,
    Math.PI * 2
  );

  ctx.strokeStyle =
    "rgba(255,220,100,0.16)";

  ctx.stroke();
}

function crystalPrism(t) {
  for (let i = 0; i < 8; i++) {

    const x =
      width * (0.1 + i * 0.11);

    const h =
      100 +
      Math.sin(t * 0.001 + i) * 60;

    ctx.beginPath();

    ctx.moveTo(x, height * 0.7);
    ctx.lineTo(x + 30, height * 0.7 - h);
    ctx.lineTo(x + 60, height * 0.7);

    ctx.closePath();

    ctx.fillStyle =
      "rgba(123,97,255,0.05)";

    ctx.fill();

    ctx.strokeStyle =
      "rgba(0,229,255,0.08)";

    ctx.stroke();
  }
}

function prismRays(t) {
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < 24; i++) {

    const a =
      i * Math.PI * 2 / 24 +
      t * 0.0001;

    ctx.beginPath();

    ctx.moveTo(cx, cy);

    ctx.lineTo(
      cx + Math.cos(a) * width,
      cy + Math.sin(a) * height
    );

    ctx.strokeStyle =
      `hsla(${i * 15},90%,70%,0.035)`;

    ctx.stroke();
  }
}

function inkUniverse(t) {
  for (let i = 0; i < 15; i++) {

    const x =
      width * 0.5 +
      Math.sin(t * 0.0003 + i) * 300;

    const y =
      height * 0.5 +
      Math.cos(t * 0.0004 + i) * 250;

    ctx.beginPath();

    ctx.arc(
      x,
      y,
      30 + i * 3,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      "rgba(20,30,50,0.08)";

    ctx.fill();
  }
}

function lavaMotion(t) {
  for (let i = 0; i < 8; i++) {

    ctx.beginPath();

    for (let x = 0; x < width; x += 15) {

      const y =
        height * 0.6 +
        i * 30 +
        Math.sin(
          x * 0.018 +
          t * 0.0007
        ) * 25;

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle =
      "rgba(255,90,30,0.10)";

    ctx.stroke();
  }
}

function deepOcean(t) {
  for (let i = 0; i < 20; i++) {

    const y =
      (i / 20) * height;

    const x =
      width * 0.5 +
      Math.sin(
        t * 0.0003 +
        i
      ) * 300;

    ctx.beginPath();

    ctx.moveTo(x, y);

    ctx.lineTo(
      x + 100,
      y + 30
    );

    ctx.strokeStyle =
      "rgba(0,130,255,0.06)";

    ctx.stroke();
  }
}

function desertWind(t) {
  for (let i = 0; i < 30; i++) {

    const y =
      i * 20 +
      Math.sin(t * 0.0004 + i) * 10;

    ctx.beginPath();

    ctx.moveTo(0, y);

    ctx.quadraticCurveTo(
      width * 0.5,
      y - 50,
      width,
      y + 20
    );

    ctx.strokeStyle =
      "rgba(230,190,120,0.07)";

    ctx.stroke();
  }
}

function forestParticles(t) {
  for (let i = 0; i < 80; i++) {

    const x =
      (i * 137 +
        Math.sin(t * 0.0003 + i) * 30) %
      width;

    const y =
      height -
      ((t * 0.015 + i * 29) %
        height);

    ctx.beginPath();

    ctx.arc(
      x,
      y,
      3,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      "rgba(80,220,130,0.12)";

    ctx.fill();
  }
}

function emberRise(t) {
  for (let i = 0; i < 90; i++) {

    const x =
      width / 2 +
      Math.sin(i * 3 + t * 0.001) *
      (50 + i);

    const y =
      height -
      ((t * 0.04 + i * 17) %
        height);

    ctx.fillStyle =
      "rgba(255,100,30,0.18)";

    ctx.fillRect(
      x,
      y,
      3,
      3
    );
  }
}

function smokeTrails(t) {
  for (let i = 0; i < 15; i++) {

    ctx.beginPath();

    for (let y = height; y > 0; y -= 15) {

      const x =
        width / 2 +
        Math.sin(
          y * 0.01 +
          t * 0.0005 +
          i
        ) * (80 + i * 5);

      if (y === height) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle =
      "rgba(170,180,200,0.04)";

    ctx.stroke();
  }
}

function doubleVortex(t) {
  const centers = [
    {
      x: width * 0.33,
      y: height / 2
    },
    {
      x: width * 0.67,
      y: height / 2
    }
  ];

  centers.forEach((c, ci) => {

    for (let i = 0; i < 150; i++) {

      const a =
        i * 0.18 +
        t * 0.0003 *
        (ci ? -1 : 1);

      const r =
        i * 0.8;

      ctx.fillStyle =
        "rgba(123,97,255,0.10)";

      ctx.fillRect(
        c.x + Math.cos(a) * r,
        c.y + Math.sin(a) * r,
        2,
        2
      );
    }
  });
}

function magneticField(t) {
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < 20; i++) {

    ctx.beginPath();

    for (let a = 0; a < Math.PI * 2; a += 0.08) {

      const r =
        80 +
        i * 13 +
        Math.sin(a * 4 + t * 0.001) * 15;

      const x =
        cx + Math.cos(a) * r;

      const y =
        cy + Math.sin(a) * r * 0.55;

      if (a === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle =
      "rgba(0,229,255,0.05)";

    ctx.stroke();
  }
}

function kaleidoscope(t) {
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < 16; i++) {

    const a =
      i * Math.PI / 8 +
      t * 0.0002;

    const length =
      100 +
      Math.sin(t * 0.001 + i) * 100;

    ctx.beginPath();

    ctx.moveTo(cx, cy);

    ctx.lineTo(
      cx + Math.cos(a) * length,
      cy + Math.sin(a) * length
    );

    ctx.strokeStyle =
      `hsla(${i * 22},90%,70%,0.08)`;

    ctx.stroke();
  }
}

function clockwork(t) {
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < 5; i++) {

    const r =
      50 + i * 45;

    ctx.beginPath();

    ctx.arc(
      cx + (i % 2 ? 40 : -40),
      cy + (i % 3 ? 20 : -20),
      r,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle =
      "rgba(255,210,100,0.08)";

    ctx.stroke();
  }
}

function circuitBoard(t) {
  const size = 60;

  for (let x = 0; x < width; x += size) {

    for (let y = 0; y < height; y += size) {

      ctx.beginPath();

      ctx.moveTo(x, y);

      ctx.lineTo(
        x + size / 2,
        y
      );

      ctx.lineTo(
        x + size / 2,
        y + size / 2
      );

      ctx.lineTo(
        x + size,
        y + size / 2
      );

      ctx.strokeStyle =
        "rgba(0,229,255,0.05)";

      ctx.stroke();
    }
  }
}

function radarSweep(t) {
  const cx = width / 2;
  const cy = height / 2;

  const r =
    Math.min(width, height) * 0.4;

  ctx.beginPath();

  ctx.moveTo(cx, cy);

  const a =
    t * 0.001;

  ctx.lineTo(
    cx + Math.cos(a) * r,
    cy + Math.sin(a) * r
  );

  ctx.strokeStyle =
    "rgba(0,255,140,0.25)";

  ctx.stroke();

  ctx.beginPath();

  ctx.arc(
    cx,
    cy,
    r,
    0,
    Math.PI * 2
  );

  ctx.strokeStyle =
    "rgba(0,255,140,0.08)";

  ctx.stroke();
}

function sonarRings(t) {
  const cx = width * 0.5;
  const cy = height * 0.6;

  for (let i = 0; i < 8; i++) {

    const r =
      ((t * 0.04 + i * 100) % 700);

    ctx.beginPath();

    ctx.arc(
      cx,
      cy,
      r,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle =
      `rgba(0,229,255,${0.12 * (1 - r / 700)})`;

    ctx.stroke();
  }
}

function topographic(t) {
  for (let i = 0; i < 18; i++) {

    ctx.beginPath();

    for (let x = 0; x <= width; x += 10) {

      const y =
        height * 0.5 +
        i * 22 +
        Math.sin(
          x * 0.008 +
          i * 0.8 +
          t * 0.0002
        ) * 70;

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle =
      "rgba(0,229,255,0.045)";

    ctx.stroke();
  }
}

function blueprint(t) {
  const gap = 80;

  ctx.strokeStyle =
    "rgba(80,150,255,0.05)";

  for (let x = 0; x < width; x += gap) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y < height; y += gap) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function binaryStorm(t) {
  ctx.font = "12px monospace";

  for (let i = 0; i < 120; i++) {

    const x =
      (i * 83) % width;

    const y =
      ((t * 0.07 + i * 37) %
        height);

    ctx.fillStyle =
      "rgba(0,229,255,0.12)";

    ctx.fillText(
      i % 2 ? "1" : "0",
      x,
      y
    );
  }
}

function rainbowArcs(t) {
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < 12; i++) {

    ctx.beginPath();

    ctx.arc(
      cx,
      cy,
      60 + i * 35,
      Math.PI + 0.3,
      Math.PI * 2 - 0.3
    );

    ctx.strokeStyle =
      `hsla(${i * 30 + t * 0.02},90%,65%,0.10)`;

    ctx.lineWidth = 4;

    ctx.stroke();
  }
}

function auroraSpiral(t) {
  const cx = width / 2;
  const cy = height / 2;

  ctx.beginPath();

  for (let i = 0; i < 700; i++) {

    const a =
      i * 0.08 +
      t * 0.0003;

    const r =
      i * 0.4;

    const x =
      cx +
      Math.cos(a) *
      r *
      (1 + Math.sin(t * 0.0005) * 0.2);

    const y =
      cy +
      Math.sin(a) *
      r *
      0.5;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.strokeStyle =
    "rgba(0,255,200,0.10)";

  ctx.stroke();
}

/* =========================================================
   61 — 100
   ========================================================= */

function cometStorm(t) {
  for (let i = 0; i < 35; i++) {

    const x =
      ((t * 0.25 + i * 91) %
        (width + 300)) - 150;

    const y =
      ((i * 73) + t * 0.08) %
      height;

    ctx.beginPath();

    ctx.moveTo(x, y);

    ctx.lineTo(
      x - 80,
      y + 30
    );

    ctx.strokeStyle =
      "rgba(255,255,255,0.13)";

    ctx.stroke();
  }
}

function firestorm(t) {
  for (let i = 0; i < 100; i++) {

    const x =
      width / 2 +
      Math.sin(i * 4 + t * 0.002) *
      (50 + i);

    const y =
      height -
      ((t * 0.05 + i * 11) %
        height);

    ctx.fillStyle =
      `rgba(255,${80 + i % 100},20,0.12)`;

    ctx.fillRect(
      x,
      y,
      3,
      7
    );
  }
}

function snowstorm(t) {
  for (let i = 0; i < 140; i++) {

    const x =
      (i * 67 +
        Math.sin(t * 0.0005 + i) * 40) %
      width;

    const y =
      (i * 43 +
        t * 0.04) %
      height;

    ctx.beginPath();

    ctx.arc(
      x,
      y,
      2,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      "rgba(220,245,255,0.18)";

    ctx.fill();
  }
}

function sandstorm(t) {
  for (let i = 0; i < 100; i++) {

    const y =
      (i * 23) %
      height;

    const x =
      ((t * 0.15 + i * 61) %
        (width + 200)) - 100;

    ctx.fillStyle =
      "rgba(230,190,120,0.12)";

    ctx.fillRect(
      x,
      y,
      random(10, 60),
      2
    );
  }
}

function leafstorm(t) {
  for (let i = 0; i < 70; i++) {

    const x =
      ((i * 83 + t * 0.03) %
        (width + 100)) - 50;

    const y =
      ((i * 51 + t * 0.025) %
        (height + 100)) - 50;

    ctx.save();

    ctx.translate(x, y);

    ctx.rotate(
      Math.sin(t * 0.001 + i)
    );

    ctx.fillStyle =
      "rgba(90,220,120,0.12)";

    ctx.fillRect(
      -4,
      -8,
      8,
      16
    );

    ctx.restore();
  }
}

function particleSwarm(t) {
  novaParticles.forEach((p, i) => {

    const targetX =
      width / 2 +
      Math.sin(t * 0.001 + i) * 250;

    const targetY =
      height / 2 +
      Math.cos(t * 0.0008 + i) * 180;

    p.x =
      lerp(
        p.x,
        targetX,
        0.002
      );

    p.y =
      lerp(
        p.y,
        targetY,
        0.002
      );

    drawParticle(
      p,
      "#00e5ff",
      0.3
    );
  });
}

function flockFlight(t) {
  for (let i = 0; i < 35; i++) {

    const x =
      width * 0.5 +
      Math.sin(t * 0.0005 + i) *
      (100 + i * 7);

    const y =
      height * 0.45 +
      Math.cos(t * 0.0008 + i) *
      100;

    ctx.beginPath();

    ctx.moveTo(x, y);
    ctx.lineTo(x - 10, y + 5);
    ctx.lineTo(x + 2, y + 10);
    ctx.closePath();

    ctx.fillStyle =
      "rgba(200,220,255,0.13)";

    ctx.fill();
  }
}

function waveGrid(t) {
  for (let x = 0; x < width; x += 35) {

    for (let y = 0; y < height; y += 35) {

      const z =
        Math.sin(
          x * 0.02 +
          y * 0.02 +
          t * 0.001
        );

      ctx.beginPath();

      ctx.arc(
        x,
        y + z * 15,
        2,
        0,
        Math.PI * 2
      );

      ctx.fillStyle =
        "rgba(0,229,255,0.10)";

      ctx.fill();
    }
  }
}

function moireMotion(t) {
  for (let i = 0; i < 30; i++) {

    ctx.beginPath();

    ctx.arc(
      width / 2,
      height / 2,
      30 + i * 18 +
        Math.sin(t * 0.001) * 20,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle =
      "rgba(255,255,255,0.035)";

    ctx.stroke();
  }
}

function hologram(t) {
  for (let i = 0; i < 20; i++) {

    const y =
      (i * 43 +
        t * 0.025) %
      height;

    ctx.fillStyle =
      `rgba(0,229,255,${0.015 + i % 3 * 0.01})`;

    ctx.fillRect(
      0,
      y,
      width,
      1
    );
  }
}

function neonLines(t) {
  for (let i = 0; i < 14; i++) {

    const y =
      height / 2 +
      Math.sin(
        t * 0.001 +
        i
      ) * 180;

    ctx.beginPath();

    ctx.moveTo(0, y);

    ctx.lineTo(width, y);

    ctx.strokeStyle =
      `hsla(${190 + i * 8},100%,65%,0.07)`;

    ctx.lineWidth = 2;

    ctx.stroke();
  }
}

function ribbonDance(t) {
  for (let i = 0; i < 7; i++) {

    ctx.beginPath();

    for (let x = 0; x < width; x += 10) {

      const y =
        height / 2 +
        i * 25 +
        Math.sin(
          x * 0.008 +
          t * 0.001 +
          i
        ) * 100;

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle =
      `hsla(${180 + i * 25},90%,70%,0.08)`;

    ctx.lineWidth = 5;

    ctx.stroke();
  }
}

function galaxyExpansion(t) {
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < 600; i++) {

    const a =
      i * 0.2;

    const r =
      ((t * 0.06 + i * 2) %
        500);

    ctx.fillStyle =
      "rgba(190,200,255,0.11)";

    ctx.fillRect(
      cx + Math.cos(a) * r,
      cy + Math.sin(a) * r * 0.6,
      2,
      2
    );
  }
}

function supernova(t) {
  const cx = width / 2;
  const cy = height / 2;

  const pulse =
    50 +
    Math.sin(t * 0.002) * 35;

  const gradient =
    ctx.createRadialGradient(
      cx,
      cy,
      0,
      cx,
      cy,
      pulse * 5
    );

  gradient.addColorStop(
    0,
    "rgba(255,255,255,0.18)"
  );

  gradient.addColorStop(
    0.25,
    "rgba(0,229,255,0.10)"
  );

  gradient.addColorStop(
    1,
    "rgba(123,97,255,0)"
  );

  ctx.fillStyle = gradient;

  ctx.fillRect(
    0,
    0,
    width,
    height
  );
}

function wormhole(t) {
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < 30; i++) {

    const z =
      ((t * 0.12 + i * 25) %
        600);

    const scale =
      1 + z / 250;

    ctx.beginPath();

    ctx.ellipse(
      cx,
      cy,
      40 * scale,
      20 * scale,
      t * 0.0002 + i,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle =
      "rgba(123,97,255,0.07)";

    ctx.stroke();
  }
}

function stardust(t) {
  for (let i = 0; i < 500; i++) {

    const a =
      i * 0.31;

    const r =
      20 +
      ((i * 7 + t * 0.02) % 500);

    ctx.fillStyle =
      "rgba(255,255,255,0.08)";

    ctx.fillRect(
      width / 2 + Math.cos(a) * r,
      height / 2 + Math.sin(a) * r,
      1.5,
      1.5
    );
  }
}

function portal(t) {
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < 15; i++) {

    const r =
      40 +
      i * 25 +
      Math.sin(t * 0.001 + i) * 10;

    ctx.beginPath();

    ctx.arc(
      cx,
      cy,
      r,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle =
      `rgba(255,78,205,${0.10 - i * 0.004})`;

    ctx.stroke();
  }
}

function heartbeat(t) {
  const cx = width / 2;

  ctx.beginPath();

  for (let x = 0; x < width; x += 4) {

    let y = height / 2;

    const local =
      (x / width) * 8 -
      (t * 0.002 % 8);

    if (Math.abs(local - 4) < 0.3) {
      y -=
        Math.sin(
          (local - 4) * 15
        ) * 80;
    }

    if (x === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.strokeStyle =
    "rgba(255,78,120,0.16)";

  ctx.lineWidth = 2;

  ctx.stroke();
}

function equalizer(t) {
  for (let i = 0; i < 60; i++) {

    const h =
      30 +
      Math.abs(
        Math.sin(
          t * 0.003 +
          i * 0.4
        )
      ) * 170;

    ctx.fillStyle =
      `hsla(${180 + i * 2},90%,65%,0.08)`;

    ctx.fillRect(
      i * width / 60,
      height / 2 - h / 2,
      width / 70,
      h
    );
  }
}

function infinity(t) {
  const cx = width / 2;
  const cy = height / 2;

  ctx.beginPath();

  for (let a = 0; a <= Math.PI * 2; a += 0.01) {

    const x =
      cx +
      Math.sin(a) *
      180;

    const y =
      cy +
      Math.sin(a * 2) *
      80;

    if (a === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.strokeStyle =
    "rgba(0,229,255,0.12)";

  ctx.stroke();
}

/* =========================================================
   81 — 120
   ========================================================= */

function auroraBoreal(t) {
  for (let i = 0; i < 10; i++) {

    ctx.beginPath();

    for (let x = 0; x <= width; x += 8) {

      const y =
        height * 0.35 +
        i * 22 +
        Math.sin(
          x * 0.006 +
          t * 0.0006 +
          i
        ) * 100;

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle =
      `hsla(${150 + i * 18},90%,65%,0.09)`;

    ctx.lineWidth = 7;

    ctx.stroke();
  }
}

function deepSpace(t) {
  const gradient =
    ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height)
    );

  gradient.addColorStop(
    0,
    "rgba(30,10,80,0.08)"
  );

  gradient.addColorStop(
    1,
    "rgba(0,0,0,0)"
  );

  ctx.fillStyle = gradient;

  ctx.fillRect(
    0,
    0,
    width,
    height
  );
}

function starPulse(t) {
  for (let i = 0; i < 80; i++) {

    const x =
      (i * 113) % width;

    const y =
      (i * 67) % height;

    const r =
      1 +
      Math.max(
        0,
        Math.sin(t * 0.003 + i)
      ) * 5;

    ctx.beginPath();

    ctx.arc(
      x,
      y,
      r,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      "rgba(255,255,255,0.18)";

    ctx.fill();
  }
}

function quantumDust(t) {
  for (let i = 0; i < 180; i++) {

    const x =
      width / 2 +
      Math.sin(i + t * 0.001) *
      (100 + i);

    const y =
      height / 2 +
      Math.cos(i * 0.7 + t * 0.001) *
      (80 + i * 0.5);

    ctx.fillStyle =
      "rgba(150,100,255,0.10)";

    ctx.fillRect(
      x,
      y,
      2,
      2
    );
  }
}

function cosmicRings(t) {
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < 18; i++) {

    const rx =
      50 + i * 25;

    const ry =
      rx * 0.4;

    ctx.beginPath();

    ctx.ellipse(
      cx,
      cy,
      rx,
      ry,
      t * 0.0002 + i * 0.1,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle =
      "rgba(0,229,255,0.06)";

    ctx.stroke();
  }
}

function solarFlare(t) {
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < 40; i++) {

    const a =
      i * 0.7 +
      t * 0.0003;

    const length =
      100 +
      Math.sin(t * 0.002 + i) * 80;

    ctx.beginPath();

    ctx.moveTo(cx, cy);

    ctx.lineTo(
      cx + Math.cos(a) * length,
      cy + Math.sin(a) * length
    );

    ctx.strokeStyle =
      "rgba(255,180,50,0.08)";

    ctx.stroke();
  }
}

function moonlight(t) {
  const x =
    width * 0.72;

  const y =
    height * 0.25;

  const gradient =
    ctx.createRadialGradient(
      x,
      y,
      0,
      x,
      y,
      250
    );

  gradient.addColorStop(
    0,
    "rgba(180,210,255,0.12)"
  );

  gradient.addColorStop(
    1,
    "rgba(180,210,255,0)"
  );

  ctx.fillStyle = gradient;

  ctx.fillRect(
    0,
    0,
    width,
    height
  );

  ctx.beginPath();

  ctx.arc(
    x,
    y,
    65,
    0,
    Math.PI * 2
  );

  ctx.fillStyle =
    "rgba(220,235,255,0.12)";

  ctx.fill();
}

function darkMatter(t) {
  for (let i = 0; i < 15; i++) {

    const x =
      width / 2 +
      Math.sin(t * 0.0003 + i) * 350;

    const y =
      height / 2 +
      Math.cos(t * 0.0004 + i) * 250;

    ctx.beginPath();

    ctx.arc(
      x,
      y,
      40 + i * 5,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle =
      "rgba(80,40,150,0.06)";

    ctx.stroke();
  }
}

function gravityWell(t) {
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < 200; i++) {

    const a =
      i * 0.3;

    const r =
      40 +
      ((i * 5 + t * 0.04) % 350);

    const curve =
      r * 0.003;

    const x =
      cx +
      Math.cos(a + curve) * r;

    const y =
      cy +
      Math.sin(a + curve) * r * 0.6;

    ctx.fillStyle =
      "rgba(123,97,255,0.08)";

    ctx.fillRect(
      x,
      y,
      2,
      2
    );
  }
}

function asteroidField(t) {
  for (let i = 0; i < 60; i++) {

    const x =
      ((i * 97 + t * 0.03) %
        (width + 100)) - 50;

    const y =
      ((i * 53 + t * 0.01) %
        height);

    const size =
      2 + i % 5;

    ctx.beginPath();

    ctx.arc(
      x,
      y,
      size,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      "rgba(170,170,190,0.12)";

    ctx.fill();
  }
}

function spaceDust(t) {
  for (let i = 0; i < 350; i++) {

    const a =
      i * 0.17;

    const r =
      (i * 9 + t * 0.01) % 600;

    ctx.fillStyle =
      "rgba(190,220,255,0.08)";

    ctx.fillRect(
      width / 2 + Math.cos(a) * r,
      height / 2 + Math.sin(a) * r,
      1,
      1
    );
  }
}

function energyFlow(t) {
  for (let i = 0; i < 12; i++) {

    ctx.beginPath();

    for (let x = 0; x <= width; x += 10) {

      const y =
        height * 0.5 +
        i * 30 +
        Math.sin(
          x * 0.015 +
          t * 0.002
        ) * 60;

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle =
      "rgba(255,220,80,0.09)";

    ctx.stroke();
  }
}

function neonPulse(t) {
  const cx = width / 2;
  const cy = height / 2;

  const radius =
    100 +
    Math.sin(t * 0.002) * 60;

  ctx.beginPath();

  ctx.arc(
    cx,
    cy,
    radius,
    0,
    Math.PI * 2
  );

  ctx.strokeStyle =
    "rgba(0,229,255,0.25)";

  ctx.lineWidth = 4;

  ctx.stroke();
}

function cyberRain(t) {
  ctx.font = "11px monospace";

  for (let i = 0; i < 100; i++) {

    const x =
      (i * 41) % width;

    const y =
      (i * 73 + t * 0.08) %
      height;

    ctx.fillStyle =
      i % 2
        ? "rgba(0,229,255,0.15)"
        : "rgba(255,78,205,0.12)";

    ctx.fillText(
      i % 3 ? ">" : "01",
      x,
      y
    );
  }
}

function digitalStorm(t) {
  for (let i = 0; i < 60; i++) {

    const x =
      random(0, width);

    const y =
      random(0, height);

    ctx.fillStyle =
      Math.random() > 0.5
        ? "rgba(0,229,255,0.10)"
        : "rgba(255,78,205,0.10)";

    ctx.fillRect(
      x,
      y,
      random(2, 80),
      random(1, 4)
    );
  }
}

function laserGrid(t) {
  const gap = 90;

  for (let x = 0; x < width; x += gap) {

    ctx.beginPath();

    ctx.moveTo(x, 0);
    ctx.lineTo(
      x + Math.sin(t * 0.0005) * 30,
      height
    );

    ctx.strokeStyle =
      "rgba(255,50,100,0.06)";

    ctx.stroke();
  }

  for (let y = 0; y < height; y += gap) {

    ctx.beginPath();

    ctx.moveTo(0, y);
    ctx.lineTo(
      width,
      y + Math.cos(t * 0.0004) * 30
    );

    ctx.strokeStyle =
      "rgba(0,229,255,0.06)";

    ctx.stroke();
  }
}

function technoWave(t) {
  for (let i = 0; i < 6; i++) {

    ctx.beginPath();

    for (let x = 0; x < width; x += 8) {

      const y =
        height * 0.5 +
        i * 35 +
        Math.sin(
          x * 0.025 +
          t * 0.002 +
          i
        ) * 30;

      if (!x) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle =
      `hsla(${190 + i * 20},100%,65%,0.09)`;

    ctx.lineWidth = 3;

    ctx.stroke();
  }
}

function infinityTunnel(t) {
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < 35; i++) {

    const scale =
      ((t * 0.0002 + i / 35) % 1);

    const w =
      80 +
      scale * width * 0.8;

    const h =
      40 +
      scale * height * 0.35;

    ctx.beginPath();

    ctx.ellipse(
      cx,
      cy,
      w,
      h,
      0,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle =
      `rgba(123,97,255,${0.12 * (1 - scale)})`;

    ctx.stroke();
  }
}

function cosmicPortal(t) {
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < 24; i++) {

    const a =
      i * Math.PI / 12 +
      t * 0.0004;

    const r =
      80 +
      Math.sin(
        t * 0.001 +
        i
      ) * 20;

    ctx.beginPath();

    ctx.arc(
      cx + Math.cos(a) * 30,
      cy + Math.sin(a) * 30,
      r,
      a,
      a + Math.PI
    );

    ctx.strokeStyle =
      "rgba(255,78,205,0.08)";

    ctx.stroke();
  }
}

function novaCore(t) {
  const cx = width / 2;
  const cy = height / 2;

  const pulse =
    60 +
    Math.sin(t * 0.003) * 25;

  const gradient =
    ctx.createRadialGradient(
      cx,
      cy,
      0,
      cx,
      cy,
      pulse * 4
    );

  gradient.addColorStop(
    0,
    "rgba(255,255,255,0.30)"
  );

  gradient.addColorStop(
    0.12,
    "rgba(0,229,255,0.20)"
  );

  gradient.addColorStop(
    0.4,
    "rgba(123,97,255,0.08)"
  );

  gradient.addColorStop(
    1,
    "rgba(255,78,205,0)"
  );

  ctx.fillStyle = gradient;

  ctx.fillRect(
    0,
    0,
    width,
    height
  );
}

function crystalRain(t) {
  for (let i = 0; i < 50; i++) {

    const x =
      (i * 89) % width;

    const y =
      (i * 53 + t * 0.06) %
      height;

    ctx.save();

    ctx.translate(x, y);

    ctx.rotate(
      Math.sin(i) + t * 0.0003
    );

    ctx.strokeStyle =
      "rgba(100,220,255,0.12)";

    ctx.strokeRect(
      -5,
      -12,
      10,
      24
    );

    ctx.restore();
  }
}

function magneticStorm(t) {
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < 16; i++) {

    ctx.beginPath();

    for (let a = 0; a < Math.PI * 2; a += 0.08) {

      const r =
        60 +
        i * 22 +
        Math.sin(
          a * 5 +
          t * 0.001
        ) * 20;

      const x =
        cx +
        Math.cos(a) * r;

      const y =
        cy +
        Math.sin(a) * r * 0.6;

      if (a === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle =
      "rgba(0,229,255,0.055)";

    ctx.stroke();
  }
}

function photonGarden(t) {
  for (let i = 0; i < 70; i++) {

    const x =
      width * 0.5 +
      Math.sin(i * 0.7) *
      (100 + i * 3);

    const y =
      height * 0.65 -
      Math.abs(
        Math.sin(
          i +
          t * 0.0005
        )
      ) *
      (150 + i);

    ctx.beginPath();

    ctx.moveTo(x, height * 0.7);

    ctx.lineTo(x, y);

    ctx.strokeStyle =
      "rgba(0,255,180,0.05)";

    ctx.stroke();

    ctx.beginPath();

    ctx.arc(
      x,
      y,
      3,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      "rgba(100,255,220,0.18)";

    ctx.fill();
  }
}

function orbitGarden(t) {
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < 12; i++) {

    const r =
      50 + i * 22;

    const a =
      t * 0.0003 *
      (i % 2 ? -1 : 1) +
      i;

    const x =
      cx + Math.cos(a) * r;

    const y =
      cy + Math.sin(a) * r;

    ctx.beginPath();

    ctx.arc(
      x,
      y,
      5 + Math.sin(i) * 2,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      "rgba(120,255,190,0.15)";

    ctx.fill();
  }
}

function timeFragments(t) {
  for (let i = 0; i < 30; i++) {

    const x =
      (i * 73 + t * 0.02) %
      width;

    const y =
      (i * 37) % height;

    ctx.font =
      `${10 + i % 12}px monospace`;

    ctx.fillStyle =
      "rgba(180,220,255,0.07)";

    ctx.fillText(
      `${i}:${(i * 7) % 60}`,
      x,
      y
    );
  }
}

function cosmicStrings(t) {
  for (let i = 0; i < 14; i++) {

    ctx.beginPath();

    ctx.moveTo(
      0,
      i * height / 14
    );

    for (let x = 0; x < width; x += 15) {

      const y =
        i * height / 14 +
        Math.sin(
          x * 0.006 +
          t * 0.0004 +
          i
        ) * 70;

      ctx.lineTo(x, y);
    }

    ctx.strokeStyle =
      "rgba(180,130,255,0.07)";

    ctx.stroke();
  }
}

function lightCathedral(t) {
  const cx = width / 2;

  for (let i = 0; i < 14; i++) {

    const x =
      i * width / 13;

    ctx.beginPath();

    ctx.moveTo(cx, 0);

    ctx.lineTo(
      x,
      height
    );

    ctx.strokeStyle =
      "rgba(100,220,255,0.045)";

    ctx.stroke();
  }
}

function starBloom(t) {
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < 180; i++) {

    const a =
      i * 0.27;

    const r =
      20 +
      Math.sin(
        t * 0.001 +
        i * 0.1
      ) *
      100 +
      i * 1.5;

    ctx.fillStyle =
      "rgba(255,230,130,0.10)";

    ctx.fillRect(
      cx + Math.cos(a) * r,
      cy + Math.sin(a) * r,
      3,
      3
    );
  }
}

function gravityWaves(t) {
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < 10; i++) {

    ctx.beginPath();

    for (
      let a = 0;
      a <= Math.PI * 2;
      a += 0.05
    ) {

      const r =
        100 +
        i * 30 +
        Math.sin(
          a * 3 +
          t * 0.001
        ) *
        20;

      const x =
        cx + Math.cos(a) * r;

      const y =
        cy + Math.sin(a) * r;

      if (a === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle =
      "rgba(123,97,255,0.06)";

    ctx.stroke();
  }
}

function quantumGarden(t) {
  for (let i = 0; i < 80; i++) {

    const x =
      width * 0.5 +
      Math.sin(i * 0.4) *
      (50 + i * 4);

    const y =
      height * 0.6 -
      Math.abs(
        Math.cos(
          i * 0.3 +
          t * 0.0005
        )
      ) *
      (80 + i * 2);

    ctx.beginPath();

    ctx.moveTo(x, height * 0.65);

    ctx.lineTo(x, y);

    ctx.strokeStyle =
      "rgba(160,100,255,0.05)";

    ctx.stroke();
  }
}

function solarThreads(t) {
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < 50; i++) {

    const a =
      i * 0.4 +
      t * 0.0002;

    const x =
      cx +
      Math.cos(a) * 250;

    const y =
      cy +
      Math.sin(a) * 180;

    ctx.beginPath();

    ctx.moveTo(cx, cy);

    ctx.quadraticCurveTo(
      width * 0.5 +
        Math.sin(a) * 100,
      height * 0.5 +
        Math.cos(a) * 100,
      x,
      y
    );

    ctx.strokeStyle =
      "rgba(255,200,60,0.055)";

    ctx.stroke();
  }
}

function novaSpiral(t) {
  const cx = width / 2;
  const cy = height / 2;

  ctx.beginPath();

  for (let i = 0; i < 1200; i++) {

    const a =
      i * 0.06 +
      t * 0.0004;

    const r =
      i * 0.28;

    const x =
      cx +
      Math.cos(a) * r;

    const y =
      cy +
      Math.sin(a) * r * 0.65;

    if (!i) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.strokeStyle =
    "rgba(0,229,255,0.11)";

  ctx.stroke();
}

function celestialClock(t) {
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < 12; i++) {

    const a =
      i * Math.PI / 6;

    const x =
      cx +
      Math.cos(a) * 140;

    const y =
      cy +
      Math.sin(a) * 140;

    ctx.beginPath();

    ctx.arc(
      x,
      y,
      4,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      "rgba(255,220,100,0.15)";

    ctx.fill();
  }

  const hand =
    t * 0.001;

  ctx.beginPath();

  ctx.moveTo(cx, cy);

  ctx.lineTo(
    cx + Math.cos(hand) * 120,
    cy + Math.sin(hand) * 120
  );

  ctx.strokeStyle =
    "rgba(0,229,255,0.18)";

  ctx.stroke();
}

function particleDNA(t) {
  const cx = width / 2;

  for (let i = 0; i < 60; i++) {

    const y =
      i * height / 60;

    const a =
      i * 0.35 +
      t * 0.001;

    const x1 =
      cx +
      Math.sin(a) * 130;

    const x2 =
      cx +
      Math.sin(a + Math.PI) * 130;

    ctx.fillStyle =
      "rgba(0,229,255,0.16)";

    ctx.fillRect(
      x1,
      y,
      4,
      4
    );

    ctx.fillStyle =
      "rgba(255,78,205,0.14)";

    ctx.fillRect(
      x2,
      y,
      4,
      4
    );

    if (i % 4 === 0) {

      ctx.beginPath();

      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);

      ctx.strokeStyle =
        "rgba(123,97,255,0.08)";

      ctx.stroke();
    }
  }
}

function cosmicMirror(t) {
  for (let i = 0; i < 20; i++) {

    const y =
      i * 50 +
      Math.sin(t * 0.0005 + i) * 20;

    ctx.beginPath();

    ctx.moveTo(0, y);

    ctx.bezierCurveTo(
      width * 0.3,
      y - 80,
      width * 0.7,
      y + 80,
      width,
      y
    );

    ctx.strokeStyle =
      "rgba(0,229,255,0.05)";

    ctx.stroke();
  }
}

function energyCathedral(t) {
  const cx = width / 2;

  for (let i = 0; i < 30; i++) {

    const x =
      cx +
      Math.sin(
        i * 0.8 +
        t * 0.0005
      ) *
      width * 0.4;

    ctx.beginPath();

    ctx.moveTo(cx, height);
    ctx.lineTo(x, 0);

    ctx.strokeStyle =
      "rgba(123,97,255,0.045)";

    ctx.stroke();
  }
}

function novaInfinity(t) {
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < 4; i++) {

    ctx.beginPath();

    for (
      let a = 0;
      a <= Math.PI * 2;
      a += 0.015
    ) {

      const x =
        cx +
        Math.sin(a) *
        (100 + i * 30);

      const y =
        cy +
        Math.sin(a * 2) *
        (50 + i * 15);

      if (a === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle =
      `rgba(0,229,255,${0.10 - i * 0.015})`;

    ctx.stroke();
  }
}

function photonStorm(t) {
  for (let i = 0; i < 160; i++) {

    const a =
      i * 0.19;

    const r =
      (t * 0.18 + i * 17) %
      650;

    const x =
      width / 2 +
      Math.cos(a) * r;

    const y =
      height / 2 +
      Math.sin(a) * r;

    ctx.fillStyle =
      "rgba(220,250,255,0.10)";

    ctx.fillRect(
      x,
      y,
      3,
      3
    );
  }
}

function dimensionalGrid(t) {
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < 18; i++) {

    const s =
      40 +
      i * 35 +
      Math.sin(t * 0.001) * 10;

    ctx.strokeStyle =
      "rgba(123,97,255,0.055)";

    ctx.strokeRect(
      cx - s,
      cy - s,
      s * 2,
      s * 2
    );
  }
}

function finalNova(t) {
  const cx = width / 2;
  const cy = height / 2;

  const pulse =
    80 +
    Math.sin(t * 0.0025) * 35;

  const gradient =
    ctx.createRadialGradient(
      cx,
      cy,
      0,
      cx,
      cy,
      pulse * 5
    );

  gradient.addColorStop(
    0,
    "rgba(255,255,255,0.30)"
  );

  gradient.addColorStop(
    0.08,
    "rgba(0,229,255,0.22)"
  );

  gradient.addColorStop(
    0.25,
    "rgba(123,97,255,0.12)"
  );

  gradient.addColorStop(
    0.55,
    "rgba(255,78,205,0.05)"
  );

  gradient.addColorStop(
    1,
    "rgba(0,0,0,0)"
  );

  ctx.fillStyle = gradient;

  ctx.fillRect(
    0,
    0,
    width,
    height
  );

  for (let i = 0; i < 100; i++) {

    const a =
      i * 0.25 +
      t * 0.0003;

    const r =
      (i * 8 +
        t * 0.08) %
      450;

    ctx.fillStyle =
      "rgba(255,255,255,0.12)";

    ctx.fillRect(
      cx + Math.cos(a) * r,
      cy + Math.sin(a) * r,
      2,
      2
    );
  }
}

/* =========================================================
   ANIMACIONES 101 — 120
   ========================================================= */

/*
   Los últimos modos se mantienen deliberadamente
   independientes de los anteriores.
*/

function photonGardenExtra(t) {
  photonGarden(t);
}

function unusedModeFallback(t) {
  cosmicDrift(t);
}

/* =========================================================
   CORRECCIÓN DE NOMBRES 118–120
   ========================================================= */

function ensureUniqueModeName(index) {
  return NOVA_NAMES[index - 1] ||
    `NOVA MODE ${index}`;
}

/* =========================================================
   SELECTOR DE MODOS
   ========================================================= */

function renderNovaModes() {

  const container =
    $("#novaModes");

  if (!container) return;

  container.innerHTML = "";

  NOVA_NAMES.forEach((name, index) => {

    const number = index + 1;

    const button =
      document.createElement("button");

    button.className =
      "novaMode";

    button.dataset.mode =
      number;

    button.type =
      "button";

    button.innerHTML = `
      <span class="novaModeNumber">
        ${String(number).padStart(3, "0")}
      </span>

      <span class="novaModeName">
        ${escapeHTML(name)}
      </span>
    `;

    if (
      number === Number(state.novaMode)
    ) {
      button.classList.add("active");
    }

    button.addEventListener(
      "click",
      () => {

        state.novaMode =
          number;

        saveState();

        $$(".novaMode")
          .forEach((x) =>
            x.classList.remove("active")
          );

        button.classList.add("active");

        updateNovaName();

        createNovaObjects();

        toast(
          `NOVA ${number}: ${name}`
        );
      }
    );

    container.appendChild(button);
  });
}

function updateNovaName() {

  const name =
    ensureUniqueModeName(
      Number(state.novaMode)
    );

  if ($("#novaModeName")) {
    $("#novaModeName").textContent =
      name;
  }
}

/* =========================================================
   NOVA RENDER LOOP
   ========================================================= */

function animateNova(now) {

  if (!novaRunning) return;

  pointer.x =
    lerp(
      pointer.x,
      pointer.targetX,
      0.04
    );

  pointer.y =
    lerp(
      pointer.y,
      pointer.targetY,
      0.04
    );

  scrollValue =
    lerp(
      scrollValue,
      scrollTarget,
      0.05
    );

  if (
    state.motion &&
    !REDUCED_MOTION
  ) {

    clearNova();

    ctx.save();

    const parallax =
      state.scrollParallax
        ? scrollValue * 0.00003
        : 0;

    ctx.translate(
      (pointer.x - 0.5) * 12,
      (pointer.y - 0.5) * 12 + parallax
    );

    try {

      drawMode(
        Number(state.novaMode),
        now
      );

    } catch (error) {

      console.warn(
        "NOVA FLOW: error en modo",
        state.novaMode,
        error
      );

      state.novaMode = 1;

      drawMode(
        1,
        now
      );
    }

    ctx.restore();
  }

  fpsFrames++;

  if (now - fpsTime >= 1000) {

    const fps =
      Math.round(
        fpsFrames *
        1000 /
        (now - fpsTime)
      );

    if ($("#fps")) {
      $("#fps").textContent =
        String(fps);
    }

    fpsFrames = 0;
    fpsTime = now;
  }

  novaFrame =
    requestAnimationFrame(
      animateNova
    );
}

function startNova() {

  if (
    novaRunning ||
    !canvas ||
    !ctx
  ) return;

  novaRunning = true;

  cancelAnimationFrame(novaFrame);

  novaFrame =
    requestAnimationFrame(
      animateNova
    );
}

function stopNova() {

  novaRunning = false;

  cancelAnimationFrame(
    novaFrame
  );
}

$("#novaIntensity")?.addEventListener(
  "input",
  (event) => {

    state.novaIntensity =
      Number(event.target.value);

    saveState();
  }
);

$("#performanceSelect")?.addEventListener(
  "change",
  (event) => {

    state.performance =
      event.target.value;

    saveState();

    createNovaObjects();

    toast(
      `Rendimiento: ${event.target.options[event.target.selectedIndex].text}`
    );
  }
);

$("#globalFxBtn")?.addEventListener(
  "click",
  () => {

    state.globalFx =
      !state.globalFx;

    $("#novaGlow").style.opacity =
      state.globalFx ? "0.8" : "0";

    saveState();
  }
);

$("#parallaxBtn")?.addEventListener(
  "click",
  () => {

    state.scrollParallax =
      !state.scrollParallax;

    saveState();

    toast(
      state.scrollParallax
        ? "Parallax activado"
        : "Parallax desactivado"
    );
  }
);

$("#novaBtn")?.addEventListener(
  "click",
  () => {
    $("#novaPanel")?.scrollIntoView({
      behavior: "smooth"
    });
  }
);

$("#exploreBtn")?.addEventListener(
  "click",
  () => {
    $("#tools")?.scrollIntoView({
      behavior: "smooth"
    });
  }
);

/* =========================================================
   MODAL
   ========================================================= */

function closeModal() {
  $("#modal")?.classList.remove("open");
}

function openModal(content) {

  const modal =
    $("#modal");

  if (!modal) return;

  $("#modalBody").innerHTML =
    content;

  modal.classList.add("open");
}

$$("[data-close-modal]")
  .forEach((element) => {
    element.addEventListener(
      "click",
      closeModal
    );
  });

/* =========================================================
   SERVICE WORKER
   ========================================================= */

if ("serviceWorker" in navigator) {

  window.addEventListener(
    "load",
    () => {

      navigator.serviceWorker
        .register("./sw.js")
        .catch((error) => {
          console.warn(
            "Service Worker no disponible:",
            error
          );
        });

    }
  );
}

/* =========================================================
   CONEXIÓN
   ========================================================= */

function updateConnection() {

  const element =
    $("#connectionStatus");

  if (!element) return;

  element.textContent =
    navigator.onLine
      ? "● Conectado"
      : "● Sin conexión";
}

window.addEventListener(
  "online",
  updateConnection
);

window.addEventListener(
  "offline",
  updateConnection
);

/* =========================================================
   INICIALIZACIÓN
   ========================================================= */

function init() {

  applyTheme();

  document.body.classList.toggle(
    "focus-mode",
    state.focus
  );

  if ($("#novaIntensity")) {
    $("#novaIntensity").value =
      state.novaIntensity;
  }

  if ($("#performanceSelect")) {
    $("#performanceSelect").value =
      state.performance;
  }

  renderTools();
  renderQuickTools();
  updateStats();

  renderNovaModes();
  updateNovaName();

  resizeNova();

  updateConnection();

  applyMotion();

  /*
    El fondo NOVA comienza globalmente.
  */

  startNova();
}

init();

/* =========================================================
   FIN ÚTILHUB V24
   ========================================================= */
