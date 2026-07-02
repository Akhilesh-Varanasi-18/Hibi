export const calculatePendingAndEscalated = (arr = []) => {
    return arr.filter(i => ["PENDING", "ESCALATED"].includes(i.Status)).length;
}
// Image cropping utility function
export const cropImageTo16x9 = (file) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas dimensions for 16:9 ratio
        const targetWidth = 1600; // You can adjust this as needed
        const targetHeight = 900; // 1600/900 = 16/9
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        img.onload = () => {
            const sourceWidth = img.width;
            const sourceHeight = img.height;
            
            // Calculate source aspect ratio
            const sourceAspectRatio = sourceWidth / sourceHeight;
            const targetAspectRatio = 16 / 9;
            
            let sourceX = 0;
            let sourceY = 0;
            let drawWidth = sourceWidth;
            let drawHeight = sourceHeight;
            
            // Crop logic to get 16:9 ratio
            if (sourceAspectRatio > targetAspectRatio) {
                // Source is wider than 16:9, crop sides
                drawWidth = sourceHeight * (16 / 9);
                sourceX = (sourceWidth - drawWidth) / 2;
            } else {
                // Source is taller than 16:9, crop top and bottom
                drawHeight = sourceWidth * (9 / 16);
                sourceY = (sourceHeight - drawHeight) / 2;
            }
            
            // Draw cropped image on canvas
            ctx.drawImage(
                img,
                sourceX, sourceY,           // Source x, y
                drawWidth, drawHeight,      // Source width, height
                0, 0,                       // Destination x, y
                targetWidth, targetHeight   // Destination width, height
            );
            
            // Convert canvas to blob
            canvas.toBlob((blob) => {
                if (blob) {
                    // Create new file with cropped image
                    const croppedFile = new File([blob], file.name, {
                        type: 'image/jpeg', // Convert to JPEG for consistency
                        lastModified: Date.now()
                    });
                    
                    // Create preview URL
                    const previewUrl = canvas.toDataURL('image/jpeg');
                    
                    resolve({
                        file: croppedFile,
                        previewUrl: previewUrl
                    });
                } else {
                    reject(new Error('Failed to crop image'));
                }
            }, 'image/jpeg', 0.9); // 90% quality to reduce file size
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
    });
};


export const cropImageTo16x5 = (file) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas dimensions for 16:5 ratio
        const targetWidth = 1600; // You can adjust this as needed
        const targetHeight = 500; // 1600/500 = 16/5
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        img.onload = () => {
            const sourceWidth = img.width;
            const sourceHeight = img.height;
            
            // Calculate source aspect ratio
            const sourceAspectRatio = sourceWidth / sourceHeight;
            const targetAspectRatio = 16 / 5; // 3.2
            
            let sourceX = 0;
            let sourceY = 0;
            let drawWidth = sourceWidth;
            let drawHeight = sourceHeight;
            
            // Crop logic to get 16:5 ratio
            if (sourceAspectRatio > targetAspectRatio) {
                // Source is wider than 16:5, crop sides
                drawWidth = sourceHeight * (16 / 5);
                sourceX = (sourceWidth - drawWidth) / 2;
            } else {
                // Source is taller than 16:5, crop top and bottom
                drawHeight = sourceWidth * (5 / 16);
                sourceY = (sourceHeight - drawHeight) / 2;
            }
            
            // Draw cropped image on canvas
            ctx.drawImage(
                img,
                sourceX, sourceY,           // Source x, y
                drawWidth, drawHeight,      // Source width, height
                0, 0,                       // Destination x, y
                targetWidth, targetHeight   // Destination width, height
            );
            
            // Convert canvas to blob
            canvas.toBlob((blob) => {
                if (blob) {
                    // Create new file with cropped image
                    const croppedFile = new File([blob], file.name, {
                        type: 'image/jpeg', // Convert to JPEG for consistency
                        lastModified: Date.now()
                    });
                    
                    // Create preview URL
                    const previewUrl = canvas.toDataURL('image/jpeg');
                    
                    resolve({
                        file: croppedFile,
                        previewUrl: previewUrl
                    });
                } else {
                    reject(new Error('Failed to crop image'));
                }
            }, 'image/jpeg', 0.9); // 90% quality to reduce file size
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
    });
};
