let cursos = [];
const estadoCursos = {};
var credito = 0

fetch('Malla.json')
  .then(res => res.json())
  .then(data => {
    cursos = data;
    inicializar();    
  });

function updateLightEffect(e) {
  let x, y;

  if (e.touches) {
    x = e.touches[0].clientX;
    y = e.touches[0].clientY;
  } else {
    x = e.clientX;
    y = e.clientY;
  }

  const percentX = (x / window.innerWidth) * 100 + "%";
  const percentY = (y / window.innerHeight) * 100 + "%";

  document.body.style.setProperty('--x', percentX);
  document.body.style.setProperty('--y', percentY);
}

document.addEventListener("mousemove", updateLightEffect);
document.addEventListener("touchmove", updateLightEffect, { passive: true });


function inicializar() {
  // Cargar estado guardado
  const estadoGuardado = JSON.parse(localStorage.getItem("estadoCursos") || "{}");

  cursos.forEach(curso => {
    // Si ya está guardado como aprobado, conservar
    estadoCursos[curso.id] = estadoGuardado[curso.id] || "pendiente";
  });

  actualizarEstados();
  renderMalla();
}


function actualizarEstados() {
  cursos.forEach(curso => {
    if (estadoCursos[curso.id] === "aprobado") return;

    const desbloqueado = curso.requisitos.every(req => estadoCursos[req] === "aprobado" || !estadoCursos[req]);
    estadoCursos[curso.id] = desbloqueado ? "desbloqueado" : "pendiente";
  });
}

function actualizarCreditosTotales() {
  let total = 0;
  cursos.forEach(curso => {
    if (estadoCursos[curso.id] === "aprobado") {
      total += Number(curso.credito || curso.creditos || 0);
    }
  });
  const span = document.getElementById("creditosTotales");
  if (span) span.textContent = total;
}

function aprobarCurso(id) {
  estadoCursos[id] = "aprobado";
  guardarEstado();
  actualizarEstados();
  renderMalla();
}

function guardarEstado() {
  localStorage.setItem("estadoCursos", JSON.stringify(estadoCursos));
}

function renderMalla() {
  const container = document.getElementById("malla");
  container.innerHTML = "";

  const ciclos = [...new Set(cursos.map(c => c.ciclo))].sort((a, b) => a - b);

  ciclos.forEach(ciclo => {
    const columna = document.createElement("div");
    columna.className = "ciclo";

    const titulo = document.createElement("h2");
    titulo.textContent = `Ciclo ${ciclo}`;
    columna.appendChild(titulo);
    
    const over_Y = document.createElement("div")
    over_Y.className = "over_Y"

    cursos
      .filter(c => c.ciclo === ciclo)
      .forEach(curso => {
        const div = document.createElement("div");
        div.className = "ramo";
        div.textContent = curso.nombre;
        div.dataset.id = curso.id;

        // Crear el ícono de info
        const infoIcon = document.createElement("i");
        infoIcon.className = "bx bx-info-circle";
        infoIcon.style.color = "var(--texto)";
        infoIcon.style.marginLeft = "8px";
        infoIcon.style.cursor = "pointer";
        infoIcon.style.fontSize = "18px";
        infoIcon.tabIndex = 0; // Para accesibilidad

        const tooltip = document.createElement("div");
        tooltip.className = "tooltip-curso";
        const requisitosNombres = curso.requisitos && curso.requisitos.length
          ? curso.requisitos.map(reqId => {
              const reqCurso = cursos.find(c => c.id === reqId);
              return reqCurso ? reqCurso.nombre : reqId;
            }).join(", ")
          : "Ninguno";
        tooltip.innerHTML = `
          <strong>ID: ${curso.id}</strong><br>
          Créditos: ${curso.credito || "N/A"}<br>
          Requisitos: ${requisitosNombres}
        `;
        document.body.appendChild(tooltip); // <-- Cambia esto: el tooltip va al body

        infoIcon.addEventListener("mouseenter", (e) => {
          const rect = infoIcon.getBoundingClientRect();
          tooltip.style.display = "block";
          tooltip.style.position = "fixed";
          tooltip.style.left = (rect.right + 10) + "px"; // 10px a la derecha del icono
          tooltip.style.top = (rect.top + rect.height / 2) + "px";
          tooltip.style.transform = "translateY(-50%)";
        });
        infoIcon.addEventListener("mouseleave", () => {
          tooltip.style.display = "none";
        });
        infoIcon.addEventListener("focus", (e) => {
          const rect = infoIcon.getBoundingClientRect();
          tooltip.style.display = "block";
          tooltip.style.position = "fixed";
          tooltip.style.left = (rect.right + 10) + "px";
          tooltip.style.top = (rect.top + rect.height / 2) + "px";
          tooltip.style.transform = "translateY(-50%)";
        });
        infoIcon.addEventListener("blur", () => {
          tooltip.style.display = "none";
        });
        div.appendChild(infoIcon);

        const estado = estadoCursos[curso.id];
        if (estado === "aprobado") {
          div.classList.add("aprobado");
        } else if (estado === "desbloqueado") {
          div.classList.add("desbloqueado");
          div.addEventListener("click", () => aprobarCurso(curso.id));
        }

        over_Y.appendChild(div);
      });
    columna.appendChild(over_Y)
    container.appendChild(columna);
    actualizarCreditosTotales()
  });
}
