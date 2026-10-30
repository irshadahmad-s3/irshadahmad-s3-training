'use strict';

const fs = require('fs');

process.stdin.resume();
process.stdin.setEncoding('utf-8');

let inputString = '';
let currentLine = 0;

process.stdin.on('data', function(inputStdin) {
    inputString += inputStdin;
});

process.stdin.on('end', function() {
    inputString = inputString.split('\n');

    main();
});

function readLine() {
    return inputString[currentLine++];
}

/*
 * Complete the 'timeConversion' function below.
 *
 * The function is expected to return a STRING.
 * The function accepts STRING s as parameter.
 */

function timeConversion(s) {
    let period = s.slice(-2);
    let time = s.slice(0, 8);
    let hours = parseInt(time.slice(0, 2));

    if (period === "AM" && hours === 12) {
        hours = 0;
    } else if (period === "PM" && hours !== 12) {
        hours += 12;
    }

    let formattedHours = String(hours).padStart(2, "0");

    return formattedHours + time.slice(2);

}

function main() {
    const ws = fs.createWriteStream(process.env.OUTPUT_PATH);

    const s = readLine();

    const result = timeConversion(s);

    ws.write(result + '\n');

    ws.end();
}
