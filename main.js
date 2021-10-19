import { fromEvent, merge } from 'rxjs';
import * as o from 'rxjs/operators';
import './style.css';

import audioUrl from './static/telegraph_sound.mp3';

const Combinations = {
  '.-': 'A',
  '-...': 'B',
  '-.-.': 'C',
  '-..': 'D',
  '.': 'E',
  '..-.': 'F',
  '--.': 'G',
  '....': 'H',
  '..': 'I',
  '.---': 'J',
  '-.-': 'K',
  '.-..': 'L',
  '--': 'M',
  '-.': 'N',
  '---': 'O',
  '.--.': 'P',
  '--.-': 'Q',
  '.-.': 'R',
  '...': 'S',
  '-': 'T',
  '..-': 'U',
  '...-': 'V',
  '.--': 'W',
  '-..-': 'X',
  '-.--': 'Y',
  '--..': 'Z',
};

const BREAK_TIME = 500;
const DOT_TIME = 250;

const KeyCode = 'KeyM';
const BackspaceCode = 'Backspace';
const KeyDown = 'keydown';
const KeyUp = 'keyup';
const MouseDown = 'mousedown';
const MouseUp = 'mouseup';
const Short = '.';
const Long = '-';

const keydown$ = fromEvent(document, KeyDown);
const keyup$ = fromEvent(document, KeyUp);

const keyFilter = (e) => {
  return e.code === KeyCode || e.type === MouseDown || e.type === MouseUp;
};
const backspaceFilter = (e) => {
  return e.code === BackspaceCode;
};

const { tap, filter, distinctUntilChanged } = o;

let startSoundTime = 0;
let breakTimeout = null;

const getTime = () => new Date().getTime();

let symbols = [];
const letters = [];

const audio = new Audio(audioUrl);
audio.loop = true;

const startAudio = () => {
  audio.play();
  startSoundTime = getTime();

  clearTimeout(breakTimeout);
};

const stopAudio = () => {
  audio.pause();
  audio.currentTime = 0;

  breakTimeout = setTimeout(() => {
    letters.push(getLetter(symbols));
    symbols = [];
    rerender();
  }, BREAK_TIME);
};

const getSoundDuration = () => {
  return getTime() - startSoundTime;
};

function rerender() {
  document.querySelector('#app').innerHTML = `
  <i>( Press letter 'm' or click the button to input signals, Backspace to clear the last letter)</i><br />
  [ ${symbols.join(' ')} ]<br />
  [ ${letters.join('')} ]<br />
  ${Object.entries(Combinations)
    .map(([combination, letter]) => {
      return `<strong>${combination}</strong> : ${letter}<br />`;
    })
    .join(' ')}
`;
}

rerender();

const button = document.getElementById('clicker');
const buttondown$ = fromEvent(button, MouseDown);
const buttonup$ = fromEvent(button, MouseUp);

merge(keydown$, keyup$, buttondown$, buttonup$)
  .pipe(
    filter(keyFilter),
    distinctUntilChanged((prev, cur) => {
      return prev.type === cur.type;
    }),
    tap((e) => {
      if (e.type === KeyDown || e.type === MouseDown) {
        startAudio();
      }
    }),

    tap((e) => {
      if (e.type === KeyUp || e.type === MouseUp) {
        stopAudio();
        const symbol = getSoundDuration() < DOT_TIME ? Short : Long;

        symbols.push(symbol);
        rerender();
      }
    })
  )
  .subscribe();

keydown$
  .pipe(
    filter(backspaceFilter),
    tap(() => {
      letters.pop();
      rerender();
    })
  )
  .subscribe();

function getLetter(symbols) {
  let combination = symbols.join('');
  if (Combinations[combination]) {
    return Combinations[combination];
  } else {
    while (combination.length) {
      combination = combination.slice(0, -1);
      if (Combinations[combination]) {
        return Combinations[combination];
      }
    }
    return '!';
  }
}
