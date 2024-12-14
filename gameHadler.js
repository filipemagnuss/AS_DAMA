// Pilihan Jenis Game
let escolhaJogo, levelPretas, levelBrancas, todosMovimentosAgora, horaInicioJogo, duracaoJogo;
const formEscolhaJogo = document.getElementById('escolha-jogo');
const levelPretasForm = document.getElementById('level-pretas');
const levelBrancasForm = document.getElementById('level-brancas');
const botaoIniciar = document.getElementById('botao-iniciar');
const botaoDesistir = document.getElementById('botao-desistir');
const botaoParar = document.getElementById('botao-parar');
const turno = document.getElementById('turno');
const vencedor = document.getElementById('vencedor');
const listHistory = document.getElementById('list-history');
const tempoDeJogo  = document.querySelector('.tempo-jogo');


// Variáveis
let turn, backMove, hasHighlight, squareHighlighted, history, positionNow, twoComputer, numeroNos, timeOut;
const tagBoard = "board";
const turnComputer = "black";
const initialPosition = '1p1p1p1p/p1p1p1p1/1p1p1p1p/8/8/P1P1P1P1/1P1P1P1P/P1P1P1P1';


//Seleção de jogos
const checkBotaoIniciar = () => {
    if (levelPretas && escolhaJogo == "contra")
        botaoIniciar.disabled = false;
    else if (escolhaJogo == "computador" && levelPretas && levelBrancas)
        botaoIniciar.disabled = false;
    else
    botaoIniciar.disabled = true;
}

formEscolhaJogo.addEventListener('change', () => {
    escolhaJogo = formEscolhaJogo.value;
    if (escolhaJogo == 'contra') {
        levelPretasForm.classList.remove('d-none');
        levelBrancasForm.classList.add('d-none');
    } else if (escolhaJogo == 'computador') {
        levelPretasForm.classList.remove('d-none');
        levelBrancasForm.classList.remove('d-none');
    } else {
        levelPretasForm.classList.add('d-none');
        levelBrancasForm.classList.add('d-none');
        botaoIniciar.disabled = true;
    }
    checkBotaoIniciar();
});

levelPretasForm.addEventListener('change', () => {
    levelPretas = parseInt(levelPretasForm.value);
    checkBotaoIniciar();
});

levelBrancasForm.addEventListener('change', () => {
    levelBrancas = parseInt(levelBrancasForm.value);
    checkBotaoIniciar();
});

const downloadHistory = () => {
    var a = document.createElement("a");
    var file = new Blob([JSON.stringify(history)], { type: 'application/json' });
    a.href = URL.createObjectURL(file);
    a.download = "history.json";
    a.click();
}

const pararJogo = (adaPemenang = false) => {
    botaoDesistir.classList.add('d-none');
    botaoParar.classList.add('d-none');
    turn = null;
    botaoIniciar.disabled = false;
    if (adaPemenang) {
        Swal.fire(
            'Game Over'
        )
    } else {
        Swal.fire(
            'O jogo foi encerrado'
        )
    }
    duracaoJogo = (new Date().getTime()) - horaInicioJogo;
    tempoDeJogo.textContent = `(O jogo durou ${duracaoJogo / 1000} segundos)`;

    formEscolhaJogo.disabled = false;
    levelPretasForm.disabled = false;
    levelBrancasForm.disabled = false;
    clearTimeout(timeOut);
};

botaoDesistir.addEventListener('click', () => {
    Swal.fire({
        title: 'Tem certeza que quer desistir?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim :(',
        cancelButtonText: 'Não!'
    }).then((result) => {
        if (result.isConfirmed) {
            pararJogo();
            vencedor.innerHTML = `Peças Pretas (AI Depth ${levelPretas})`
        }
    });
});

botaoParar.addEventListener('click', () => {
    Swal.fire({
        title: 'Tem certeza de que deseja parar o jogo?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim',
        cancelButtonText: 'Não!'
    }).then((result) => {
        if (result.isConfirmed) {
            pararJogo();
        }
    });
});

// Function for Event Handler
const onDrop = (source, target, piece, newPos, oldPos, orientation) => {
    if (Chessboard.objToFen(newPos) !== Chessboard.objToFen(oldPos)) {
        const moves = [...todosMovimentosAgora];
        if (!isValidMove(source, target, moves))
            return 'snapback';

        const move = moves.filter(m => m.to == target && m.from == source)[0];
        const newPosition = movePiece(move, oldPos);
        positionNow = newPosition;
        board.position(newPosition, false);
        history.push(move);

        removeGreySquares();
        if (move['remove']) {
            if (!hasAnotherEat(target, piece))
                changeTurn();
            else
            todosMovimentosAgora = getAllMoves(turn, positionNow).filter(m => m.from == target);
        } else
            changeTurn();

        listHistory.innerHTML = `<li class="list-group-item">Peças Brancas : ${move.from} para ${move.to}` +
            listHistory.innerHTML;
        return 'trash';
    }
}

