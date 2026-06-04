// ==================== CAMBIO DE PESTAÑAS ====================
const tabs = document.querySelectorAll('.tab-btn');
const contents = document.querySelectorAll('.tab-content');

tabs.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        
        tabs.forEach(b => b.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(tabId).classList.add('active');
    });
});

// ==================== INTERPOLACIÓN (LAGRANGE) ====================
function lagrangeInterpolacion(x, puntos) {
    let resultado = 0;
    const n = puntos.length;
    
    for (let i = 0; i < n; i++) {
        let termino = puntos[i].y;
        for (let j = 0; j < n; j++) {
            if (i !== j) {
                termino *= (x - puntos[j].x) / (puntos[i].x - puntos[j].x);
            }
        }
        resultado += termino;
    }
    return resultado;
}

document.getElementById('btnInterpolar')?.addEventListener('click', () => {
    const puntos = [
        {x: 1, y: 8},
        {x: 5, y: 10},
        {x: 10, y: 13},
        {x: 15, y: 16},
        {x: 20, y: 19},
        {x: 30, y: 22}
    ];
    
    const dia = parseFloat(document.getElementById('diaInterpolar').value);
    const precioEstimado = lagrangeInterpolacion(dia, puntos);
    
    document.getElementById('resultadoInterpolacion').innerHTML = 
        `📅 Día ${dia} → Precio estimado: <strong>${precioEstimado.toFixed(2)} Bs</strong>`;
});

// ==================== INTEGRACIÓN NUMÉRICA ====================
function trapecio(y, h) {
    let suma = y[0] + y[y.length - 1];
    for (let i = 1; i < y.length - 1; i++) {
        suma += 2 * y[i];
    }
    return (h / 2) * suma;
}

function simpson13(y, h) {
    if ((y.length - 1) % 2 !== 0) return null;
    let suma = y[0] + y[y.length - 1];
    for (let i = 1; i < y.length - 1; i++) {
        if (i % 2 === 0) suma += 2 * y[i];
        else suma += 4 * y[i];
    }
    return (h / 3) * suma;
}

function simpson38(y, h) {
    if ((y.length - 1) % 3 !== 0) return null;
    let suma = y[0] + y[y.length - 1];
    for (let i = 1; i < y.length - 1; i++) {
        if (i % 3 === 0) suma += 2 * y[i];
        else suma += 3 * y[i];
    }
    return (3 * h / 8) * suma;
}

document.getElementById('btnIntegrar')?.addEventListener('click', () => {
    let preciosStr = document.getElementById('preciosDiarios').value;
    let precios = preciosStr.split(',').map(Number);
    let metodo = document.getElementById('metodoIntegracion').value;
    let h = 1; // un día
    let resultado = 0;
    
    switch(metodo) {
        case 'trapecio':
            resultado = trapecio(precios, h);
            break;
        case 'simpson13':
            resultado = simpson13(precios, h);
            if (resultado === null) {
                document.getElementById('resultadoIntegracion').innerHTML = 'Error: Simpson 1/3 requiere número par de intervalos';
                return;
            }
            break;
        case 'simpson38':
            resultado = simpson38(precios, h);
            if (resultado === null) {
                document.getElementById('resultadoIntegracion').innerHTML = 'Error: Simpson 3/8 requiere múltiplo de 3 intervalos';
                return;
            }
            break;
    }
    
    document.getElementById('resultadoIntegracion').innerHTML = 
        `💰 Gasto total del mes: <strong>${resultado.toFixed(2)} Bs</strong>`;
    
    // Comparación con precios constantes (día 1)
    let gastoSinInflacion = precios[0] * precios.length;
    let perdida = resultado - gastoSinInflacion;
    document.getElementById('poderAdquisitivo').innerHTML = 
        `📉 Sin inflación habría gastado: ${gastoSinInflacion.toFixed(2)} Bs<br>
         💸 Pérdida del poder adquisitivo: <strong>${perdida.toFixed(2)} Bs</strong>`;
});

// ==================== RAÍCES DE ECUACIONES ====================
function evaluarFuncion(funcionStr, x) {
    try {
        const expr = funcionStr.replace(/\^/g, '**');
        const fn = new Function('x', 'return ' + expr);
        return fn(x);
    } catch(e) {
        return NaN;
    }
}

function biseccion(f, a, b, tol = 1e-6, maxIter = 50) {
    let iteraciones = [];
    let fa = f(a);
    let fb = f(b);
    
    if (fa * fb >= 0) return { raiz: null, iteraciones: [] };
    
    for (let i = 0; i < maxIter; i++) {
        let c = (a + b) / 2;
        let fc = f(c);
        iteraciones.push({iter: i+1, a, b, c, fc});
        
        if (Math.abs(fc) < tol || (b - a)/2 < tol) {
            return { raiz: c, iteraciones };
        }
        
        if (fa * fc < 0) {
            b = c;
            fb = fc;
        } else {
            a = c;
            fa = fc;
        }
    }
    return { raiz: (a+b)/2, iteraciones };
}

