const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    let date;
    
    // Check if it's a string that needs to be parsed as a number
    if (typeof dateString === 'string' && !isNaN(dateString)) {
      date = new Date(parseInt(dateString));
    } else {
      // Handle ISO date strings by preserving the day
      if (typeof dateString === 'string' && dateString.includes('T')) {
        // Extract just the date part from ISO string to avoid timezone issues
        const datePart = dateString.split('T')[0];
        return datePart; // Return in YYYY-MM-DD format
      }
      
      // Otherwise try to create date directly
      date = new Date(dateString);
    }
    
    // Check if the date is valid (not 1970/1969)
    if (date.getFullYear() <= 1970) {
      console.warn("Invalid date detected:", dateString);
      return 'Invalid date';
    }
    
    // Adjust for timezone to prevent day shift
    // Extract year, month, day directly and format manually to avoid timezone issues
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth is 0-indexed
    const day = date.getDate();
    
    // Format as YYYY-MM-DD to match form input format
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

export default formatDate;