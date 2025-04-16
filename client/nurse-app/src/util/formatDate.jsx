const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    let date;
    
    // Check if it's a string that needs to be parsed as a number
    if (typeof dateString === 'string' && !isNaN(dateString)) {
      date = new Date(parseInt(dateString));
    } else {
      // Otherwise try to create date directly
      date = new Date(dateString);
    }
    
    // Check if the date is valid (not 1970/1969)
    if (date.getFullYear() <= 1970) {
      console.warn("Invalid date detected:", dateString);
      return 'Invalid date';
    }
    
    // Format the date nicely
    return date.toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

export default formatDate;