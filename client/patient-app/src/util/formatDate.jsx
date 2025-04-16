const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      // Handle unix timestamp in milliseconds
      const date = new Date(parseInt(dateString));
      return date.toLocaleString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

export default formatDate;