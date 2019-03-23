'use strict';

// installIcon();
window.addEventListener('load', init);

async function init() {
  const driveIcon = getRealIcon();
  const {title, bgColor} = await getTitle();
  if (!bgColor) {
    return console.warn('PMBF: no matching rule found');
  }
  const newIcon = await messWithIcon({driveIcon, title, bgColor});
  installIcon(newIcon);
}

function getRealIcon() {
  const url = new URL(location.href);
  let type;
  if (url.pathname.startsWith('/spreadsheets/')) type = 'sheets';
  if (url.pathname.startsWith('/document/')) type = 'docs';
  if (url.pathname.startsWith('/presentation/')) type = 'slides';
  if (url.href.startsWith('https://www.example.com/')) type = 'sheets';

  if (!type) {
    console.error('PMBF: we don\'t handle this sort of page i guess');
  }

  const realIconUrl = chrome.runtime.getURL(`icons/${type}.ico`);
  return realIconUrl;
}

async function getTitle() {
  let title = document.title

  let resolve;
  const storageP = new Promise(res => (resolve = res));
  chrome.storage.sync.get(['options'], resolve);
  const data = await storageP;

  // no settings at all.
  if (!data.options) return {};

  const matching = JSON.parse(data.options).find(row => row.substring && title.toLowerCase().includes(row.substring.toLowerCase()));
  // nothing matched. use gray
  if (!matching) return {title: title.trim(), bgColor: '#636363'};

  // Remove the matching part of the name
  title = title.replace(matching.substring, '').trim();
  return {title, bgColor: matching.color};
}

async function messWithIcon({driveIcon, title, bgColor}) {
  const img = new Image();
  img.crossOrigin = 'anonymous';

  // Load the image to get it's size
  let resolve;
  const imgP = new Promise(res => (resolve = res));
  img.onload = resolve;
  img.src = driveIcon;
  await imgP;

  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  // document.body.append(c);
  const dpr = window.devicePixelRatio || 1;

  img.height = img.width = 32; // lol  ????????
  var {width, height} = img;
  c.width = width * dpr;
  c.height = height * dpr;
  ctx.scale(dpr, dpr);
  ctx.drawImage(img, 0, 0, width, height);

  // apply a fresh paint of color
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = `${bgColor.slice(0, 7)}ee`;

  const fontHeight = height / 2.1;
  const rectX = 0;
  const rectY = (height / 8) * 4;
  const borderRadius = rectY / 4;
  roundRect(ctx, rectX, rectY, width, fontHeight * 1.1, borderRadius, true, false);

  ctx.font = `${fontHeight}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`;
  ctx.fillStyle = contrast(bgColor);
  ctx.fillText(title, Math.floor(rectX * 1.2) + 1, Math.floor((rectY + fontHeight) * 0.97));

  const uri = c.toDataURL('image/png', 1);
  return uri;
}

function installIcon(url) {
  const existingIcons = document.querySelectorAll('link[rel*=icon]');
  for (const existingIcon of existingIcons) {
    if (!existingIcon.href.includes('paulirish')) existingIcon.remove();
  }

  const iconElem = document.createElement('link');
  iconElem.setAttribute('rel', 'icon');
  iconElem.setAttribute('type', 'image/png');
  iconElem.setAttribute('href', url);
  iconElem.setAttribute('sizes', '32x32');

  document.head.append(iconElem);
}

/**
 * Draws a rounded rectangle using the current state of the canvas.
 * If you omit the last three params, it will draw a rectangle
 * outline with a 5 pixel border radius
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 * @param {Number} [radius = 5] The corner radius; It can also be an object
 *                 to specify different radii for corners
 * @param {Number} [radius.tl = 0] Top left
 * @param {Number} [radius.tr = 0] Top right
 * @param {Number} [radius.br = 0] Bottom right
 * @param {Number} [radius.bl = 0] Bottom left
 * @param {Boolean} [fill = false] Whether to fill the rectangle.
 * @param {Boolean} [stroke = true] Whether to stroke the rectangle.
 */
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke == 'undefined') {
    stroke = true;
  }
  if (typeof radius === 'undefined') {
    radius = 5;
  }
  if (typeof radius === 'number') {
    radius = {tl: radius, tr: radius, br: radius, bl: radius};
  } else {
    var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
    for (var side in defaultRadius) {
      radius[side] = radius[side] || defaultRadius[side];
    }
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) {
    ctx.fill();
  }
  if (stroke) {
    ctx.stroke();
  }
}


// stole form https://codepen.io/znak/pen/aOvMOd but made it not suck
function contrast(bgColor) {
  // whatever to rgb
  const span = document.createElement('span')
  span.style.color = bgColor
  document.body.append(span);
  const rgbStr = getComputedStyle(span).color.match(/(\d.*?)\)/)[1]; // "186, 218, 85"
  span.remove();
  const [R,G,B] = rgbStr.split(', ').map(Number);

  var C, L;
  C = [R / 255, G / 255, B / 255];

  for (var i = 0; i < C.length; ++i) {
    if (C[i] <= 0.03928) {
      C[i] = C[i] / 12.92;
    } else {
      C[i] = Math.pow((C[i] + 0.055) / 1.055, 2.4);
    }
  }

  L = 0.2126 * C[0] + 0.7152 * C[1] + 0.0722 * C[2];

  if (L > 0.179) {
    return '#222222';
  } else {
    return '#ffffff';
  }
}
