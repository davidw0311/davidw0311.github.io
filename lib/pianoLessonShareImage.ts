import {
  pianoLessonShareFileName,
  type PianoLessonShareResult,
} from "../data/pianoLessonShare.ts";

function roundedRectangle(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function drawShareKeyboard(context: CanvasRenderingContext2D, y: number) {
  const x = 112;
  const width = 976;
  const height = 92;
  const whiteKeyWidth = width / 10;

  context.save();
  roundedRectangle(context, x, y, width, height, 14);
  context.clip();
  context.fillStyle = "#edf8f5";
  context.fillRect(x, y, width, height);
  context.strokeStyle = "#789795";
  context.lineWidth = 2;
  for (let index = 1; index < 10; index += 1) {
    context.beginPath();
    context.moveTo(x + index * whiteKeyWidth, y);
    context.lineTo(x + index * whiteKeyWidth, y + height);
    context.stroke();
  }

  context.fillStyle = "#102a34";
  for (const position of [1, 2, 4, 5, 6, 8, 9]) {
    roundedRectangle(
      context,
      x + position * whiteKeyWidth - whiteKeyWidth * 0.29,
      y,
      whiteKeyWidth * 0.58,
      height * 0.62,
      7,
    );
    context.fill();
  }
  context.restore();
}

function drawShareStat(
  context: CanvasRenderingContext2D,
  x: number,
  label: string,
  value: string,
) {
  context.fillStyle = "#789795";
  context.font = "700 22px Arial, sans-serif";
  context.fillText(label.toUpperCase(), x, 564);
  context.fillStyle = "#edf8f5";
  context.font = "700 43px Arial, sans-serif";
  context.fillText(value, x, 620);
}

function drawNoteReport(context: CanvasRenderingContext2D, result: PianoLessonShareResult) {
  const reportTop = 710;
  const rowStart = 808;
  const rowHeight = 52;

  context.fillStyle = "#edf8f5";
  context.font = "700 32px Arial, sans-serif";
  context.fillText("Note report", 112, reportTop);
  context.fillStyle = "#789795";
  context.font = "500 21px Arial, sans-serif";
  context.fillText("Ranked by mistakes, then average recognition time", 112, reportTop + 36);

  context.font = "700 19px Arial, sans-serif";
  context.fillText("RANK", 112, 786);
  context.fillText("NOTE", 210, 786);
  context.textAlign = "right";
  context.fillText("MISTAKES", 720, 786);
  context.fillText("AVG. TIME", 930, 786);
  context.fillText("CARDS", 1088, 786);

  result.noteResults.forEach((note, index) => {
    const y = rowStart + index * rowHeight;
    if (note.mistakes > 0) {
      context.fillStyle = "rgba(255, 157, 151, 0.09)";
      roundedRectangle(context, 96, y - 34, 1008, 47, 9);
      context.fill();
    }

    context.strokeStyle = "rgba(217, 241, 237, 0.14)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(112, y + 18);
    context.lineTo(1088, y + 18);
    context.stroke();

    context.textAlign = "left";
    context.fillStyle = "#789795";
    context.font = "600 23px Arial, sans-serif";
    context.fillText(String(index + 1), 112, y);
    context.fillStyle = note.mistakes > 0 ? "#ffb3ae" : "#edf8f5";
    context.font = "700 25px Arial, sans-serif";
    context.fillText(note.noteName.replace("/", " / "), 210, y);

    context.textAlign = "right";
    context.fillStyle = note.mistakes > 0 ? "#ffb3ae" : "#a9c2c0";
    context.font = "700 23px Arial, sans-serif";
    context.fillText(String(note.mistakes), 720, y);
    context.fillStyle = "#a9c2c0";
    context.fillText(note.averageRecognitionTime, 930, y);
    context.fillText(String(note.attempts), 1088, y);
  });

  context.textAlign = "left";
}

export function pianoLessonShareImageSize(noteCount: number) {
  const keyboardY = Math.max(1120, 850 + noteCount * 52);
  return { height: keyboardY + 190, keyboardY };
}

export function createPianoLessonShareImage(result: PianoLessonShareResult) {
  const canvas = document.createElement("canvas");
  const { height, keyboardY } = pianoLessonShareImageSize(result.noteResults.length);
  canvas.width = 1200;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return Promise.reject(new Error("Canvas is unavailable"));

  context.fillStyle = "#07171f";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const glow = context.createRadialGradient(1030, 100, 20, 1030, 100, 620);
  glow.addColorStop(0, "rgba(121, 228, 197, 0.24)");
  glow.addColorStop(1, "rgba(121, 228, 197, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, canvas.width, 700);

  context.fillStyle = "#79e4c5";
  context.font = "800 26px Arial, sans-serif";
  context.fillText("PIANO PARTY", 112, 88);

  context.fillStyle = "#edf8f5";
  context.font = "700 94px Arial, sans-serif";
  context.fillText(`Lesson ${result.lessonId}`, 106, 210);

  context.fillStyle = "#a9c2c0";
  context.font = "500 34px Arial, sans-serif";
  context.fillText(result.lessonTitle, 112, 267, 976);

  context.fillStyle = "#edf8f5";
  context.font = "700 48px Arial, sans-serif";
  context.fillText(`Completed by ${result.playerName}`, 112, 368, 976);

  const perfect = result.correctCount === result.cardCount;
  roundedRectangle(context, 112, 410, perfect ? 300 : 265, 62, 16);
  context.fillStyle = perfect ? "#79e4c5" : "rgba(237, 248, 245, 0.1)";
  context.fill();
  context.fillStyle = perfect ? "#06251e" : "#edf8f5";
  context.font = "800 23px Arial, sans-serif";
  context.fillText(perfect ? "PERFECT RUN" : "LESSON COMPLETE", 140, 451);

  drawShareStat(context, 112, "Time", result.elapsedTime);
  drawShareStat(context, 430, "Score", `${result.correctCount}/${result.cardCount}`);
  drawShareStat(context, 760, "Accuracy", `${result.accuracy}%`);

  context.strokeStyle = "rgba(217, 241, 237, 0.18)";
  context.beginPath();
  context.moveTo(112, 665);
  context.lineTo(1088, 665);
  context.stroke();

  drawNoteReport(context, result);
  drawShareKeyboard(context, keyboardY);

  context.fillStyle = "#789795";
  context.font = "500 20px Arial, sans-serif";
  context.textAlign = "center";
  context.fillText("davidw0311.github.io/projects/piano-party", 600, keyboardY + 142);

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Could not create lesson image"));
        return;
      }
      resolve(new File([blob], pianoLessonShareFileName(result.lessonId), { type: "image/png" }));
    }, "image/png");
  });
}

export function downloadPianoLessonShareImage(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
