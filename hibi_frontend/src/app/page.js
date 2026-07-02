"use client"

// This is the main page component for the root route ("/")
// It displays a loading message centered both vertically and horizontally
const page = () => (
  <div
    // Center the content in the middle of the screen
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh'
    }}
  >
    {/* Show a loading message to the user */}
    <span>Loading....</span>
  </div>
)

export default page
