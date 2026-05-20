import type { Difficulty } from "../hooks/usePokemonGame";
import { difficultyNames, getRating, getRatingText } from "./result";

type ShareResultImageOptions = {
  best: number;
  difficulty: Difficulty;
  hit: number;
  roundLimit: number;
};

function drawText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color = "#fff7ea",
  align: CanvasTextAlign = "left",
  maxWidth?: number,
) {
  context.fillStyle = color;
  context.font = `900 ${size}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  context.textAlign = align;
  context.textBaseline = "middle";
  context.fillText(text, x, y, maxWidth);
}

function roundRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to create share image."));
    }, "image/png");
  });
}

export async function createShareResultImage(options: ShareResultImageOptions) {
  const { best, difficulty, hit, roundLimit } = options;
  const canvas = document.createElement("canvas");
  const width = 1080;
  const height = 1440;
  const ratio = hit / roundLimit;
  const accuracy = Math.round(ratio * 100);
  const context = canvas.getContext("2d");

  canvas.width = width;
  canvas.height = height;
  if (!context) throw new Error("Canvas is not supported.");

  context.fillStyle = "#d72516";
  context.fillRect(0, 0, width, height);

  const bodyGradient = context.createLinearGradient(0, 0, width, height);
  bodyGradient.addColorStop(0, "rgba(255,255,255,0.24)");
  bodyGradient.addColorStop(0.45, "rgba(255,255,255,0)");
  bodyGradient.addColorStop(1, "rgba(80,0,0,0.28)");
  context.fillStyle = bodyGradient;
  context.fillRect(0, 0, width, height);

  context.globalAlpha = 0.18;
  for (let x = 0; x < width; x += 36) {
    context.fillStyle = "#fff7ea";
    context.fillRect(x, 0, 8, height);
  }
  context.globalAlpha = 1;

  roundRect(context, 70, 70, width - 140, height - 140, 44);
  context.strokeStyle = "rgba(255, 247, 234, 0.62)";
  context.lineWidth = 10;
  context.stroke();

  roundRect(context, 116, 142, width - 232, 730, 18);
  context.fillStyle = "#1547a8";
  context.fill();
  context.strokeStyle = "#384253";
  context.lineWidth = 16;
  context.stroke();

  context.globalAlpha = 0.18;
  for (let y = 160; y < 850; y += 10) {
    context.fillStyle = y % 20 === 0 ? "#ffffff" : "#000000";
    context.fillRect(132, y, width - 264, 3);
  }
  context.globalAlpha = 1;

  drawText(context, "我是谁？", width / 2, 238, 84, "#fff7ea", "center", 760);
  drawText(context, "宝可梦剪影挑战", width / 2, 312, 34, "#87e5df", "center", 720);

  roundRect(context, 214, 380, width - 428, 178, 18);
  context.fillStyle = "#f8ff9c";
  context.fill();
  context.strokeStyle = "rgba(255, 247, 234, 0.8)";
  context.lineWidth = 8;
  context.stroke();
  drawText(context, `${hit}/${roundLimit}`, width / 2, 468, 104, "#102241", "center", 560);

  drawText(context, getRating(hit, roundLimit), width / 2, 632, 78, "#f8ff9c", "center", 720);
  drawText(context, getRatingText(hit, roundLimit), width / 2, 704, 42, "#fff7ea", "center", 720);

  const statY = 932;
  const statWidth = 250;
  const statGap = 34;
  const statStart = (width - statWidth * 3 - statGap * 2) / 2;
  const stats = [
    ["难度", difficultyNames[difficulty]],
    ["命中率", `${accuracy}%`],
    ["最高", String(best).padStart(2, "0")],
  ];

  stats.forEach(([label, value], index) => {
    const x = statStart + index * (statWidth + statGap);
    roundRect(context, x, statY, statWidth, 160, 14);
    context.fillStyle = "#102241";
    context.fill();
    context.strokeStyle = "rgba(135, 229, 223, 0.55)";
    context.lineWidth = 5;
    context.stroke();
    drawText(context, value, x + statWidth / 2, statY + 62, 42, "#f8ff9c", "center", statWidth - 24);
    drawText(context, label, x + statWidth / 2, statY + 116, 26, "#87e5df", "center", statWidth - 24);
  });

  roundRect(context, 210, 1166, width - 420, 78, 12);
  context.fillStyle = "rgba(16, 34, 65, 0.72)";
  context.fill();
  drawText(context, new Date().toLocaleDateString("zh-CN"), width / 2, 1205, 28, "#87e5df", "center", 580);

  drawText(context, "看剪影，说出名字", width / 2, 1290, 32, "#fff7ea", "center", 760);
  drawText(context, "POCKET MONSTERS FAN QUIZ", width / 2, 1340, 26, "#f8ff9c", "center", 760);

  context.fillStyle = "#202020";
  context.fillRect(146, 1178, 62, 182);
  context.fillRect(86, 1238, 182, 62);
  context.fillStyle = "#8d2b1f";
  context.beginPath();
  context.arc(872, 1245, 48, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.arc(760, 1310, 42, 0, Math.PI * 2);
  context.fill();
  drawText(context, "A", 872, 1247, 24, "#fff7ea", "center");
  drawText(context, "B", 760, 1312, 22, "#fff7ea", "center");

  const blob = await canvasToBlob(canvas);
  return {
    blob,
    file: new File([blob], "who-am-i-result.png", { type: "image/png" }),
    url: URL.createObjectURL(blob),
  };
}
