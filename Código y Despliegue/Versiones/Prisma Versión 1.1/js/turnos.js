const diasSemana = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado"
];

const meses = [
    "Enero", "Febrero", "Marzo", "Abril",
    "Mayo", "Junio", "Julio", "Agosto",
    "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

/* Feriados manuales */
const feriados = [
    "2026-05-25",
    "2026-07-09"
];

/* ==========================
   CONFIGURACIÓN
========================== */

const LIMITE_DIAS = 90;

let fechaActual = new Date();
const fechaInicioSistema = new Date();
const fechaMaxima = new Date();
fechaMaxima.setDate(fechaInicioSistema.getDate() + LIMITE_DIAS);

/* ==========================
   HORARIOS
========================== */

const HORARIOS = [
    "10:30",
    "12:00",
    "13:30",
    "15:00",
    "16:30",
    "18:00"
];

let horarioSeleccionado = null;

/* ==========================
   FUNCIONES BASE
========================== */

function formatearFecha(fecha){
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, "0");
    const day = String(fecha.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function esFeriado(fecha){
    return feriados.includes(formatearFecha(fecha));
}

function esDisponible(fecha){

    const esSabado = fecha.getDay() === 6;
    const esDomingo = fecha.getDay() === 0;
    const estaEnFeriados = esFeriado(fecha);

    return !(esSabado || esDomingo || estaEnFeriados);
}

/* ==========================
   RESERVAS
========================== */

function obtenerReservas(){
    return JSON.parse(localStorage.getItem("reservas")) || [];
}

function guardarReservas(reservas){
    localStorage.setItem("reservas", JSON.stringify(reservas));
}

/* cantidad por horario */
function countHorario(fecha, horario){
    const reservas = obtenerReservas();

    return reservas.filter(r =>
        r.fecha === fecha && r.horario === horario
    ).length;
}

/* total del día */
function disponibilidadDia(fecha){
    const reservas = obtenerReservas();
    return reservas.filter(r => r.fecha === fecha).length;
}

/* ==========================
   ESTADOS HORARIO
========================== */

function estadoHorario(count){

    if(count === 0) return "libre";
    if(count === 1) return "medio";
    if(count === 2) return "critico";
    return "lleno";
}

/* ==========================
   ESTADOS DÍA
========================== */

function estadoDia(fecha){

    const ocupados = disponibilidadDia(fecha);
    const disponibles = 18 - ocupados;

    if(disponibles >= 18) return "libre";
    if(disponibles >= 12) return "medio";
    if(disponibles >= 6) return "critico";
    return "lleno";
}

/* ==========================
   RENDER SEMANA
========================== */

function renderizarSemana(){

    const container = document.getElementById("dias-container");
    const titulo = document.getElementById("rango-semana");

    container.innerHTML = "";

    let inicioSemana = new Date(fechaActual);

    inicioSemana.setDate(
        fechaActual.getDate() - fechaActual.getDay() + 1
    );

    let finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);

    titulo.innerHTML =
        `Semana Del ${inicioSemana.getDate()} Al ${finSemana.getDate()} De ${meses[inicioSemana.getMonth()]}`;

    for(let i = 0; i < 7; i++){

        let dia = new Date(inicioSemana);
        dia.setDate(inicioSemana.getDate() + i);

        const card = document.createElement("div");
        card.classList.add("dia-card");

        const disponible = esDisponible(dia);
        const estado = estadoDia(formatearFecha(dia));

        card.classList.add(estado);

        if(!disponible){
            card.classList.add("no-disponible");
        }

        card.innerHTML = `
            <h3>${diasSemana[dia.getDay()]}</h3>
            <h2>${dia.getDate()}</h2>
        `;

        if(disponible){

            card.onclick = () => {

                document.querySelectorAll(".dia-card")
                .forEach(c => c.classList.remove("activo"));

                card.classList.add("activo");

                abrirSidebar(formatearFecha(dia));
            };
        }

        container.appendChild(card);
    }

    actualizarBotones();
}

/* ==========================
   BOTONES SEMANA
========================== */

function actualizarBotones(){

    const anterior = document.getElementById("anterior");
    const siguiente = document.getElementById("siguiente");

    const proximaSemana = new Date(fechaActual);
    proximaSemana.setDate(fechaActual.getDate() + 7);

    const semanaAnterior = new Date(fechaActual);
    semanaAnterior.setDate(fechaActual.getDate() - 7);

    siguiente.disabled = proximaSemana > fechaMaxima;
    anterior.disabled = semanaAnterior < fechaInicioSistema;
}

/* ==========================
   EVENTOS SEMANA
========================== */

document.getElementById("anterior")
.addEventListener("click", () => {
    fechaActual.setDate(fechaActual.getDate() - 7);
    renderizarSemana();
});

document.getElementById("siguiente")
.addEventListener("click", () => {
    fechaActual.setDate(fechaActual.getDate() + 7);
    renderizarSemana();
});

/* ==========================
   SIDEBAR
========================== */

let fechaSeleccionadaGlobal = null;

function abrirSidebar(fecha){

    fechaSeleccionadaGlobal = fecha;

    document.getElementById("sidebar-turnos")
        .classList.add("activo");

    document.getElementById("fecha-seleccionada")
        .innerText = fecha;

    renderHorarios(fecha); // 🔥 ESTO ES OBLIGATORIO
}

/* ==========================
   HORARIOS (3x2 GRID)
========================== */

function renderHorarios(fecha){

    const container = document.getElementById("horarios-container");
    container.innerHTML = "";

    HORARIOS.forEach(hora => {

        const count = countHorario(fecha, hora);
        const estado = estadoHorario(count);

        const btn = document.createElement("button");
        btn.type = "button"; // clave para que no actúe como submit

        btn.classList.add("horario-btn", estado);
        btn.dataset.hora = hora;
        btn.innerText = hora;

        if(estado !== "lleno"){

            btn.addEventListener("click", (e) => {
                e.preventDefault();

                document.querySelectorAll(".horario-btn")
                    .forEach(b => {
                        b.classList.remove("activo");
                        b.style.transform = ""; // limpia estilos viejos
                    });

                btn.classList.add("activo");
                btn.style.transform = "scale(1.12)"; // lo hace notar sí o sí
                horarioSeleccionado = hora;
            });
        }

        container.appendChild(btn);
    });
}

/* ==========================
   HORARIOS RESET
========================== */

document.getElementById("cerrar-sidebar")
.addEventListener("click", () => {

    document.getElementById("sidebar-turnos")
    .classList.remove("activo");

    horarioSeleccionado = null;
});

/* ==========================
   CONFIRMAR TURNO
========================== */

document.getElementById("confirmar-turno")
.addEventListener("click", () => {

    const nombre = document.getElementById("nombre").value;
    const apellido = document.getElementById("apellido").value;
    const celular = document.getElementById("celular").value;
    const correo = document.getElementById("correo").value;

    if(!horarioSeleccionado){
        alert("Seleccioná un horario");
        return;
    }

    const reservas = obtenerReservas();

    const count = reservas.filter(r =>
        r.fecha === fechaSeleccionadaGlobal &&
        r.horario === horarioSeleccionado
    ).length;

    if(count >= 3){
        alert("No hay cupos disponibles en ese horario");
        return;
    }

    reservas.push({
        fecha: fechaSeleccionadaGlobal,
        horario: horarioSeleccionado,
        nombre,
        apellido,
        celular,
        correo
    });

    guardarReservas(reservas);

    alert("Turno reservado correctamente");

    document.getElementById("sidebar-turnos")
    .classList.remove("activo");

    renderizarSemana(); // 🔥 actualiza colores
});

/* ==========================
   INICIO
========================== */

renderizarSemana();