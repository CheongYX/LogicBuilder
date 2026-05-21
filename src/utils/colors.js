import { MACARON_COLORS } from '../constants';

let colorIndex = 0;
const textToColorMap = {};

export const getColorForText = (text) => {
  if (!textToColorMap[text]) { 
    textToColorMap[text] = MACARON_COLORS[colorIndex % MACARON_COLORS.length]; 
    colorIndex++; 
  }
  return textToColorMap[text];
};