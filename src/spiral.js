const inputN = +process.argv[2];

let N;

if (inputN && typeof inputN === "number" && inputN > 0 && inputN % 1 === 0)
    N = inputN;
else {
    console.log("incorrect N or absent, using default N = 3 (it possible to call program with argument N, where N is whole positive number)");
    N = 3;
}

const
    side = 2 * N - 1,
    size = side * side,
    matrix = [],
    startIndex = (side - 1) / 2;

for (let i = 0; i < side; i ++) {
    matrix[i] = [];
    for (let j = 0; j < side; j ++)
        matrix[i][j] = Math.ceil(Math.random() * size);
}

console.log("\nRandom matrix:\n");

let matrixAsString = "";
for (let i = 0; i < side; i ++) {
    for (let j = 0; j < side; j ++)
        matrixAsString += matrix[i][j] + (matrix[i][j] < 10 ? "  " : " ");
    matrixAsString += "\n";
}

console.log(matrixAsString);

const arr = [matrix[startIndex][startIndex]];

let
    direction = 0, // Направление движения по строкам и столбцам матрицы
    totalSteps = 1, // количество шагов, которое необходимо сделать по выбранному направлению движения
    steps = 0, // число уже сделанных шагов по выбранному направлению движения
    x = startIndex, // начальный индекс по "горизонтали"
    y = startIndex; // начальный индекс по "вертикали"

for (let i = 0; i < size; i ++) {
    arr[i] = matrix[y][x];
    switch (direction) {
        case 0: { // Вправо
            x = x - 1;
            break;
        }
        case 1: { // Вниз
            y = y + 1;
            break;
        }
        case 2: { // Влево
            x = x + 1;
            break;
        }
        case 3: { // Вверх
            y = y - 1;
            break;
        }
    }

    steps ++;

    if (i === totalSteps * (totalSteps + 1))
        totalSteps ++;

    if (steps === totalSteps)
        changeDirection();
}

console.log(`\nOutput spiral-way view:\n\n${arr.join(" ")}`);

function changeDirection() {
    if (direction === 3)
        direction = 0;
    else
        direction ++;

    steps = 0;
}
