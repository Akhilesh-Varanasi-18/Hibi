// These are not used in the project anymore but is is imported in the project for future reference , thats why it is not deleted
export const colors = {
    graphBg : "#267C57",
    white: {
        main: "#027044",
        BirthDayColor : "#0B617A",
        HolidaysColor : "#0B7B4B",
    },
    dark: {
        main: "#027044",
        secondary: "#ffffff",
        BirthDayColor : "#0B617A",
        HolidaysColor : "#0B7B4B",
    },
} 

// This function is used to change the opacity of a color
export const ColorOpacityChange = (hex, opacity) => {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
        hex = [...hex].map((char) => char + char).join('');
    }

    if (hex.length !== 6) {
        throw new Error('Invalid hex color');
    }

    let alpha = Math.round(Math.min(Math.max(opacity, 0), 1) * 255)
        .toString(16)
        .padStart(2, '0')
        .toUpperCase();

    return `#${hex}${alpha}`;
}