const onDragStart = (source, piece, position, orientation) => canMove(piece);

const onMouseoverSquare = (square, piece) => {
    if (piece && canMove(piece)) {
        const moves = todosMovimentosAgora.filter(m => m.from == square);
        if (moves.length > 0) {
            greySquare(square);
            moves.forEach(m => greySquare(m.to));
        }
    }
}

const onMouseoutSquare = () => {
    removeGreySquares();
}

const onSnapbackEnd = () => {
    Swal.fire(
        'Movimento Inválido'
    )
}

const changeTurn = () => {
    if (turn == "white") {
        turn = "black";
        turno.textContent = "Peças Pretas";
    } else if (turn == "black") {
        turn = "white";
        turno.textContent = "Peças Brancas";
    }

    todosMovimentosAgora = getAllMoves(turn, positionNow);

    removeHighlightSquare();
    todosMovimentosAgora.forEach(m => {
        if ("remove" in m)
            highlightSquare(m.from);
    })

    if (todosMovimentosAgora.length == 0) {
        if (turn == "white")
            vencedor.textContent = `Peças Pretas (AI Nível ${levelPretas})`;
        else if (turn == "black") {
            if (twoComputer)
                vencedor.textContent = `Peças Brancas (AI Nível ${levelBrancas})`;
            else
            vencedor.textContent = "Peças Brancas";
        }
        pararJogo(true);
    } else if (turn == turnComputer || twoComputer)
        timeOut = window.setTimeout(playComputer, 500);
}

const playComputer = () => {
    numeroNos = 0;
    let move, value, tempoPensamento;
    let movimento = "";
    const position = positionNow;
    const alpha = Number.NEGATIVE_INFINITY;
    const beta = Number.POSITIVE_INFINITY;

    tempoPensamento = new Date().getTime();
    if (turn == "white") {
        [move, value] = minmax(positionNow, levelBrancas, alpha, beta, true, 0, turn, turn);
        movimento += '<li class="list-group-item">Peças Brancas : '
    } else {
        [move, value] = minmax(positionNow, levelPretas, alpha, beta, true, 0, turn, turn);
        movimento +=
            '<li class="list-group-item list-group-item-dark">Peças Pretas : '
    }
    tempoPensamento = (new Date().getTime()) - tempoPensamento;

    let newPos = {
        ...position
    };

    move['numeroNos'] = numeroNos;
    move['tempo'] = tempoPensamento;

    while ("nextEat" in move) {
        let nextEat = move["nextEat"];
        movimento += `${move.from} para ${move.to} || `;
        delete move.nextEat;
        newPos = movePiece(move, newPos)
        board.position(newPos);
        history.push(move);
        move = nextEat;
    }

    movimento += `${move.from} para ${move.to} `;
    newPos = movePiece(move, newPos);
    positionNow = newPos;
    board.position(newPos);
    history.push(move);

    movimento += `(${numeroNos} Nós Avaliados em ${tempoPensamento / 1000} segundos)</li>`;
    listHistory.innerHTML = movimento + listHistory.innerHTML;

    if (numeroNos > 600000) {
        levelPretas -= 2;
        levelBrancas -= 2;
        Swal.fire(
            'Nível da IA Reduzido'
        )
    }
    changeTurn();
}


// Configurasi Game
const config = {
    position: initialPosition,
    draggable: true,
    onDragStart: onDragStart,
    onDrop: onDrop,
    onMouseoverSquare: onMouseoverSquare,
    onMouseoutSquare: onMouseoutSquare,
    onSnapbackEnd: onSnapbackEnd
}

const board = Chessboard(tagBoard, config);
positionNow = board.position();

botaoIniciar.addEventListener('click', () => {
    turno.textContent = "Peças Brancas";
    botaoIniciar.disabled = true;
    if (escolhaJogo == "contra") {
        botaoDesistir.classList.remove('d-none');
        twoComputer = false;
    } else if (escolhaJogo == "computador") {
        twoComputer = true;
        botaoParar.classList.remove('d-none');
    }
    listHistory.innerHTML = "";
    vencedor.innerHTML = "-";

    // Setting Game
    turn = "white";
    history = [];
    backMove = false;
    hasHighlight = false;
    squareHighlighted = null;
    board.position(initialPosition);
    positionNow = board.position();
    todosMovimentosAgora = getAllMoves(turn, positionNow);

    formEscolhaJogo.disabled = true;
    levelPretasForm.disabled = true;
    levelBrancasForm.disabled = true;

    tempoDeJogo.textContent = "";
    horaInicioJogo = new Date().getTime();

    if (twoComputer)
        timeOut = window.setTimeout(playComputer, 500);
});