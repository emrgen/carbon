
// Converts integer to hex 
const colToHex = (c) => {
	// Hack so colors are bright enough
	let color = (c < 75) ? c + 75 : c
	let hex = color.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

// uses colToHex to concatenate
// a full 6 digit hex code
const rgbToHex = (r, g, b) => {
	return "#" + colToHex(r) + colToHex(g) + colToHex(b);
}

// Returns three random 0-255 integers
export const randomColor = () => {
	return rgbToHex(
		Math.floor(Math.random() * 255),
		Math.floor(Math.random() * 255),
		Math.floor(Math.random() * 255));
}

const niceColors = [
	'rgb(255, 128, 237)',
	'rgb(6, 85, 53)',
	'rgb(255, 192, 203)',
	'rgb(255, 255, 255)',
	'rgb(255, 228, 225)',
	'rgb(0, 128, 128)',
	'rgb(255, 0, 0)',
	'rgb(230, 230, 250)',
	'rgb(255, 215, 0)',
	'rgb(0, 255, 255)',
	'rgb(255, 165, 0)',
	'rgb(255, 115, 115)',
	'rgb(64, 224, 208)',
	'rgb(211, 255, 206)',
	'rgb(198, 226, 255)',
	'rgb(240, 248, 255)',
	'rgb(176, 224, 230)',
	'rgb(102, 102, 102)',
	'rgb(250, 235, 215)',
	'rgb(186, 218, 85)',
	'rgb(250, 128, 114)',
	'rgb(255, 255, 0)',
	'rgb(255, 182, 193)',
	'rgb(192, 192, 192)',
	'rgb(128, 0, 128)',
	'rgb(127, 255, 212)',
	'rgb(195, 151, 151)',
	'rgb(0, 255, 0)',
	'rgb(204, 204, 204)',
	'rgb(238, 238, 238)',
	'rgb(255, 246, 143)',
	'rgb(32, 178, 170)',
	'rgb(240, 128, 128)',
	'rgb(255, 195, 160)',
	'rgb(192, 214, 228)',
	'rgb(102, 205, 170)',
	'rgb(255, 0, 255)',
	'rgb(255, 102, 102)',
	'rgb(255, 218, 185)',
	'rgb(203, 190, 181)',
	'rgb(70, 132, 153)',
	'rgb(255, 127, 80)',
	'rgb(175, 238, 238)',
	'rgb(0, 128, 0)',
	'rgb(0, 206, 209)',
	'rgb(246, 84, 106)',
	'rgb(180, 238, 180)',
	'rgb(102, 0, 102)',
	'rgb(182, 252, 213)',
	'rgb(245, 245, 245)',
	'rgb(153, 0, 0)',
	'rgb(218, 165, 32)',
	'rgb(128, 128, 128)',
	'rgb(104, 151, 187)',
	'rgb(105, 105, 105)',
	'rgb(8, 141, 165)',
	'rgb(245, 245, 220)',
	'rgb(139, 0, 0)',
	'rgb(138, 43, 226)',
	'rgb(255, 255, 102)',
	'rgb(129, 216, 208)',
	'rgb(221, 221, 221)',
	'rgb(10, 117, 173)',
	'rgb(204, 255, 0)',
	'rgb(42, 202, 234)',
	'rgb(255, 64, 64)',
	'rgb(102, 204, 204)',
	'rgb(255, 20, 147)',
	'rgb(160, 219, 142)',
	'rgb(0, 255, 127)',
	'rgb(204, 0, 0)',
	'rgb(51, 153, 255)',
	'rgb(153, 153, 153)',
	'rgb(121, 64, 68)'
]

export const randomNiceColor = () => {
	return niceColors[Math.floor(Math.random() * niceColors.length) - 1]
}