document.getElementById('btnRaiz')?.addEventListener('click', () => {
    const funcStr = document.getElementById('funcionRaiz').value;
    const a = parseFloat(document.getElementById('a').value);
    const b = parseFloat(document.getElementById('b').value);
    const metodo = document.getElementById('metodoRaiz').value;
    
    const f = (x) => evaluarFuncion(funcStr, x);
    
    if (metodo === 'biseccion') {
        const { raiz, iteraciones } = biseccion(f, a, b);
        if (raiz === null) {
            document.getElementById('resultadoRaiz').innerHTML = 'Error: No hay cambio de signo en el intervalo';
        } else {
            document.getElementById('resultadoRaiz').innerHTML = `🎯 Raíz encontrada: <strong>${raiz.toFixed(6)}</strong>`;
            document.getElementById('iteracionesRaiz').innerHTML = `📊 Iteraciones: ${iteraciones.length} (Bisección)`;
        }
    } else if (metodo === 'newton') {
        document.getElementById('resultadoRaiz').innerHTML = 'Newton-Raphson requiere derivada. Se recomienda bisección por simplicidad.';
    }
});

// ==================== EDO - MÉTODO DE EULER ====================
function euler(f, y0, t0, tf, h) {
    let t = t0;
    let y = y0;
    let resultados = [{t, y}];
    
    while (t < tf) {
        let yPrima = f(t, y);
        y = y + h * yPrima;
        t = t + h;
        resultados.push({t, y});
    }
    return resultados;
}

document.getElementById('btnEDO')?.addEventListener('click', () => {
    const R0 = parseFloat(document.getElementById('capacidadInicial').value);
    const consumo = parseFloat(document.getElementById('consumoDiario').value);
    const reabastecimiento = parseFloat(document.getElementById('reabastecimientoDiario').value);
    const dias = parseFloat(document.getElementById('diasSimular').value);
    const metodo = document.getElementById('metodoEDO').value;
    
    // dR/dt = entrada - consumo
    const f = (t, R) => reabastecimiento - consumo;
    
    let resultados = [];
    if (metodo === 'euler') {
        resultados = euler(f, R0, 0, dias, 0.5);
    }
    
    const reservaFinal = resultados[resultados.length-1].y;
    let nivelCritico = '';
    if (reservaFinal <= 0) nivelCritico = ' ⚠️ ¡RESERVA CRÍTICA (llegó a 0)!';
    else if (reservaFinal < R0 * 0.2) nivelCritico = ' ⚠️ Nivel crítico (menor al 20% de reserva inicial)';
    
    document.getElementById('resultadoEDO').innerHTML = 
        `⛽ Reserva final después de ${dias} días: <strong>${Math.max(0, reservaFinal).toFixed(0)} litros</strong>${nivelCritico}`;
    
    // Gráfico
    const ctx = document.getElementById('graficoEDO').getContext('2d');
    if (window.chartEDO) window.chartEDO.destroy();
    
    window.chartEDO = new Chart(ctx, {
        type: 'line',
        data: {
            labels: resultados.map(r => r.t.toFixed(1)),
            datasets: [{
                label: 'Reserva de carburante (litros)',
                data: resultados.map(r => Math.max(0, r.y)),
                borderColor: '#e94560',
                backgroundColor: 'rgba(233,69,96,0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'top' }
            }
        }
    });
});

// ==================== SISTEMAS LINEALES (JACOBI) ====================
function jacobi(A, b, tol = 1e-6, maxIter = 50) {
    const n = A.length;
    let x = new Array(n).fill(0);
    let iteraciones = [];
    
    for (let iter = 0; iter < maxIter; iter++) {
        let xNew = [...x];
        for (let i = 0; i < n; i++) {
            let suma = 0;
            for (let j = 0; j < n; j++) {
                if (j !== i) suma += A[i][j] * x[j];
            }
            xNew[i] = (b[i] - suma) / A[i][i];
        }
        
        let error = 0;
        for (let i = 0; i < n; i++) {
            error += Math.abs(xNew[i] - x[i]);
        }
        iteraciones.push({iter: iter+1, x: [...xNew], error});
        
        if (error < tol) break;
        x = xNew;
    }
    return x;
}

document.getElementById('btnSistema')?.addEventListener('click', () => {
    // Sistema: 2x1 + x2 + x3 = 100; x1 + 3x2 + x3 = 150; x1 + x2 + 4x3 = 120
    const A = [
        [2, 1, 1],
        [1, 3, 1],
        [1, 1, 4]
    ];
    const b = [100, 150, 120];
    
    const solucion = jacobi(A, b);
    
    document.getElementById('resultadoSistema').innerHTML = `
        🚛 Solución de abastecimiento:<br>
        <strong>Zona Norte:</strong> ${solucion[0].toFixed(2)} unidades<br>
        <strong>Zona Centro:</strong> ${solucion[1].toFixed(2)} unidades<br>
        <strong>Zona Sur:</strong> ${solucion[2].toFixed(2)} unidades<br>
        📌 Interpretación: La zona Centro requiere más abastecimiento (${solucion[1].toFixed(2)}).
    `;
});