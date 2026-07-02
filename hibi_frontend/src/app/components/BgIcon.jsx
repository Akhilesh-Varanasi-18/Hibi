import React from 'react'

// This function is used to convert a hex color to hex with alpha (e.g. "#ff000080" for 50% opacity)
function hexToHexAlpha(hex, alpha = 1) {
    let c = hex.replace('#', '');
    if (c.length === 3) {
        c = c.split('').map((ch) => ch + ch).join('');
    }
    if (c.length !== 6) {
        // fallback to black if invalid
        return "#000000" + Math.round(alpha * 255).toString(16).padStart(2, "0");
    }
    const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, "0");
    return `#${c}${alphaHex}`;
}

const BgIcon = ({ icon: Icon, color="#6d28d9" }) => {
    return (
        <div
        // These is the componenet for the dashboard icons , we are passing colors to this component from the app-sidebar.jsx , but not using them currently
                // style={{
                //     background: `linear-gradient(to top, ${color}, ${hexToHexAlpha(color, 0.6)})`
                // }}
                // className="rounded-md text-white p-[3px] dark:opacity-60"
        >
            {Icon && <Icon size={16}  />}
        </div>
    )
}

export default BgIcon;